import { useCallback, useMemo, useState } from 'react';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { qk } from '@/api/queryKeys';
import { useDiscounts } from '@/features/pricing/api';
import { addMinutesLocal, type CalendarDate } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { selectionBus } from '@/lib/selectionBus';
import { useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { useSession } from '@/session/SessionProvider';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/Fields';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { SelectField } from '@/ui/Select';
import { EmptyState } from '@/ui/EmptyState';
import { LockKey } from 'phosphor-react-native';
import { View } from 'react-native';

import { useBookingQuote, useCreateBooking } from '../api';
import { CustomerPicker } from '../components/CustomerPicker';
import { QuoteSummary } from '../components/QuoteSummary';
import { SlotPicker, type SlotValue } from '../components/SlotPicker';

type Values = { customerId?: string; slot: SlotValue; discountId?: string; notes: string };

export function BookingFormScreen() {
  const params = useLocalSearchParams<{ courtId?: string; date?: string; startAt?: string; customerId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = useSession();
  const f = useFormat();
  const create = useCreateBooking();
  const discounts = useDiscounts();
  const [saving, setSaving] = useState(false);

  const initialDate = (params.startAt?.slice(0, 10) ?? params.date ?? f.today()) as CalendarDate;
  const form = useForm<Values>(
    {
      customerId: params.customerId,
      slot: { courtId: params.courtId, date: initialDate, durationMinutes: 60, startAt: params.startAt },
      discountId: undefined,
      notes: '',
    },
    useCallback(
      (v: Values) => ({
        customerId: v.customerId ? undefined : 'Choose a customer.',
        courtId: v.slot.courtId ? undefined : 'Choose a court.',
        startAt: v.slot.courtId && !v.slot.startAt ? 'Choose a start time.' : undefined,
        notes: v.notes.length > 500 ? 'Keep notes under 500 characters.' : undefined,
      }),
      [],
    ),
  );

  const setField = form.set;
  // Coming back from "Add a new customer" selects them.
  useFocusEffect(
    useCallback(() => {
      const created = selectionBus.take('customer');
      if (created) setField('customerId', created);
    }, [setField]),
  );

  const { slot, discountId } = form.values;
  const quoteInput = useMemo(
    () => (slot.courtId && slot.startAt ? { courtId: slot.courtId, startAt: slot.startAt, endAt: addMinutesLocal(slot.startAt, slot.durationMinutes), discountId } : null),
    [slot, discountId],
  );
  const quote = useBookingQuote(quoteInput);

  const activeDiscounts = (discounts.data ?? []).filter((d) => d.active);
  const discountMissed = !!discountId && !!quote.data && quote.data.discountAmount === 0 && !quote.isFetching;

  if (!can('booking.create')) {
    return (
      <Screen>
        <EmptyState icon={LockKey} title="No access" message="You don't have permission to create bookings." />
      </Screen>
    );
  }

  const submit = async () => {
    setSaving(true);
    await form.submit(async (v) => {
      try {
        const booking = await create.mutateAsync({
          customerId: v.customerId!,
          courtId: v.slot.courtId!,
          startAt: v.slot.startAt!,
          endAt: addMinutesLocal(v.slot.startAt!, v.slot.durationMinutes),
          discountId: v.discountId,
          notes: v.notes.trim() || undefined,
        });
        router.replace(routes.booking(booking.id));
      } catch (e) {
        // Someone may have taken the slot: refresh open times.
        void queryClient.invalidateQueries({ queryKey: qk.availability });
        throw e;
      }
    });
    setSaving(false);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'New booking' }} />
      <Screen keyboard footer={<Button label="Create booking" block onPress={submit} loading={saving} />}>
        <CustomerPicker
          value={form.values.customerId}
          onChange={(id) => form.set('customerId', id)}
          error={form.errors.customerId}
          onCreateNew={can('customer.manage') ? () => router.push(routes.customerNew({ returnTo: 'booking' })) : undefined}
        />

        <View>
          <SectionHeader title="Court and time" />
          <SlotPicker value={slot} onChange={(s) => form.set('slot', s)} courtError={form.errors.courtId} slotError={form.errors.startAt} />
        </View>

        <SelectField
          label="Discount"
          optional
          value={discountId ?? ''}
          placeholder="No discount"
          options={[{ value: '', label: 'No discount' }, ...activeDiscounts.map((d) => ({ value: d.id, label: d.name, description: d.code ? `Code ${d.code}` : undefined }))]}
          onChange={(v) => form.set('discountId', v || undefined)}
          helper={discountMissed ? "This discount doesn't apply to the chosen court or time." : undefined}
          error={form.errors.discountId}
        />

        <TextField
          label="Notes"
          optional
          multiline
          value={form.values.notes}
          onChangeText={(t) => form.set('notes', t)}
          error={form.errors.notes}
          placeholder="For example: bring extra rackets"
          maxLength={500}
        />

        <QuoteSummary quote={quote.data} loading={quote.isFetching} error={quote.isError} />
      </Screen>
    </>
  );
}

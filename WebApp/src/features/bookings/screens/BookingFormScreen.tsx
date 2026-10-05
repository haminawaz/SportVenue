'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CourtBasketball, Plus } from '@phosphor-icons/react';

import { qk } from '@/api/queryKeys';
import { useCourts } from '@/features/courts/api';
import { useDiscounts } from '@/features/pricing/api';
import { addMinutesLocal, type CalendarDate } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { formDraft } from '@/lib/formDraft';
import { selectionBus } from '@/lib/selectionBus';
import { useForm } from '@/lib/useForm';
import { useQueryParams } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { TextField } from '@/ui/Fields';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { SelectField } from '@/ui/Select';
import { StackHeader } from '@/ui/StackHeader';

import { useBookingQuote, useCreateBooking } from '../api';
import { CustomerPicker } from '../components/CustomerPicker';
import { QuoteSummary } from '../components/QuoteSummary';
import { SlotPicker, type SlotValue } from '../components/SlotPicker';

type Values = { customerId?: string; slot: SlotValue; discountId?: string; notes: string };

const DRAFT_KEY = 'booking-new';

export function BookingFormScreen() {
  const params = useQueryParams('courtId', 'date', 'startAt', 'customerId');
  const router = useAppRouter();
  const queryClient = useQueryClient();
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

  // Coming back from "Add a new customer": restore what was filled in, then select them.
  const { patch, set: setField } = form;
  useEffect(() => {
    const draft = formDraft.take<Values>(DRAFT_KEY);
    if (draft) patch(draft);
    const created = selectionBus.take('customer');
    if (created) setField('customerId', created);
  }, [patch, setField]);

  const { slot, discountId } = form.values;
  const quoteInput = useMemo(
    () => (slot.courtId && slot.startAt ? { courtId: slot.courtId, startAt: slot.startAt, endAt: addMinutesLocal(slot.startAt, slot.durationMinutes), discountId } : null),
    [slot, discountId],
  );
  const quote = useBookingQuote(quoteInput);

  const courts = useCourts();
  const activeDiscounts = (discounts.data ?? []).filter((d) => d.active);
  const discountMissed = !!discountId && !!quote.data && quote.data.discountAmount === 0 && !quote.isFetching;

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

  // A new facility has nothing to book yet: say so instead of showing a form that cannot be completed.
  if (courts.isSuccess && !courts.data.some((c) => c.status === 'ACTIVE')) {
    const none = courts.data.length === 0;
    return (
      <>
        <StackHeader title="New booking" />
        <Screen>
          <EmptyState
            icon={CourtBasketball}
            title={none ? 'Add a court first' : 'No courts are taking bookings'}
            message={none ? 'Bookings are made on a court. Add one, then come back to book.' : 'Set a court to active to take bookings on it.'}
            action={<Button label={none ? 'Add court' : 'View courts'} icon={none ? Plus : undefined} onPress={() => router.push(none ? routes.courtNew : routes.courts)} />}
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <StackHeader title="New booking" />
      <Screen footer={<Button label="Create booking" block onPress={submit} loading={saving} />}>
        <CustomerPicker
          value={form.values.customerId}
          onChange={(id) => form.set('customerId', id)}
          error={form.errors.customerId}
          onCreateNew={() => {
            formDraft.put(DRAFT_KEY, form.values);
            router.push(routes.customerNew({ returnTo: 'booking' }));
          }}
        />

        <section>
          <SectionHeader title="Court and time" />
          <SlotPicker value={slot} onChange={(s) => form.set('slot', s)} courtError={form.errors.courtId} slotError={form.errors.startAt} />
        </section>

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

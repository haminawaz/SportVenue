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
import { Card, CardHeader } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { SelectField, TextField } from '@/ui/Fields';
import { Page, PageHeader } from '@/ui/Page';

import { useBookingQuote, useCreateBooking } from '../api';
import { CustomerPicker } from '../components/CustomerPicker';
import { QuoteSummary } from '../components/QuoteSummary';
import { SlotPicker, type SlotValue } from '../components/SlotPicker';

type Values = { customerId?: string; slot: SlotValue; discountId?: string; notes: string };

const DRAFT_KEY = 'booking-new';
const CRUMBS = [{ label: 'Bookings', href: routes.bookings }, { label: 'New booking' }];

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
      <Page width="form">
        <PageHeader breadcrumbs={CRUMBS} title="New booking" />
        <Card>
          <EmptyState
            icon={CourtBasketball}
            title={none ? 'Add a court first' : 'No courts are taking bookings'}
            message={none ? 'Bookings are made on a court. Add one, then come back to book.' : 'Set a court to active to take bookings on it.'}
            action={<Button label={none ? 'Add court' : 'View courts'} icon={none ? Plus : undefined} onPress={() => router.push(none ? routes.courtNew : routes.courts)} />}
          />
        </Card>
      </Page>
    );
  }

  return (
    <Page width="wide">
      <PageHeader breadcrumbs={CRUMBS} title="New booking" description="Choose the customer and an open slot. The price is calculated by the server." />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card padded={false}>
            <CardHeader title="Customer" />
            <div className="p-5">
              <CustomerPicker
                value={form.values.customerId}
                onChange={(id) => form.set('customerId', id)}
                error={form.errors.customerId}
                onCreateNew={() => {
                  formDraft.put(DRAFT_KEY, form.values);
                  router.push(routes.customerNew({ returnTo: 'booking' }));
                }}
              />
            </div>
          </Card>
          <Card padded={false}>
            <CardHeader title="Court and time" />
            <div className="p-5">
              <SlotPicker value={slot} onChange={(s) => form.set('slot', s)} courtError={form.errors.courtId} slotError={form.errors.startAt} />
            </div>
          </Card>
          <Card padded={false}>
            <CardHeader title="Discount and notes" />
            <div className="flex flex-col gap-5 p-5">
              <SelectField
                label="Discount"
                optional
                value={discountId ?? ''}
                options={[{ value: '', label: 'No discount' }, ...activeDiscounts.map((d) => ({ value: d.id, label: d.name, description: d.code ? `Code ${d.code}` : undefined }))]}
                onChange={(v) => form.set('discountId', v || undefined)}
                helper={discountMissed ? "This discount doesn't apply to the chosen court or time." : undefined}
                error={form.errors.discountId}
              />
              <TextField
                label="Notes"
                optional
                multiline
                rows={3}
                value={form.values.notes}
                onChangeText={(t) => form.set('notes', t)}
                error={form.errors.notes}
                placeholder="For example: bring extra rackets"
                maxLength={500}
              />
            </div>
          </Card>
        </div>
        <aside className="lg:sticky lg:top-20">
          <Card padded={false}>
            <CardHeader title="Price" />
            <div className="flex flex-col gap-4 p-5">
              <QuoteSummary quote={quote.data} loading={quote.isFetching} error={quote.isError} />
              <Button label="Create booking" size="lg" block onPress={submit} loading={saving} />
              <Button label="Cancel" variant="ghost" block onPress={() => router.back(routes.bookings)} />
            </div>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

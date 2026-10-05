'use client';

import { useCallback, useEffect, useState } from 'react';

import type { BookingDetail } from '@/domain/types';
import { formDraft } from '@/lib/formDraft';
import { selectionBus } from '@/lib/selectionBus';
import { useForm } from '@/lib/useForm';
import { useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { TextField } from '@/ui/Fields';
import { FormActions, FormSection, Page, PageHeader } from '@/ui/Page';
import { Notice, QueryView } from '@/ui/States';

import { useBooking, useUpdateBooking } from '../api';
import { CustomerPicker } from '../components/CustomerPicker';

type Values = { customerId: string; notes: string };

export function BookingEditScreen() {
  const id = useRouteParam('id');
  const query = useBooking(id);
  return (
    <Page width="form">
      <QueryView query={query} errorTitle="Couldn't load booking">
        {(b) => <EditForm booking={b} />}
      </QueryView>
    </Page>
  );
}

function EditForm({ booking: b }: { booking: BookingDetail }) {
  const router = useAppRouter();
  const update = useUpdateBooking(b.id);
  const [saving, setSaving] = useState(false);
  const form = useForm<Values>(
    { customerId: b.customerId, notes: b.notes ?? '' },
    useCallback((v: Values) => ({ notes: v.notes.length > 500 ? 'Keep notes under 500 characters.' : undefined }), []),
  );
  const locked = b.paid > 0;
  const draftKey = `booking-edit:${b.id}`;

  // Coming back from "Add a new customer": restore the edits, then select the new customer.
  const { patch, set: setField } = form;
  useEffect(() => {
    const draft = formDraft.take<Values>(draftKey);
    if (draft) patch(draft);
    const created = selectionBus.take('customer');
    if (created && !locked) setField('customerId', created);
  }, [draftKey, patch, setField, locked]);

  useEffect(() => {
    if (b.status === 'CANCELLED') router.back(routes.booking(b.id));
  }, [b.status, b.id, router]);

  const save = async () => {
    setSaving(true);
    const ok = await form.submit((v) => update.mutateAsync({ customerId: v.customerId !== b.customerId ? v.customerId : undefined, notes: v.notes }));
    setSaving(false);
    if (ok) router.back(routes.booking(b.id));
  };

  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Bookings', href: routes.bookings }, { label: b.reference, href: routes.booking(b.id) }, { label: 'Edit' }]} title="Edit booking" description="Change who the booking is for, or its notes. Use Reschedule to move it." hideRefresh />
      <Card>
        <FormSection title="Customer" description="Who the booking is for.">
          {locked && <Notice message="A payment has been recorded, so the customer can't be changed. Cancel and rebook if it was booked under the wrong name." />}
          <CustomerPicker
            value={form.values.customerId}
            onChange={(id) => form.set('customerId', id)}
            disabled={locked}
            error={form.errors.customerId}
            onCreateNew={() => {
              formDraft.put(draftKey, form.values);
              router.push(routes.customerNew({ returnTo: 'booking' }));
            }}
          />
        </FormSection>
        <FormSection title="Notes" description="Visible to your team on the booking.">
          <TextField label="Notes" optional multiline value={form.values.notes} onChangeText={(t) => form.set('notes', t)} error={form.errors.notes} maxLength={500} />
        </FormSection>
      </Card>
      <FormActions>
        <Button label="Cancel" variant="secondary" onPress={() => router.back(routes.booking(b.id))} />
        <Button label="Save changes" onPress={save} loading={saving} disabled={!form.dirty} />
      </FormActions>
    </>
  );
}

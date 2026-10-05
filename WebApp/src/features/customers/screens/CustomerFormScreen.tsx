'use client';

import { useCallback, useState } from 'react';

import type { CustomerDetail, Weekday } from '@/domain/types';
import { useCourts } from '@/features/courts/api';
import { clockOptions, formatClock, formatDuration, WEEK_ORDER, WEEKDAY_LONG } from '@/lib/format';
import { selectionBus } from '@/lib/selectionBus';
import { rules, useForm } from '@/lib/useForm';
import { useQueryParams, useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { SelectField, SwitchRow, TextField } from '@/ui/Fields';
import { FormActions, FormSection, Page, PageHeader } from '@/ui/Page';
import { QueryView } from '@/ui/States';

import { useCreateCustomer, useCustomer, useUpdateCustomer } from '../api';

export function CustomerFormScreen() {
  const id = useRouteParam('id');
  const query = useCustomer(id);
  return (
    <Page width="form">
      {!id ? (
        <CustomerForm />
      ) : (
        <QueryView query={query} errorTitle="Couldn't load customer">
          {(c) => <CustomerForm customer={c} />}
        </QueryView>
      )}
    </Page>
  );
}

type Values = {
  name: string;
  phone: string;
  email: string;
  isRegular: boolean;
  regularCourt?: string;
  regularWeekday: string;
  regularTime?: string;
  regularDuration: string;
  note: string;
};

function CustomerForm({ customer }: { customer?: CustomerDetail }) {
  const router = useAppRouter();
  const { returnTo } = useQueryParams('returnTo');
  const courts = useCourts();
  const create = useCreateCustomer();
  const update = useUpdateCustomer(customer?.id ?? '');
  const [saving, setSaving] = useState(false);
  const slot = customer?.regularSlot;

  const form = useForm<Values>(
    {
      name: customer?.name ?? '',
      phone: customer?.phone ?? '',
      email: customer?.email ?? '',
      isRegular: customer?.isRegular ?? false,
      regularCourt: slot?.courtId,
      regularWeekday: String(slot?.weekday ?? 2),
      regularTime: slot?.startTime,
      regularDuration: String(slot?.durationMinutes ?? 60),
      note: '',
    },
    useCallback(
      (v: Values) => ({
        name: v.name.trim().length < 2 ? 'Enter the customer name.' : undefined,
        phone: rules.phone(v.phone),
        email: rules.email(v.email, false),
        regularCourt: v.isRegular && (v.regularTime || v.regularCourt) && !v.regularCourt ? 'Choose a court.' : undefined,
        regularTime: v.isRegular && v.regularCourt && !v.regularTime ? 'Choose a start time.' : undefined,
      }),
      [],
    ),
  );

  const save = async () => {
    setSaving(true);
    await form.submit(async (v) => {
      const input = {
        name: v.name.trim(),
        phone: v.phone.trim(),
        email: v.email.trim() || undefined,
        isRegular: v.isRegular,
        regularSlot: v.isRegular && v.regularCourt && v.regularTime ? { courtId: v.regularCourt, weekday: Number(v.regularWeekday) as Weekday, startTime: v.regularTime, durationMinutes: Number(v.regularDuration) } : undefined,
      };
      if (customer) {
        await update.mutateAsync(input);
        router.back(routes.customer(customer.id));
        return;
      }
      const created = await create.mutateAsync({ ...input, note: v.note.trim() || undefined });
      if (returnTo === 'booking') {
        selectionBus.put('customer', created.id);
        router.back(routes.bookingNew({ customerId: created.id }));
      } else {
        router.replace(routes.customer(created.id));
      }
    });
    setSaving(false);
  };

  const back = customer ? routes.customer(customer.id) : returnTo === 'booking' ? routes.bookingNew() : routes.customers;

  return (
    <>
      <PageHeader
        breadcrumbs={customer ? [{ label: 'Customers', href: routes.customers }, { label: customer.name, href: routes.customer(customer.id) }, { label: 'Edit' }] : [{ label: 'Customers', href: routes.customers }, { label: 'Add customer' }]}
        title={customer ? 'Edit customer' : 'Add customer'}
        description={!customer && returnTo === 'booking' ? 'Once saved, you go back to the booking with this customer selected.' : undefined}
        hideRefresh
      />
      <Card>
        <FormSection title="Contact details" description="The phone number is used for reminders and to find them quickly.">
          <TextField label="Full name" value={form.values.name} onChangeText={(t) => form.set('name', t)} error={form.errors.name} autoCapitalize="words" autoComplete="name" maxLength={80} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Phone" value={form.values.phone} onChangeText={(t) => form.set('phone', t)} error={form.errors.phone} type="tel" autoComplete="tel" placeholder="+92 300 1234567" />
            <TextField label="Email" optional value={form.values.email} onChangeText={(t) => form.set('email', t)} error={form.errors.email} type="email" autoCapitalize="none" autoComplete="email" />
          </div>
        </FormSection>
        <FormSection title="Regular customer" description="Regulars are highlighted and can keep a fixed weekly slot.">
          <SwitchRow label="Plays every week" value={form.values.isRegular} onChange={(v) => form.set('isRegular', v)} />
          {form.values.isRegular && (
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                label="Usual court"
                optional
                value={form.values.regularCourt}
                options={(courts.data ?? []).map((c) => ({ value: c.id, label: c.name, description: c.sport }))}
                onChange={(v) => form.set('regularCourt', v)}
                error={form.errors.regularCourt}
              />
              <SelectField label="Day" value={form.values.regularWeekday} options={WEEK_ORDER.map((d) => ({ value: String(d), label: WEEKDAY_LONG[d] }))} onChange={(v) => form.set('regularWeekday', v)} />
              <SelectField
                label="Time"
                value={form.values.regularTime}
                placeholder="Choose"
                options={clockOptions('06:00', '23:00').map((t) => ({ value: t, label: formatClock(t) }))}
                onChange={(v) => form.set('regularTime', v)}
                error={form.errors.regularTime}
              />
              <SelectField label="Length" value={form.values.regularDuration} options={[60, 90, 120].map((d) => ({ value: String(d), label: formatDuration(d) }))} onChange={(v) => form.set('regularDuration', v)} />
            </div>
          )}
        </FormSection>
        {!customer && (
          <FormSection title="First note" description="Anything the team should know.">
            <TextField label="Note" optional multiline rows={3} value={form.values.note} onChangeText={(t) => form.set('note', t)} maxLength={1000} />
          </FormSection>
        )}
      </Card>
      <FormActions>
        <Button label="Cancel" variant="secondary" onPress={() => router.back(back)} />
        <Button label={customer ? 'Save customer' : 'Add customer'} onPress={save} loading={saving} disabled={!!customer && !form.dirty} />
      </FormActions>
    </>
  );
}

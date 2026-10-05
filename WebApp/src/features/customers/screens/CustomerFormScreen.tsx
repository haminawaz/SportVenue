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
import { SwitchRow, TextField } from '@/ui/Fields';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { SelectField } from '@/ui/Select';
import { StackHeader } from '@/ui/StackHeader';
import { QueryView } from '@/ui/States';

import { useCreateCustomer, useCustomer, useUpdateCustomer } from '../api';

export function CustomerFormScreen() {
  const id = useRouteParam('id');
  const query = useCustomer(id);
  if (!id) {
    return (
      <>
        <StackHeader title="Add customer" />
        <CustomerForm />
      </>
    );
  }
  return (
    <>
      <StackHeader title="Edit customer" />
      <QueryView query={query} errorTitle="Couldn't load customer">
        {(c) => <CustomerForm customer={c} />}
      </QueryView>
    </>
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
        regularSlot:
          v.isRegular && v.regularCourt && v.regularTime
            ? { courtId: v.regularCourt, weekday: Number(v.regularWeekday) as Weekday, startTime: v.regularTime, durationMinutes: Number(v.regularDuration) }
            : undefined,
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

  return (
    <Screen footer={<Button label={customer ? 'Save customer' : 'Add customer'} block onPress={save} loading={saving} disabled={!!customer && !form.dirty} />}>
      <TextField label="Full name" value={form.values.name} onChangeText={(t) => form.set('name', t)} error={form.errors.name} autoCapitalize="words" autoComplete="name" maxLength={80} />
      <TextField
        label="Phone"
        value={form.values.phone}
        onChangeText={(t) => form.set('phone', t)}
        error={form.errors.phone}
        type="tel"
        autoComplete="tel"
        placeholder="+92 300 1234567"
        helper="Used for reminders and to find them quickly."
      />
      <TextField label="Email" optional value={form.values.email} onChangeText={(t) => form.set('email', t)} error={form.errors.email} type="email" autoCapitalize="none" autoComplete="email" />

      <section>
        <SectionHeader title="Regular customer" />
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <SwitchRow label="Plays every week" description="Regulars are highlighted and can keep a fixed weekly slot." value={form.values.isRegular} onChange={(v) => form.set('isRegular', v)} />
        </div>
      </section>

      {form.values.isRegular && (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Usual court"
            optional
            value={form.values.regularCourt}
            options={(courts.data ?? []).map((c) => ({ value: c.id, label: c.name, description: c.sport }))}
            onChange={(v) => form.set('regularCourt', v)}
            error={form.errors.regularCourt}
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Day"
              value={form.values.regularWeekday}
              options={WEEK_ORDER.map((d) => ({ value: String(d), label: WEEKDAY_LONG[d] }))}
              onChange={(v) => form.set('regularWeekday', v)}
            />
            <SelectField
              label="Time"
              value={form.values.regularTime}
              placeholder="Choose"
              options={clockOptions('06:00', '23:00').map((t) => ({ value: t, label: formatClock(t) }))}
              onChange={(v) => form.set('regularTime', v)}
              error={form.errors.regularTime}
            />
          </div>
          <SelectField
            label="Length"
            value={form.values.regularDuration}
            options={[60, 90, 120].map((d) => ({ value: String(d), label: formatDuration(d) }))}
            onChange={(v) => form.set('regularDuration', v)}
          />
        </div>
      )}

      {!customer && (
        <TextField label="First note" optional multiline value={form.values.note} onChangeText={(t) => form.set('note', t)} placeholder="Anything the team should know" maxLength={1000} />
      )}
    </Screen>
  );
}

'use client';

import { useCallback, useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react';

import { PAYMENT_METHOD } from '@/domain/labels';
import type { BookingDetail, PaymentMethod } from '@/domain/types';
import { useBooking } from '@/features/bookings/api';
import { formatDayAndTime } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { parseMoney, rules, useForm } from '@/lib/useForm';
import { useQueryParams } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { FieldShell, TextField } from '@/ui/Fields';
import { Page, PageHeader } from '@/ui/Page';
import { DescriptionList, QueryView } from '@/ui/States';
import { SegmentedControl } from '@/ui/Tabs';
import { cn } from '@/ui/cn';

import { useRecordPayment } from '../api';

export function RecordPaymentScreen() {
  const { bookingId = '' } = useQueryParams('bookingId');
  const query = useBooking(bookingId);
  return (
    <Page width="wide">
      <QueryView query={query} errorTitle="Couldn't load booking">
        {(b) => <RecordForm booking={b} />}
      </QueryView>
    </Page>
  );
}

type Values = { mode: 'full' | 'partial'; amount: string; method?: PaymentMethod; note: string };

function RecordForm({ booking: b }: { booking: BookingDetail }) {
  const router = useAppRouter();
  const f = useFormat();
  const record = useRecordPayment();
  const [saving, setSaving] = useState(false);
  const due = b.outstanding;

  const form = useForm<Values>(
    { mode: 'full', amount: String(due), method: 'CASH', note: '' },
    useCallback(
      (v: Values) => {
        const amount = parseMoney(v.amount);
        return {
          amount: rules.money(v.amount) ?? (amount > due ? `The balance is ${f.money(due)}. Enter that amount or less.` : undefined),
          method: v.method ? undefined : 'Choose how they paid.',
        };
      },
      [due, f],
    ),
  );

  const crumbs = [{ label: 'Bookings', href: routes.bookings }, { label: b.reference, href: routes.booking(b.id) }, { label: 'Record payment' }];

  if (due <= 0 || b.status === 'CANCELLED') {
    return (
      <>
        <PageHeader breadcrumbs={crumbs} title="Record payment" hideRefresh />
        <Card>
          <EmptyState
            icon={CheckCircle}
            title={b.status === 'CANCELLED' ? 'Booking cancelled' : 'Already paid'}
            message={b.status === 'CANCELLED' ? 'Payments cannot be recorded on a cancelled booking.' : `${b.customerName} has paid this booking in full.`}
            action={<Button label="Back to booking" variant="secondary" onPress={() => router.back(routes.booking(b.id))} />}
          />
        </Card>
      </>
    );
  }

  const amount = parseMoney(form.values.amount);
  const remaining = Number.isNaN(amount) ? due : Math.max(0, Math.round((due - amount) * 100) / 100);

  const save = async () => {
    setSaving(true);
    const ok = await form.submit((v) => record.mutateAsync({ bookingId: b.id, amount: parseMoney(v.amount), method: v.method!, note: v.note.trim() || undefined }));
    setSaving(false);
    if (ok) router.back(routes.booking(b.id));
  };

  return (
    <>
      <PageHeader breadcrumbs={crumbs} title="Record payment" description={`Against booking ${b.reference}`} hideRefresh />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card padded={false}>
          <CardHeader title="Payment" />
          <div className="flex flex-col gap-5 p-5">
            <FieldShell label="Payment type">
              <div>
                <SegmentedControl
                  label="Payment type"
                  value={form.values.mode}
                  onChange={(mode) => form.patch({ mode, amount: mode === 'full' ? String(due) : '' })}
                  options={[
                    { value: 'full', label: 'Full balance' },
                    { value: 'partial', label: 'Part payment' },
                  ]}
                />
              </div>
            </FieldShell>
            <TextField
              label="Amount received"
              value={form.values.amount}
              onChangeText={(t) => form.patch({ amount: t, mode: parseMoney(t) === due ? 'full' : 'partial' })}
              error={form.errors.amount}
              inputMode="decimal"
              prefix={f.currency}
              helper={!Number.isNaN(amount) && amount > 0 && amount <= due ? (remaining > 0 ? `${f.money(remaining)} will still be due.` : 'This settles the booking.') : undefined}
              className="sm:max-w-sm"
            />
            <FieldShell label="Paid by" error={form.errors.method}>
              <div role="radiogroup" aria-label="Paid by" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(PAYMENT_METHOD) as PaymentMethod[]).map((m) => {
                  const Icon = PAYMENT_METHOD[m].icon;
                  const on = form.values.method === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => form.set('method', m)}
                      className={cn('t-label flex h-16 flex-col items-center justify-center gap-1 rounded-control border transition-colors', on ? 'border-text bg-surface-muted text-text ring-1 ring-text' : 'border-border-strong text-text-muted hover:text-text')}
                    >
                      <Icon size={20} aria-hidden />
                      {PAYMENT_METHOD[m].label}
                    </button>
                  );
                })}
              </div>
            </FieldShell>
            <TextField label="Note" optional multiline rows={3} value={form.values.note} onChangeText={(t) => form.set('note', t)} placeholder="For example: transfer reference" maxLength={300} />
          </div>
        </Card>
        <aside className="lg:sticky lg:top-20">
          <Card padded={false}>
            <CardHeader title="Booking" />
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-center gap-3">
                <Avatar name={b.customerName} size={40} />
                <div className="flex min-w-0 flex-col">
                  <AppText variant="text-strong">{b.customerName}</AppText>
                  <AppText variant="small" tone="muted">
                    {b.courtName} · {formatDayAndTime(b.startAt, f.timeZone, f.today())}
                  </AppText>
                </div>
              </div>
              <DescriptionList
                items={[
                  { label: 'Total', value: f.money(b.total) },
                  { label: 'Paid', value: f.money(b.paid) },
                  { label: 'Due', value: <span className="t-text-strong text-warning">{f.money(due)}</span> },
                ]}
              />
              <Button label={form.values.mode === 'full' ? 'Record full payment' : 'Record payment'} size="lg" block onPress={save} loading={saving} />
              <Button label="Cancel" variant="ghost" block onPress={() => router.back(routes.booking(b.id))} />
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}

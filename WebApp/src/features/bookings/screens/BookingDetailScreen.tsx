'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowsLeftRight, Bell, CalendarX, CheckCircle, NotePencil, Phone, Receipt, User, UserMinus } from '@phosphor-icons/react';

import { BOOKING_STATUS, CANCEL_REASONS, PAYMENT_METHOD, PAYMENT_STATUS } from '@/domain/labels';
import type { BookingDetail, PaymentMethod } from '@/domain/types';
import { useRecordPayment } from '@/features/payments/api';
import { facilityWallClock, formatCalendarDate, formatDayAndTime, formatTime, minutesBetweenLocal, nowLocalIn } from '@/lib/datetime';
import { formatDuration, useFormat } from '@/lib/format';
import { useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { DataTable } from '@/ui/DataTable';
import { ConfirmDialog } from '@/ui/Dialogs';
import { SelectField, SwitchRow } from '@/ui/Fields';
import { Menu, type MenuAction } from '@/ui/Menu';
import { DetailLayout, Page, PageHeader } from '@/ui/Page';
import { DescriptionList, Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';
import { Timeline } from '@/ui/Timeline';

import { useBooking, useCancelBooking, useSendReminder, useSetBookingStatus } from '../api';

export function BookingDetailScreen() {
  const id = useRouteParam('id');
  const query = useBooking(id);

  return (
    <Page onRefresh={() => query.refetch()}>
      <QueryView query={query} errorTitle="Couldn't load booking">
        {(b) => <BookingBody booking={b} />}
      </QueryView>
    </Page>
  );
}

function BookingBody({ booking: b }: { booking: BookingDetail }) {
  const router = useAppRouter();
  const f = useFormat();
  const tz = f.timeZone;

  const [dialog, setDialog] = useState<'cancel' | 'paid' | 'noShow' | null>(null);
  const [reason, setReason] = useState<string | undefined>();
  const [reasonError, setReasonError] = useState<string>();
  const [refund, setRefund] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('CASH');

  const cancel = useCancelBooking(b.id);
  const setStatus = useSetBookingStatus(b.id);
  const remind = useSendReminder();
  const record = useRecordPayment();

  const clock = facilityWallClock(b.startAt, tz);
  const duration = minutesBetweenLocal(b.startAt, b.endAt);
  const status = BOOKING_STATUS[b.status];
  const pay = PAYMENT_STATUS[b.paymentStatus];
  const open = b.status === 'CONFIRMED' || b.status === 'PENDING';
  const started = b.startAt.slice(0, 16) <= nowLocalIn(tz).slice(0, 16);
  const owes = b.outstanding > 0;
  const time = `${formatTime(b.startAt, tz)} - ${formatTime(b.endAt, tz)}`;

  const more: MenuAction[] = [];
  if (owes) more.push({ key: 'paid', label: 'Mark as paid', icon: CheckCircle, onSelect: () => setDialog('paid') });
  if (owes) more.push({ key: 'remind', label: 'Send payment reminder', icon: Bell, onSelect: () => remind.mutate(b.id) });
  if (open && started) more.push({ key: 'done', label: 'Mark as completed', icon: CheckCircle, onSelect: () => setStatus.mutate('COMPLETED') });
  if (open && started) more.push({ key: 'noShow', label: 'Mark as no-show', icon: UserMinus, onSelect: () => setDialog('noShow') });
  if (b.status === 'NO_SHOW') more.push({ key: 'undo', label: 'Undo no-show', icon: CheckCircle, onSelect: () => setStatus.mutate('COMPLETED') });
  if (open) more.push({ key: 'cancel', label: 'Cancel booking', icon: CalendarX, destructive: true, onSelect: () => setDialog('cancel') });

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Bookings', href: routes.bookings }, { label: b.reference }]}
        title={`${b.customerName}, ${formatCalendarDate(clock.date)}`}
        meta={
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge label={status.label} tone={status.tone} />
            {(b.status !== 'CANCELLED' || b.paymentStatus === 'REFUNDED') && <StatusBadge label={pay.label} tone={pay.tone} />}
          </div>
        }
        description={`${b.reference} · ${b.courtName} · ${time} · ${formatDuration(duration)}`}
        actions={
          <>
            {open && <Button label="Edit" icon={NotePencil} variant="secondary" onPress={() => router.push(routes.bookingEdit(b.id))} />}
            {open && <Button label="Reschedule" icon={ArrowsLeftRight} variant="secondary" onPress={() => router.push(routes.bookingReschedule(b.id))} />}
            {owes && <Button label="Record payment" icon={Receipt} onPress={() => router.push(routes.recordPayment(b.id))} />}
            {b.status !== 'CANCELLED' && <Menu label="More booking actions" actions={more} />}
          </>
        }
      />

      {b.status === 'CANCELLED' && <Notice tone="warning" title="Cancelled" message={b.cancelReason ? `Reason: ${b.cancelReason}` : 'This booking was cancelled.'} />}
      {b.status === 'NO_SHOW' && <Notice tone="danger" title="No-show" message="The customer did not arrive for this booking." />}

      <DetailLayout
        main={
          <>
            <Card padded={false}>
              <CardHeader title="Payment" />
              <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-[minmax(0,1fr)_240px]">
                <DescriptionList
                  items={[
                    { label: 'Court price', value: f.money(b.price) },
                    b.discountAmount > 0 && { label: b.discountName ?? 'Discount', value: <span className="text-accent">-{f.money(b.discountAmount)}</span> },
                    { label: 'Total', value: <span className="t-text-strong">{f.money(b.total)}</span> },
                    { label: 'Paid', value: f.money(b.paid) },
                  ]}
                />
                {b.status !== 'CANCELLED' && (
                  <div className={owes ? 'flex flex-col gap-3 rounded-card bg-warning-soft p-4' : 'flex flex-col gap-3 rounded-card bg-accent-soft p-4'}>
                    <AppText variant="label" tone="muted">
                      {owes ? 'Still to pay' : 'Nothing to pay'}
                    </AppText>
                    <AppText variant="stat" numeric tone={owes ? 'warning' : 'accent'} aria-label={f.moneyA11y(b.outstanding)}>
                      {f.money(b.outstanding)}
                    </AppText>
                    {owes && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" label="Mark as paid" icon={CheckCircle} onPress={() => setDialog('paid')} />
                        <Button size="sm" variant="ghost" label="Remind" icon={Bell} loading={remind.isPending} onPress={() => remind.mutate(b.id)} aria-label={`Remind ${b.customerName} to pay`} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {b.payments.length > 0 && (
              <Card padded={false}>
                <CardHeader title="Payments received" count={b.payments.length} />
                <DataTable
                  caption="Payments received"
                  rows={b.payments}
                  rowKey={(p) => p.id}
                  rowHref={(p) => routes.payment(p.id)}
                  dense
                  columns={[
                    { key: 'when', header: 'Received', primary: true, cell: (p) => <span className="whitespace-nowrap">{formatDayAndTime(p.receivedAt, tz, f.today())}</span> },
                    { key: 'method', header: 'Method', cell: (p) => PAYMENT_METHOD[p.method].label },
                    { key: 'by', header: 'Recorded by', hideBelow: 'md', cell: (p) => <span className="text-text-muted">{p.recordedBy}</span> },
                    { key: 'amount', header: 'Amount', align: 'right', cell: (p) => <span className="t-text-strong">{f.money(p.amount)}</span> },
                  ]}
                />
              </Card>
            )}

            {b.notes && (
              <Card padded={false}>
                <CardHeader title="Notes" />
                <AppText as="p" className="p-5 whitespace-pre-line">
                  {b.notes}
                </AppText>
              </Card>
            )}

            <Card padded={false}>
              <CardHeader title="History" />
              <div className="p-5">
                <Timeline items={b.history.map((h) => ({ id: h.id, title: h.description, meta: `${formatDayAndTime(h.at, tz, f.today())} · ${h.actor}` }))} />
              </div>
            </Card>
          </>
        }
        side={
          <>
            <Card padded={false}>
              <CardHeader title="Customer" />
              <div className="flex flex-col gap-4 p-5">
                <Link href={routes.customer(b.customerId)} className="group flex items-center gap-3" aria-label={`${b.customerName}, open customer profile`}>
                  <Avatar name={b.customerName} size={44} tone="accent" />
                  <span className="flex min-w-0 flex-col">
                    <AppText variant="text-strong" className="group-hover:underline">
                      {b.customerName}
                    </AppText>
                    <AppText variant="small" tone="muted">
                      {b.customerPhone}
                    </AppText>
                  </span>
                </Link>
                <div className="flex flex-wrap gap-2">
                  {!!b.customerPhone && (
                    <a href={`tel:${b.customerPhone.replace(/\s/g, '')}`} aria-label={`Call ${b.customerName}`} className="t-label inline-flex h-8 items-center gap-1.5 rounded-control border border-border-strong bg-surface px-3 hover:bg-surface-muted">
                      <Phone size={15} weight="bold" aria-hidden />
                      Call
                    </a>
                  )}
                  <Button size="sm" variant="secondary" label="View profile" icon={User} href={routes.customer(b.customerId)} />
                </div>
              </div>
            </Card>
            <Card padded={false}>
              <CardHeader title="Details" />
              <div className="px-5 py-2">
                <DescriptionList
                  items={[
                    { label: 'Date', value: formatCalendarDate(clock.date) },
                    { label: 'Time', value: time },
                    { label: 'Length', value: formatDuration(duration) },
                    { label: 'Court', value: b.courtName },
                    { label: 'Reference', value: b.reference },
                  ]}
                />
              </div>
            </Card>
          </>
        }
      />

      <ConfirmDialog
        visible={dialog === 'cancel'}
        title="Cancel this booking?"
        message={`${b.customerName}, ${b.courtName}, ${formatCalendarDate(clock.date)} at ${formatTime(b.startAt, tz)}. The slot opens up for others.`}
        confirmLabel="Cancel booking"
        destructive
        loading={cancel.isPending}
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          if (!reason) {
            setReasonError('Choose a reason.');
            return;
          }
          cancel.mutate({ reason, refund }, { onSuccess: () => setDialog(null) });
        }}
      >
        <SelectField
          label="Reason"
          value={reason}
          error={reasonError}
          options={CANCEL_REASONS.map((r) => ({ value: r, label: r }))}
          onChange={(r) => {
            setReason(r);
            setReasonError(undefined);
          }}
        />
        {b.paid > 0 && <SwitchRow label="Mark payment as refunded" description={`${f.money(b.paid)} was paid. Turn on once you've returned it.`} value={refund} onChange={setRefund} />}
      </ConfirmDialog>

      <ConfirmDialog
        visible={dialog === 'paid'}
        title="Mark as paid?"
        message={`This records ${f.money(b.outstanding)} from ${b.customerName} and closes the balance.`}
        confirmLabel="Record payment"
        cancelLabel="Not now"
        loading={record.isPending}
        onCancel={() => setDialog(null)}
        onConfirm={() => record.mutate({ bookingId: b.id, amount: b.outstanding, method }, { onSuccess: () => setDialog(null) })}
      >
        <SelectField label="Paid by" value={method} options={(Object.keys(PAYMENT_METHOD) as PaymentMethod[]).map((m) => ({ value: m, label: PAYMENT_METHOD[m].label }))} onChange={setMethod} />
      </ConfirmDialog>

      <ConfirmDialog
        visible={dialog === 'noShow'}
        title="Mark as no-show?"
        message={`${b.customerName} will have a no-show on their record. Any unpaid balance stays open.`}
        confirmLabel="Mark no-show"
        destructive
        loading={setStatus.isPending}
        onCancel={() => setDialog(null)}
        onConfirm={() => setStatus.mutate('NO_SHOW', { onSuccess: () => setDialog(null) })}
      />
    </>
  );
}

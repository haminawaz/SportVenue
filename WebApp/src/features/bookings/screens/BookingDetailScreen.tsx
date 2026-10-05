'use client';

import { useState } from 'react';
import { ArrowsLeftRight, Bell, CalendarX, CheckCircle, Clock, CourtBasketball, NotePencil, Phone, Receipt, UserMinus } from '@phosphor-icons/react';

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
import { Card } from '@/ui/Card';
import { ConfirmDialog } from '@/ui/Dialogs';
import { SwitchRow } from '@/ui/Fields';
import type { IconType } from '@/ui/icon';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { SelectField } from '@/ui/Select';
import { StackHeader } from '@/ui/StackHeader';
import { Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';
import { Timeline } from '@/ui/Timeline';

import { useBooking, useCancelBooking, useSendReminder, useSetBookingStatus } from '../api';

export function BookingDetailScreen() {
  const id = useRouteParam('id');
  const query = useBooking(id);

  return (
    <>
      <StackHeader title={query.data?.reference ?? 'Booking'} />
      <Screen onRefresh={() => query.refetch()}>
        <QueryView query={query} errorTitle="Couldn't load booking">
          {(b) => <BookingBody booking={b} />}
        </QueryView>
      </Screen>
    </>
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

  return (
    <>
      <Card>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge label={status.label} tone={status.tone} />
          {(b.status !== 'CANCELLED' || b.paymentStatus === 'REFUNDED') && <StatusBadge label={pay.label} tone={pay.tone} />}
        </div>
        <AppText variant="display-lg" className="mt-3">
          {formatCalendarDate(clock.date)}
        </AppText>
        <AppText variant="title-md" tone="muted" numeric>
          {formatTime(b.startAt, tz)} - {formatTime(b.endAt, tz)}
        </AppText>
        <div className="mt-3 flex flex-wrap gap-4">
          <Meta icon={CourtBasketball} text={b.courtName} />
          <Meta icon={Clock} text={formatDuration(duration)} />
        </div>
      </Card>

      {b.status === 'CANCELLED' && <Notice tone="warning" title="Cancelled" message={b.cancelReason ? `Reason: ${b.cancelReason}` : 'This booking was cancelled.'} />}
      {b.status === 'NO_SHOW' && <Notice tone="danger" title="No-show" message="The customer did not arrive for this booking." />}

      <ListGroup title="Customer">
        <ListRow title={b.customerName} subtitle={b.customerPhone} leading={<Avatar name={b.customerName} />} onPress={() => router.push(routes.customer(b.customerId))} hint="Opens customer profile" />
        {!!b.customerPhone && <ListRow title="Call" icon={Phone} href={`tel:${b.customerPhone.replace(/\s/g, '')}`} label={`Call ${b.customerName}`} />}
      </ListGroup>

      <section>
        <SectionHeader title="Payment" />
        <Card>
          <Line label="Court price" value={f.money(b.price)} />
          {b.discountAmount > 0 && <Line label={b.discountName ?? 'Discount'} value={`-${f.money(b.discountAmount)}`} tone="accent" />}
          <Line label="Total" value={f.money(b.total)} strong />
          <Line label="Paid" value={f.money(b.paid)} />
          {b.status !== 'CANCELLED' && (
            <div className="mt-2 flex items-center gap-3 border-t border-border pt-3">
              <AppText variant="body-strong" className="flex-1">
                {b.outstanding > 0 ? 'Still to pay' : 'Nothing to pay'}
              </AppText>
              <AppText variant="title-md" numeric tone={b.outstanding > 0 ? 'warning' : 'accent'} aria-label={f.moneyA11y(b.outstanding)}>
                {f.money(b.outstanding)}
              </AppText>
            </div>
          )}
          {b.outstanding > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" label="Record payment" icon={Receipt} onPress={() => router.push(routes.recordPayment(b.id))} />
              <Button size="sm" variant="secondary" label="Mark as paid" icon={CheckCircle} onPress={() => setDialog('paid')} />
              <Button size="sm" variant="secondary" label="Remind" icon={Bell} loading={remind.isPending} onPress={() => remind.mutate(b.id)} aria-label={`Remind ${b.customerName} to pay`} />
            </div>
          )}
        </Card>
      </section>

      {b.payments.length > 0 && (
        <ListGroup title="Payments received">
          {b.payments.map((p) => (
            <ListRow
              key={p.id}
              title={f.money(p.amount)}
              subtitle={`${PAYMENT_METHOD[p.method].label} · ${formatDayAndTime(p.receivedAt, tz, f.today())}`}
              icon={PAYMENT_METHOD[p.method].icon}
              onPress={() => router.push(routes.payment(p.id))}
            />
          ))}
        </ListGroup>
      )}

      {b.notes && (
        <ListGroup title="Notes">
          <ListRow title={b.notes} titleLines={20} />
        </ListGroup>
      )}

      {b.status !== 'CANCELLED' && (
        <ListGroup title="Manage">
          {open && <ListRow title="Edit details" subtitle="Customer and notes" icon={NotePencil} onPress={() => router.push(routes.bookingEdit(b.id))} />}
          {open && <ListRow title="Reschedule" subtitle="Change court, day or time" icon={ArrowsLeftRight} onPress={() => router.push(routes.bookingReschedule(b.id))} />}
          {open && started && <ListRow title="Mark as completed" icon={CheckCircle} onPress={() => setStatus.mutate('COMPLETED')} />}
          {open && started && <ListRow title="Mark as no-show" icon={UserMinus} onPress={() => setDialog('noShow')} />}
          {b.status === 'NO_SHOW' && <ListRow title="Undo no-show" icon={CheckCircle} onPress={() => setStatus.mutate('COMPLETED')} />}
          {open && <ListRow title="Cancel booking" icon={CalendarX} destructive onPress={() => setDialog('cancel')} />}
        </ListGroup>
      )}

      <section>
        <SectionHeader title="History" />
        <Timeline items={b.history.map((h) => ({ id: h.id, title: h.description, meta: `${formatDayAndTime(h.at, tz, f.today())} · ${h.actor}` }))} />
      </section>

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
        {b.paid > 0 && (
          <div className="mt-1 overflow-hidden rounded-control border border-border">
            <SwitchRow label="Mark payment as refunded" description={`${f.money(b.paid)} was paid. Turn on once you've returned it.`} value={refund} onChange={setRefund} />
          </div>
        )}
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
        <SelectField
          label="Paid by"
          value={method}
          options={(Object.keys(PAYMENT_METHOD) as PaymentMethod[]).map((m) => ({ value: m, label: PAYMENT_METHOD[m].label }))}
          onChange={setMethod}
        />
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

function Meta({ icon: Icon, text }: { icon: IconType; text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-text-muted">
      <Icon size={16} aria-hidden />
      <AppText variant="nav-link" tone="muted">
        {text}
      </AppText>
    </span>
  );
}

function Line({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'accent' }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <AppText variant={strong ? 'body-strong' : 'body-md'} tone={strong ? 'default' : 'muted'} className="flex-1">
        {label}
      </AppText>
      <AppText variant={strong ? 'body-strong' : 'body-md'} numeric tone={tone}>
        {value}
      </AppText>
    </div>
  );
}

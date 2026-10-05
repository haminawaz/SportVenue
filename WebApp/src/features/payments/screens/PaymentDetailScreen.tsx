'use client';

import { CalendarBlank, Receipt, User } from '@phosphor-icons/react';

import { PAYMENT_METHOD, PAYMENT_STATUS } from '@/domain/labels';
import { useBooking } from '@/features/bookings/api';
import { formatDayAndTime } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { StackHeader } from '@/ui/StackHeader';
import { QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { usePayment } from '../api';

export function PaymentDetailScreen() {
  const id = useRouteParam('id');
  const query = usePayment(id);
  return (
    <>
      <StackHeader title="Payment" />
      <Screen>
        <QueryView query={query} errorTitle="Couldn't load payment">
          {(p) => <PaymentBody paymentId={p.id} />}
        </QueryView>
      </Screen>
    </>
  );
}

function PaymentBody({ paymentId }: { paymentId: string }) {
  const router = useAppRouter();
  const f = useFormat();
  const p = usePayment(paymentId).data!;
  const booking = useBooking(p.bookingId);
  const method = PAYMENT_METHOD[p.method];
  const Icon = method.icon;
  const b = booking.data;

  return (
    <>
      <Card>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon size={24} aria-hidden />
        </span>
        <AppText variant="nav-link" tone="muted" className="mt-4">
          Received from {p.customerName}
        </AppText>
        <AppText as="h2" variant="display-xl" numeric aria-label={f.moneyA11y(p.amount)} className="my-1">
          {f.money(p.amount)}
        </AppText>
        <AppText tone="muted">{formatDayAndTime(p.receivedAt, f.timeZone, f.today())}</AppText>
      </Card>

      <ListGroup title="Details">
        <ListRow title="Method" value={method.label} />
        <ListRow title="Recorded by" value={p.recordedBy} />
        <ListRow title="Reference" value={p.id.toUpperCase()} />
        {p.note && <ListRow title="Note" subtitle={p.note} />}
      </ListGroup>

      <ListGroup title="Related">
        <ListRow
          icon={CalendarBlank}
          title={`Booking ${p.bookingReference}`}
          subtitle={b ? `${b.courtName} · ${formatDayAndTime(b.startAt, f.timeZone, f.today())}` : undefined}
          trailing={b ? <StatusBadge label={PAYMENT_STATUS[b.paymentStatus].label} tone={PAYMENT_STATUS[b.paymentStatus].tone} /> : undefined}
          onPress={() => router.push(routes.booking(p.bookingId))}
        />
        <ListRow icon={User} title={p.customerName} subtitle="Customer profile" onPress={() => router.push(routes.customer(p.customerId))} />
        <ListRow icon={Receipt} title="All payments from this customer" onPress={() => router.push(routes.customerPayments(p.customerId))} />
      </ListGroup>

      {b && b.outstanding > 0 && (
        <AppText variant="body-sm" tone="muted" className="px-1">
          {f.money(b.outstanding)} is still due on this booking.
        </AppText>
      )}
    </>
  );
}

'use client';

import Link from 'next/link';
import { CalendarBlank, Receipt, User } from '@phosphor-icons/react';

import { PAYMENT_METHOD, PAYMENT_STATUS } from '@/domain/labels';
import { useBooking } from '@/features/bookings/api';
import { formatDayAndTime } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { AppText } from '@/ui/AppText';
import { Card, CardHeader } from '@/ui/Card';
import { DetailLayout, Page, PageHeader } from '@/ui/Page';
import { DescriptionList, Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { usePayment } from '../api';

export function PaymentDetailScreen() {
  const id = useRouteParam('id');
  const query = usePayment(id);
  return (
    <Page width="wide">
      <QueryView query={query} errorTitle="Couldn't load payment">
        {(p) => <PaymentBody paymentId={p.id} />}
      </QueryView>
    </Page>
  );
}

function PaymentBody({ paymentId }: { paymentId: string }) {
  const f = useFormat();
  const p = usePayment(paymentId).data!;
  const booking = useBooking(p.bookingId);
  const method = PAYMENT_METHOD[p.method];
  const b = booking.data;
  const link = 'flex items-center gap-3 rounded-control px-3 py-2.5 hover:bg-surface-muted';

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Payments', href: routes.payments('history') }, { label: p.id.toUpperCase() }]}
        title={f.money(p.amount)}
        description={`Received from ${p.customerName} · ${formatDayAndTime(p.receivedAt, f.timeZone, f.today())}`}
        meta={<StatusBadge label={method.label} tone="positive" />}
        hideRefresh
      />
      {b && b.outstanding > 0 && <Notice tone="warning" message={`${f.money(b.outstanding)} is still due on this booking.`} />}
      <DetailLayout
        main={
          <Card padded={false}>
            <CardHeader title="Details" />
            <div className="px-5 py-2">
              <DescriptionList
                items={[
                  { label: 'Amount', value: <span aria-label={f.moneyA11y(p.amount)}>{f.money(p.amount)}</span> },
                  { label: 'Method', value: method.label },
                  { label: 'Received', value: formatDayAndTime(p.receivedAt, f.timeZone, f.today()) },
                  { label: 'Recorded by', value: p.recordedBy },
                  { label: 'Reference', value: p.id.toUpperCase() },
                  p.note ? { label: 'Note', value: p.note } : null,
                ]}
              />
            </div>
          </Card>
        }
        side={
          <Card padded={false}>
            <CardHeader title="Related" />
            <ul className="flex flex-col p-2">
              <li>
                <Link href={routes.booking(p.bookingId)} className={link}>
                  <CalendarBlank size={18} className="text-text-muted" aria-hidden />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <AppText variant="text-strong">Booking {p.bookingReference}</AppText>
                    {b && (
                      <AppText variant="small" tone="muted">
                        {b.courtName} · {formatDayAndTime(b.startAt, f.timeZone, f.today())}
                      </AppText>
                    )}
                  </span>
                  {b && <StatusBadge label={PAYMENT_STATUS[b.paymentStatus].label} tone={PAYMENT_STATUS[b.paymentStatus].tone} />}
                </Link>
              </li>
              <li>
                <Link href={routes.customer(p.customerId)} className={link}>
                  <User size={18} className="text-text-muted" aria-hidden />
                  <span className="flex flex-col">
                    <AppText variant="text-strong">{p.customerName}</AppText>
                    <AppText variant="small" tone="muted">
                      Customer profile
                    </AppText>
                  </span>
                </Link>
              </li>
              <li>
                <Link href={routes.customerPayments(p.customerId)} className={link}>
                  <Receipt size={18} className="text-text-muted" aria-hidden />
                  <AppText variant="text-strong">All payments from this customer</AppText>
                </Link>
              </li>
            </ul>
          </Card>
        }
      />
    </>
  );
}

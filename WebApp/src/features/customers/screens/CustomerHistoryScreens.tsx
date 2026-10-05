'use client';

import { useMemo } from 'react';
import { CalendarBlank, CurrencyCircleDollar, Receipt } from '@phosphor-icons/react';

import { PAYMENT_METHOD } from '@/domain/labels';
import { useBookings } from '@/features/bookings/api';
import { bookingColumns, bookingRowLabel } from '@/features/bookings/components/bookingColumns';
import { usePayments } from '@/features/payments/api';
import { formatDayAndTime } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { Card } from '@/ui/Card';
import { InfiniteTable } from '@/ui/DataTable';
import { EmptyState } from '@/ui/EmptyState';
import { Page, PageHeader } from '@/ui/Page';
import { StatCard, StatGrid } from '@/ui/StatCard';

import { useCustomer } from '../api';

/** Every booking a customer has made, newest first. */
export function CustomerBookingsScreen() {
  const id = useRouteParam('id');
  const f = useFormat();
  const customer = useCustomer(id);
  const query = useBookings({ customerId: id, order: 'desc' });
  const name = customer.data?.name ?? 'Customer';
  const columns = useMemo(() => bookingColumns(f, { showCustomer: false }), [f]);
  return (
    <Page onRefresh={() => query.refetch()}>
      <PageHeader breadcrumbs={[{ label: 'Customers', href: routes.customers }, { label: name, href: routes.customer(id) }, { label: 'Bookings' }]} title={customer.data ? `${customer.data.name.split(' ')[0]}'s bookings` : 'Bookings'} />
      <Card padded={false}>
        <InfiniteTable
          query={query}
          columns={columns}
          rowKey={(b) => b.id}
          rowHref={(b) => routes.booking(b.id)}
          rowLabel={(b) => bookingRowLabel(f, b)}
          muted={(b) => b.status === 'CANCELLED'}
          caption={`Bookings for ${name}`}
          noun={['booking', 'bookings']}
          empty={<EmptyState icon={CalendarBlank} title="No bookings yet" message="Bookings for this customer will show here." />}
        />
      </Card>
    </Page>
  );
}

/** Customer payment history with lifetime totals. */
export function CustomerPaymentsScreen() {
  const id = useRouteParam('id');
  const f = useFormat();
  const customer = useCustomer(id);
  const query = usePayments({ customerId: id });
  const c = customer.data;
  const name = c?.name ?? 'Customer';

  return (
    <Page onRefresh={() => query.refetch()}>
      <PageHeader breadcrumbs={[{ label: 'Customers', href: routes.customers }, { label: name, href: routes.customer(id) }, { label: 'Payments' }]} title={c ? `${c.name.split(' ')[0]}'s payments` : 'Payments'} />
      {c && (
        <StatGrid columns={2}>
          <StatCard icon={CurrencyCircleDollar} label="Total paid" value={f.tileMoney(c.totalSpent)} valueA11y={f.moneyA11y(c.totalSpent)} />
          <StatCard icon={Receipt} label="Still owed" value={f.tileMoney(c.outstanding)} valueA11y={f.moneyA11y(c.outstanding)} tint={c.outstanding > 0 ? 'warning' : 'surface'} />
        </StatGrid>
      )}
      <Card padded={false}>
        <InfiniteTable
          query={query}
          rowKey={(p) => p.id}
          rowHref={(p) => routes.payment(p.id)}
          rowLabel={(p) => `${f.moneyA11y(p.amount)}, ${PAYMENT_METHOD[p.method].label}, booking ${p.bookingReference}, ${formatDayAndTime(p.receivedAt, f.timeZone, f.today())}`}
          caption={`Payments from ${name}`}
          noun={['payment', 'payments']}
          columns={[
            { key: 'when', header: 'Received', primary: true, cell: (p) => <span className="whitespace-nowrap">{formatDayAndTime(p.receivedAt, f.timeZone, f.today())}</span> },
            { key: 'booking', header: 'Booking', cell: (p) => <span className="text-text-muted">{p.bookingReference}</span> },
            { key: 'method', header: 'Method', hideBelow: 'sm', cell: (p) => PAYMENT_METHOD[p.method].label },
            { key: 'by', header: 'Recorded by', hideBelow: 'lg', cell: (p) => <span className="text-text-muted">{p.recordedBy}</span> },
            { key: 'amount', header: 'Amount', align: 'right', cell: (p) => <span className="t-text-strong">{f.money(p.amount)}</span> },
          ]}
          empty={<EmptyState icon={Receipt} title="No payments yet" message="Payments recorded against this customer's bookings appear here." />}
        />
      </Card>
    </Page>
  );
}

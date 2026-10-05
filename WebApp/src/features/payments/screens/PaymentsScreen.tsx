'use client';

import { useMemo, useState } from 'react';
import { CheckCircle, Receipt, SortAscending } from '@phosphor-icons/react';

import { PAYMENT_METHOD, PAYMENT_STATUS } from '@/domain/labels';
import type { OutstandingBalance, Payment } from '@/domain/types';
import { facilityWallClock, formatCalendarDate, formatDayAndTime } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { useQueryParams } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { InfiniteTable, type Column } from '@/ui/DataTable';
import { EmptyState } from '@/ui/EmptyState';
import { FilterSelect } from '@/ui/Menu';
import { Page, PageHeader } from '@/ui/Page';
import { useRegisterRefresh } from '@/ui/Refresh';
import { Toolbar } from '@/ui/SearchBar';
import { StatCard, StatGrid } from '@/ui/StatCard';
import { StatusBadge } from '@/ui/StatusBadge';
import { Tabs } from '@/ui/Tabs';

import { useOutstanding, usePayments, type OutstandingSort } from '../api';

type Tab = 'outstanding' | 'history';

export function PaymentsScreen() {
  const params = useQueryParams('tab');
  const [tab, setTab] = useState<Tab>(params.tab === 'history' ? 'history' : 'outstanding');
  // Follow links that ask for a specific view while the screen stays mounted.
  const [linkedTab, setLinkedTab] = useState(params.tab);
  if (params.tab !== linkedTab) {
    setLinkedTab(params.tab);
    if (params.tab === 'history' || params.tab === 'outstanding') setTab(params.tab);
  }

  return (
    <Page>
      <PageHeader title="Payments" description="Collect what you are owed and see every payment received." />
      <Tabs
        label="Payments view"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'outstanding', label: 'Outstanding' },
          { value: 'history', label: 'Received' },
        ]}
      />
      {tab === 'outstanding' ? <OutstandingList /> : <HistoryList />}
    </Page>
  );
}

const age = (days: number) => (days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`);

function OutstandingList() {
  const router = useAppRouter();
  const f = useFormat();
  const [sort, setSort] = useState<OutstandingSort>('amount');
  const query = useOutstanding({ sort });
  useRegisterRefresh(() => query.refetch());
  const first = query.data?.pages[0];

  const columns = useMemo<Column<OutstandingBalance>[]>(
    () => [
      {
        key: 'customer',
        header: 'Customer',
        primary: true,
        cell: (b) => (
          <span className="flex flex-col">
            <AppText variant="text-strong" lines={1}>
              {b.customerName}
            </AppText>
            <AppText variant="small" tone="muted" lines={1}>
              {b.reference}
              <span className="md:hidden"> · {b.courtName}</span>
            </AppText>
          </span>
        ),
      },
      { key: 'court', header: 'Court', hideBelow: 'md', cell: (b) => <span className="whitespace-nowrap text-text-muted">{b.courtName}</span> },
      { key: 'played', header: 'Played', hideBelow: 'lg', cell: (b) => <span className="whitespace-nowrap text-text-muted">{formatCalendarDate(facilityWallClock(b.startAt, f.timeZone).date)}</span> },
      { key: 'age', header: 'Due since', hideBelow: 'sm', cell: (b) => <span className="whitespace-nowrap">{age(b.daysOverdue)}</span> },
      { key: 'status', header: 'Status', hideBelow: 'xl', cell: (b) => <StatusBadge label={PAYMENT_STATUS[b.paymentStatus].label} tone={PAYMENT_STATUS[b.paymentStatus].tone} /> },
      { key: 'total', header: 'Total', align: 'right', hideBelow: 'lg', cell: (b) => <span className="text-text-muted">{f.money(b.total)}</span> },
      { key: 'paid', header: 'Paid', align: 'right', hideBelow: 'xl', cell: (b) => <span className="text-text-muted">{f.money(b.paid)}</span> },
      { key: 'owed', header: 'Outstanding', align: 'right', cell: (b) => <span className="t-text-strong whitespace-nowrap text-warning">{f.money(b.outstanding)}</span> },
      {
        key: 'action',
        header: 'Action',
        srOnlyHeader: true,
        align: 'right',
        cell: (b) => <Button size="sm" variant="secondary" label="Record" aria-label={`Record payment from ${b.customerName}`} onPress={() => router.push(routes.recordPayment(b.id))} />,
      },
    ],
    [f, router],
  );

  return (
    <>
      {first && first.total > 0 && (
        <StatGrid columns={2}>
          <StatCard tint="warning" icon={Receipt} label="Owed to you" value={f.money(first.totalAmount)} valueA11y={f.moneyA11y(first.totalAmount)} />
          <StatCard label="Unpaid bookings" value={String(first.total)} supporting="From bookings played up to today" />
        </StatGrid>
      )}
      <Card padded={false}>
        <Toolbar>
          <FilterSelect
            label="Sort"
            icon={SortAscending}
            value={sort}
            options={[
              { value: 'amount', label: 'Largest first' },
              { value: 'oldest', label: 'Oldest first' },
            ]}
            onChange={setSort}
          />
        </Toolbar>
        <InfiniteTable
          query={query}
          columns={columns}
          rowKey={(b) => b.id}
          rowHref={(b) => routes.booking(b.id)}
          rowLabel={(b) =>
            `${b.customerName} owes ${f.moneyA11y(b.outstanding)}, ${PAYMENT_STATUS[b.paymentStatus].label}, ${b.courtName}, ${formatDayAndTime(b.startAt, f.timeZone, f.today())}, ${age(b.daysOverdue)}${b.paid > 0 ? `, paid ${f.moneyA11y(b.paid)} of ${f.moneyA11y(b.total)}` : ''}`
          }
          caption="Outstanding balances"
          noun={['booking', 'bookings']}
          empty={<EmptyState icon={CheckCircle} title="Nothing outstanding" message="Unpaid balances from past bookings show up here." />}
        />
      </Card>
    </>
  );
}

function HistoryList() {
  const f = useFormat();
  const query = usePayments({});
  useRegisterRefresh(() => query.refetch());
  const columns = useMemo<Column<Payment>[]>(
    () => [
      { key: 'when', header: 'Received', cell: (p) => <span className="whitespace-nowrap">{formatDayAndTime(p.receivedAt, f.timeZone, f.today())}</span> },
      { key: 'customer', header: 'Customer', primary: true, cell: (p) => <AppText variant="text-strong" lines={1}>{p.customerName}</AppText> },
      { key: 'booking', header: 'Booking', hideBelow: 'md', cell: (p) => <span className="text-text-muted">{p.bookingReference}</span> },
      { key: 'method', header: 'Method', hideBelow: 'sm', cell: (p) => PAYMENT_METHOD[p.method].label },
      { key: 'by', header: 'Recorded by', hideBelow: 'xl', cell: (p) => <span className="text-text-muted">{p.recordedBy}</span> },
      { key: 'amount', header: 'Amount', align: 'right', cell: (p) => <span className="t-text-strong">{f.money(p.amount)}</span> },
    ],
    [f],
  );
  return (
    <Card padded={false}>
      <InfiniteTable
        query={query}
        columns={columns}
        rowKey={(p) => p.id}
        rowHref={(p) => routes.payment(p.id)}
        rowLabel={(p) => `${f.moneyA11y(p.amount)} from ${p.customerName}, ${PAYMENT_METHOD[p.method].label}, booking ${p.bookingReference}, ${formatDayAndTime(p.receivedAt, f.timeZone, f.today())}`}
        caption="Payments received"
        noun={['payment', 'payments']}
        empty={<EmptyState icon={Receipt} title="No payments yet" message="Payments you record against bookings will show here." />}
      />
    </Card>
  );
}

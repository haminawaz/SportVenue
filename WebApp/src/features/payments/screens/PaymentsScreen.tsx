'use client';

import { memo, useState, type ReactElement } from 'react';
import { CheckCircle, Receipt, SortAscending } from '@phosphor-icons/react';

import { PAYMENT_STATUS } from '@/domain/labels';
import type { OutstandingBalance } from '@/domain/types';
import { formatDayAndTime } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { useQueryParams } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { Chip, ChipRow, SegmentedControl } from '@/ui/Chips';
import { EmptyState } from '@/ui/EmptyState';
import { InfiniteList } from '@/ui/InfiniteList';
import { SummaryRow } from '@/ui/List';
import { OptionSheet } from '@/ui/Select';
import { StatusBadge } from '@/ui/StatusBadge';

import { useOutstanding, usePayments, type OutstandingSort } from '../api';
import { PaymentRow } from '../components/PaymentRow';

type Tab = 'outstanding' | 'history';

export function PaymentsScreen() {
  const params = useQueryParams('tab');
  const [tab, setTab] = useState<Tab>(params.tab === 'history' ? 'history' : 'outstanding');
  // Payments is a tab, so it can stay mounted: follow links that ask for a specific view.
  const [linkedTab, setLinkedTab] = useState(params.tab);
  if (params.tab !== linkedTab) {
    setLinkedTab(params.tab);
    if (params.tab === 'history' || params.tab === 'outstanding') setTab(params.tab);
  }
  const tabs = (
    <SegmentedControl
      label="Payments view"
      value={tab}
      onChange={setTab}
      options={[
        { value: 'outstanding', label: 'Outstanding' },
        { value: 'history', label: 'Received' },
      ]}
    />
  );
  return tab === 'outstanding' ? <OutstandingList tabs={tabs} /> : <HistoryList tabs={tabs} />;
}

function OutstandingList({ tabs }: { tabs: ReactElement }) {
  const router = useAppRouter();
  const f = useFormat();
  const [sort, setSort] = useState<OutstandingSort>('amount');
  const [sortOpen, setSortOpen] = useState(false);
  const query = useOutstanding({ sort });
  const first = query.data?.pages[0];

  return (
    <>
      <InfiniteList
        title="Payments"
        query={query}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <BalanceRow balance={item} onPress={() => router.push(routes.booking(item.id))} />}
        header={
          <div className="flex flex-col gap-4">
            {tabs}
            {first && first.total > 0 && (
              <Card tint="warning" className="flex items-center gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <AppText variant="body-sm" tone="muted">
                    Owed to you
                  </AppText>
                  <AppText variant="display-lg" numeric aria-label={f.moneyA11y(first.totalAmount)}>
                    {f.money(first.totalAmount)}
                  </AppText>
                </div>
                <AppText variant="body-strong" tone="warning" numeric>
                  {first.total} {first.total === 1 ? 'booking' : 'bookings'}
                </AppText>
              </Card>
            )}
            <ChipRow>
              <Chip label={sort === 'amount' ? 'Largest first' : 'Oldest first'} icon={SortAscending} dropdown onPress={() => setSortOpen(true)} />
            </ChipRow>
          </div>
        }
        empty={<EmptyState icon={CheckCircle} title="Nothing outstanding" message="Unpaid balances from past bookings show up here." />}
      />
      <OptionSheet
        visible={sortOpen}
        title="Sort by"
        options={[
          { value: 'amount', label: 'Largest first' },
          { value: 'oldest', label: 'Oldest first' },
        ]}
        selected={[sort]}
        onClose={() => setSortOpen(false)}
        onChange={([s]) => setSort(s as OutstandingSort)}
      />
    </>
  );
}

const BalanceRow = memo(function BalanceRow({ balance: b, onPress }: { balance: OutstandingBalance; onPress: () => void }) {
  const f = useFormat();
  const status = PAYMENT_STATUS[b.paymentStatus];
  const when = formatDayAndTime(b.startAt, f.timeZone, f.today());
  const age = b.daysOverdue === 0 ? 'Today' : b.daysOverdue === 1 ? '1 day ago' : `${b.daysOverdue} days ago`;
  return (
    <SummaryRow
      title={b.customerName}
      value={f.money(b.outstanding)}
      valueTone="warning"
      meta={`${age} · ${b.courtName}`}
      tag={<StatusBadge label={status.label} tone={status.tone} />}
      label={`${b.customerName} owes ${f.moneyA11y(b.outstanding)}, ${status.label}, ${b.courtName}, ${when}, ${age}${b.paid > 0 ? `, paid ${f.moneyA11y(b.paid)} of ${f.moneyA11y(b.total)}` : ''}`}
      hint="Opens the booking to record a payment or send a reminder"
      onPress={onPress}
    />
  );
});

function HistoryList({ tabs }: { tabs: ReactElement }) {
  const router = useAppRouter();
  const query = usePayments({});
  return (
    <InfiniteList
      title="Payments"
      query={query}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <PaymentRow payment={item} onPress={(id) => router.push(routes.payment(id))} />}
      header={tabs}
      empty={<EmptyState icon={Receipt} title="No payments yet" message="Payments you record against bookings will show here." />}
    />
  );
}

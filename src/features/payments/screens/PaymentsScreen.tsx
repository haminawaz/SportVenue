import { memo, useState, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, Receipt, SortAscending } from 'phosphor-react-native';

import { PAYMENT_STATUS } from '@/domain/labels';
import type { OutstandingBalance } from '@/domain/types';
import { formatDayAndTime } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { Chip, ChipRow, SegmentedControl } from '@/ui/Chips';
import { EmptyState } from '@/ui/EmptyState';
import { InfiniteList } from '@/ui/InfiniteList';
import { ListRow } from '@/ui/List';
import { OptionSheet } from '@/ui/Select';
import { StatusBadge } from '@/ui/StatusBadge';

import { useOutstanding, usePayments, type OutstandingSort } from '../api';
import { PaymentRow } from '../components/PaymentRow';

type Tab = 'outstanding' | 'history';

export function PaymentsScreen() {
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'history' ? 'history' : 'outstanding');
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
  return (
    <>
      <Stack.Screen options={{ title: 'Payments' }} />
      {tab === 'outstanding' ? <OutstandingList tabs={tabs} /> : <HistoryList tabs={tabs} />}
    </>
  );
}

function OutstandingList({ tabs }: { tabs: ReactElement }) {
  const router = useRouter();
  const f = useFormat();
  const [sort, setSort] = useState<OutstandingSort>('amount');
  const [sortOpen, setSortOpen] = useState(false);
  const query = useOutstanding({ sort });
  const first = query.data?.pages[0];

  return (
    <>
      <InfiniteList
        query={query}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <BalanceRow balance={item} onPress={() => router.push(routes.booking(item.id))} />}
        header={
          <View style={styles.header}>
            {tabs}
            {first && first.total > 0 && (
              <Card tint="warning">
                <AppText variant="label" tone="muted">
                  Owed to you
                </AppText>
                <AppText variant="title" numeric aria-label={f.moneyA11y(first.totalAmount)}>
                  {f.money(first.totalAmount)}
                </AppText>
                <AppText variant="caption" tone="muted">
                  Across {first.total} {first.total === 1 ? 'booking' : 'bookings'} up to today. Tap one to record a payment or send a reminder.
                </AppText>
              </Card>
            )}
            <ChipRow>
              <Chip label={sort === 'amount' ? 'Largest first' : 'Oldest first'} icon={SortAscending} dropdown onPress={() => setSortOpen(true)} />
            </ChipRow>
          </View>
        }
        empty={<EmptyState icon={CheckCircle} title="Nothing outstanding" message="Every past booking has been paid in full." />}
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
    <ListRow
      title={b.customerName}
      subtitle={`${b.courtName} · ${when}\n${age} · ${b.paid > 0 ? `paid ${f.money(b.paid)} of ${f.money(b.total)}` : 'nothing paid yet'}`}
      trailing={
        <View style={styles.trail}>
          <AppText variant="bodyStrong" tone="warning" numeric>
            {f.money(b.outstanding)}
          </AppText>
          <StatusBadge label={status.label} tone={status.tone} />
        </View>
      }
      label={`${b.customerName} owes ${f.moneyA11y(b.outstanding)}, ${b.courtName}, ${when}, ${age}`}
      hint="Opens the booking to record a payment"
      onPress={onPress}
      titleLines={1}
    />
  );
});

function HistoryList({ tabs }: { tabs: ReactElement }) {
  const router = useRouter();
  const query = usePayments({});
  return (
    <InfiniteList
      query={query}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <PaymentRow payment={item} onPress={(id) => router.push(routes.payment(id))} />}
      header={<View style={styles.header}>{tabs}</View>}
      empty={<EmptyState icon={Receipt} title="No payments yet" message="Payments you record against bookings will show here." />}
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.lg },
  trail: { alignItems: 'flex-end', gap: spacing.xs },
});

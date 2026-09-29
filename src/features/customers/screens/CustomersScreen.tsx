import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MagnifyingGlass, Plus, SortAscending, UsersThree } from 'phosphor-react-native';

import type { Customer } from '@/domain/types';
import { useFormat } from '@/lib/format';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { routes } from '@/navigation/routes';
import { useSession } from '@/session/SessionProvider';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Chip, ChipRow } from '@/ui/Chips';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { InfiniteList } from '@/ui/InfiniteList';
import { LargeTitle } from '@/ui/LargeTitle';
import { ListRow } from '@/ui/List';
import { SearchBar } from '@/ui/SearchBar';
import { OptionSheet } from '@/ui/Select';
import { StatusBadge } from '@/ui/StatusBadge';

import { useCustomers, type CustomerFilter, type CustomerSort } from '../api';

const FILTERS: { value: CustomerFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'regular', label: 'Regulars' },
  { value: 'balance', label: 'Owes money' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'all', label: 'Everyone' },
];

const SORTS: { value: CustomerSort; label: string }[] = [
  { value: 'name', label: 'Name A-Z' },
  { value: 'recent', label: 'Most recent booking' },
  { value: 'balance', label: 'Highest balance' },
  { value: 'spent', label: 'Most spent' },
];

export function CustomersScreen() {
  const router = useRouter();
  const { can } = useSession();
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const [filter, setFilter] = useState<CustomerFilter>('active');
  const [sort, setSort] = useState<CustomerSort>('name');
  const [sortOpen, setSortOpen] = useState(false);
  const query = useCustomers({ q: q || undefined, filter, sort });
  const canManage = can('customer.manage');

  return (
    <>
      <InfiniteList
        topInset
        query={query}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <CustomerRow customer={item} onPress={() => router.push(routes.customer(item.id))} />}
        header={
          <View style={styles.header}>
            <LargeTitle
              title="Customers"
              actions={canManage ? <IconButton icon={Plus} label="Add customer" onPress={() => router.push(routes.customerNew())} tone="accent" variant="filled" /> : undefined}
            />
            <SearchBar value={search} onChange={setSearch} placeholder="Search name, phone or email" />
            <ChipRow>
              {FILTERS.map((fl) => (
                <Chip key={fl.value} label={fl.label} selected={filter === fl.value} onPress={() => setFilter(fl.value)} />
              ))}
              <Chip label={SORTS.find((s) => s.value === sort)!.label} icon={SortAscending} dropdown onPress={() => setSortOpen(true)} />
            </ChipRow>
          </View>
        }
        empty={
          q ? (
            <EmptyState icon={MagnifyingGlass} title={`No one matches "${q}"`} message="Check the spelling, or search by phone number." />
          ) : filter !== 'active' && filter !== 'all' ? (
            <EmptyState icon={UsersThree} title="No customers in this list" message="Try another filter." action={<Button label="Show active customers" variant="secondary" onPress={() => setFilter('active')} />} />
          ) : (
            <EmptyState
              icon={UsersThree}
              title="No customers yet"
              message="Add the people who book your courts to track their bookings and balances."
              action={canManage ? <Button label="Add customer" icon={Plus} onPress={() => router.push(routes.customerNew())} /> : undefined}
            />
          )
        }
      />
      <OptionSheet visible={sortOpen} title="Sort by" options={SORTS} selected={[sort]} onClose={() => setSortOpen(false)} onChange={([s]) => setSort(s)} />
    </>
  );
}

const CustomerRow = memo(function CustomerRow({ customer: c, onPress }: { customer: Customer; onPress: () => void }) {
  const f = useFormat();
  const owes = c.outstanding > 0;
  return (
    <ListRow
      leading={<Avatar name={c.name} />}
      title={c.name}
      subtitle={`${c.phone} · ${c.totalBookings} ${c.totalBookings === 1 ? 'booking' : 'bookings'}`}
      trailing={
        <View style={styles.tags}>
          {owes && (
            <AppText variant="label" tone="warning" numeric>
              {f.money(c.outstanding)} due
            </AppText>
          )}
          {c.isRegular && <StatusBadge label="Regular" tone="positive" />}
          {c.status === 'INACTIVE' && <StatusBadge label="Inactive" tone="neutral" />}
        </View>
      }
      label={[c.name, c.phone, c.isRegular ? 'Regular' : undefined, c.status === 'INACTIVE' ? 'Inactive' : undefined, owes ? `owes ${f.moneyA11y(c.outstanding)}` : undefined].filter(Boolean).join(', ')}
      onPress={onPress}
      titleLines={1}
    />
  );
});

const styles = StyleSheet.create({
  header: { gap: spacing.lg },
  tags: { alignItems: 'flex-end', gap: spacing.xxs },
});

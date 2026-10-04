import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MagnifyingGlass, Plus, SortAscending, UsersThree } from 'phosphor-react-native';

import type { Customer } from '@/domain/types';
import { useFormat } from '@/lib/format';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { routes } from '@/navigation/routes';
import { spacing } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Chip, ChipRow } from '@/ui/Chips';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { InfiniteList } from '@/ui/InfiniteList';
import { SummaryRow } from '@/ui/List';
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
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const [filter, setFilter] = useState<CustomerFilter>('active');
  const [sort, setSort] = useState<CustomerSort>('name');
  const [sortOpen, setSortOpen] = useState(false);
  const query = useCustomers({ q: q || undefined, filter, sort });

  return (
    <>
      <InfiniteList
        title="Customers"
        titleActions={<IconButton icon={Plus} label="Add customer" onPress={() => router.push(routes.customerNew())} variant="solid" size="sm" />}
        query={query}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <CustomerRow customer={item} onPress={() => router.push(routes.customer(item.id))} />}
        header={
          <View style={styles.header}>
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
              action={<Button label="Add customer" icon={Plus} onPress={() => router.push(routes.customerNew())} />}
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
  const inactive = c.status === 'INACTIVE';
  const bookings = `${c.totalBookings} ${c.totalBookings === 1 ? 'booking' : 'bookings'}`;
  return (
    <SummaryRow
      leading={<Avatar name={c.name} size={40} />}
      title={c.name}
      value={owes ? f.money(c.outstanding) : bookings}
      valueTone={owes ? 'warning' : 'muted'}
      meta={owes && !inactive && !c.isRegular ? `${c.phone} · ${bookings}` : c.phone}
      tag={inactive ? <StatusBadge label="Inactive" tone="neutral" /> : c.isRegular ? <StatusBadge label="Regular" tone="positive" /> : undefined}
      label={[c.name, c.phone, bookings, c.isRegular ? 'Regular' : undefined, inactive ? 'Inactive' : undefined, owes ? `owes ${f.moneyA11y(c.outstanding)}` : undefined].filter(Boolean).join(', ')}
      hint="Opens the customer"
      onPress={onPress}
    />
  );
});

const styles = StyleSheet.create({
  header: { gap: spacing.lg },
});

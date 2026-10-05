'use client';

import { useMemo, useState } from 'react';
import { MagnifyingGlass, Plus, SortAscending, UsersThree } from '@phosphor-icons/react';

import type { Customer } from '@/domain/types';
import { formatDateTimeLocal, useFormat } from '@/lib/format';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { InfiniteTable, type Column } from '@/ui/DataTable';
import { EmptyState } from '@/ui/EmptyState';
import { FilterSelect } from '@/ui/Menu';
import { Page, PageHeader } from '@/ui/Page';
import { useRegisterRefresh } from '@/ui/Refresh';
import { SearchBar, Toolbar } from '@/ui/SearchBar';
import { StatusBadge } from '@/ui/StatusBadge';
import { Tabs } from '@/ui/Tabs';

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
  const router = useAppRouter();
  const f = useFormat();
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const [filter, setFilter] = useState<CustomerFilter>('active');
  const [sort, setSort] = useState<CustomerSort>('name');
  const query = useCustomers({ q: q || undefined, filter, sort });
  useRegisterRefresh(() => query.refetch());

  const columns = useMemo<Column<Customer>[]>(
    () => [
      {
        key: 'name',
        header: 'Customer',
        primary: true,
        cell: (c) => (
          <span className="flex items-center gap-3">
            <Avatar name={c.name} size={32} />
            <span className="flex min-w-0 flex-col">
              <AppText variant="text-strong" lines={1}>
                {c.name}
              </AppText>
              <AppText variant="small" tone="muted" lines={1} className="md:hidden">
                {c.phone}
              </AppText>
            </span>
          </span>
        ),
      },
      { key: 'phone', header: 'Phone', hideBelow: 'md', cell: (c) => <span className="whitespace-nowrap text-text-muted tabular-nums">{c.phone}</span> },
      {
        key: 'tag',
        header: 'Type',
        hideBelow: 'sm',
        cell: (c) => (c.status === 'INACTIVE' ? <StatusBadge label="Inactive" tone="neutral" /> : c.isRegular ? <StatusBadge label="Regular" tone="positive" /> : <span className="text-text-subtle">-</span>),
      },
      { key: 'bookings', header: 'Bookings', align: 'right', hideBelow: 'lg', cell: (c) => c.totalBookings },
      { key: 'last', header: 'Last booking', hideBelow: 'xl', cell: (c) => <span className="whitespace-nowrap text-text-muted">{c.lastBookingAt ? formatDateTimeLocal(c.lastBookingAt, f.today()) : '-'}</span> },
      { key: 'spent', header: 'Total paid', align: 'right', hideBelow: 'lg', cell: (c) => f.money(c.totalSpent) },
      { key: 'balance', header: 'Balance', align: 'right', cell: (c) => (c.outstanding > 0 ? <span className="t-text-strong text-warning">{f.money(c.outstanding)}</span> : <span className="text-text-subtle">-</span>) },
    ],
    [f],
  );

  return (
    <Page>
      <PageHeader title="Customers" description="Everyone who books your courts, with their history and balances." actions={<Button label="Add customer" icon={Plus} onPress={() => router.push(routes.customerNew())} />} />
      <Tabs label="Show" value={filter} onChange={setFilter} items={FILTERS} />
      <Card padded={false}>
        <Toolbar>
          <SearchBar value={search} onChange={setSearch} placeholder="Search name, phone or email" className="w-full sm:w-80" />
          <FilterSelect label="Sort" icon={SortAscending} value={sort} options={SORTS} onChange={setSort} active={sort !== 'name'} />
        </Toolbar>
        <InfiniteTable
          query={query}
          columns={columns}
          rowKey={(c) => c.id}
          rowHref={(c) => routes.customer(c.id)}
          rowLabel={(c) =>
            [c.name, c.phone, `${c.totalBookings} ${c.totalBookings === 1 ? 'booking' : 'bookings'}`, c.isRegular ? 'Regular' : undefined, c.status === 'INACTIVE' ? 'Inactive' : undefined, c.outstanding > 0 ? `owes ${f.moneyA11y(c.outstanding)}` : undefined]
              .filter(Boolean)
              .join(', ')
          }
          muted={(c) => c.status === 'INACTIVE'}
          caption="Customers"
          noun={['customer', 'customers']}
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
      </Card>
    </Page>
  );
}

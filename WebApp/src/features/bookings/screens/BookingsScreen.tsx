'use client';

import { useMemo, useState } from 'react';
import { CalendarBlank, CalendarPlus, CourtBasketball, MagnifyingGlass, Plus, X } from '@phosphor-icons/react';

import { BOOKING_STATUS } from '@/domain/labels';
import type { BookingStatus } from '@/domain/types';
import { useAvailabilities, useCourts } from '@/features/courts/api';
import { addDays, type CalendarDate } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useQueryParams } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { InfiniteTable, TableSkeleton } from '@/ui/DataTable';
import { EmptyState } from '@/ui/EmptyState';
import { FilterMultiSelect, FilterSelect } from '@/ui/Menu';
import { Page, PageHeader } from '@/ui/Page';
import { useRegisterRefresh } from '@/ui/Refresh';
import { SearchBar, Toolbar } from '@/ui/SearchBar';
import { Tabs } from '@/ui/Tabs';

import { useBookings, type BookingFilters } from '../api';
import { bookingColumns, bookingRowLabel } from '../components/bookingColumns';
import { DateNavigator } from '../components/DateNavigator';
import { ScheduleBoard, ScheduleLegend } from '../components/ScheduleBoard';

type Period = 'upcoming' | 'today' | 'tomorrow' | 'week' | 'past7' | 'past30' | 'date';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: 'Next 7 days' },
  { value: 'past7', label: 'Past 7 days' },
  { value: 'past30', label: 'Past 30 days' },
  { value: 'date', label: 'Specific date' },
];

function periodRange(p: Period, today: CalendarDate, date: CalendarDate): Pick<BookingFilters, 'from' | 'to' | 'order'> {
  switch (p) {
    case 'upcoming':
      return { from: today, order: 'asc' };
    case 'today':
      return { from: today, to: today, order: 'asc' };
    case 'tomorrow':
      return { from: addDays(today, 1), to: addDays(today, 1), order: 'asc' };
    case 'week':
      return { from: today, to: addDays(today, 6), order: 'asc' };
    case 'past7':
      return { from: addDays(today, -7), to: addDays(today, -1), order: 'desc' };
    case 'past30':
      return { from: addDays(today, -30), to: addDays(today, -1), order: 'desc' };
    case 'date':
      return { from: date, to: date, order: 'asc' };
  }
}

type View = 'list' | 'schedule';

export function BookingsScreen() {
  const router = useAppRouter();
  const f = useFormat();
  const params = useQueryParams('view');
  const [view, setView] = useState<View>(params.view === 'schedule' ? 'schedule' : 'list');
  const today = f.today();

  return (
    <Page>
      <PageHeader
        title="Bookings"
        description="Every booking across your courts, as a list or as a day schedule."
        actions={<Button label="New booking" icon={CalendarPlus} onPress={() => router.push(routes.bookingNew())} />}
      />
      <Tabs
        label="View"
        value={view}
        onChange={setView}
        items={[
          { value: 'list', label: 'List' },
          { value: 'schedule', label: 'Day schedule' },
        ]}
      />
      {view === 'list' ? <BookingList today={today} /> : <BookingSchedule today={today} />}
    </Page>
  );
}

function BookingList({ today }: { today: CalendarDate }) {
  const router = useAppRouter();
  const f = useFormat();
  const courts = useCourts();
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const [period, setPeriod] = useState<Period>('upcoming');
  const [date, setDate] = useState<CalendarDate>(today);
  const [courtId, setCourtId] = useState<string>('');
  const [statuses, setStatuses] = useState<BookingStatus[]>([]);

  const filters = useMemo<BookingFilters>(
    () => ({
      ...periodRange(period, today, date),
      courtId: courtId || undefined,
      // "Upcoming" means still to be played, so finished games from earlier today drop off.
      status: statuses.length ? statuses : period === 'upcoming' ? (['CONFIRMED', 'PENDING'] as BookingStatus[]) : undefined,
      q: q || undefined,
    }),
    [period, today, date, courtId, statuses, q],
  );
  const query = useBookings(filters);
  useRegisterRefresh(() => query.refetch());
  const filtered = !!courtId || statuses.length > 0 || !!q || period !== 'upcoming';
  const columns = useMemo(() => bookingColumns(f), [f]);

  const clear = () => {
    setSearch('');
    setPeriod('upcoming');
    setCourtId('');
    setStatuses([]);
  };

  return (
    <Card padded={false}>
      <Toolbar actions={filtered && <Button label="Clear filters" icon={X} variant="ghost" size="sm" onPress={clear} />}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search customer or reference" className="w-full sm:w-72" />
        <FilterSelect label="Period" icon={CalendarBlank} value={period} options={PERIODS} onChange={setPeriod} active={period !== 'upcoming'} />
        {period === 'date' && (
          <input
            type="date"
            aria-label="Date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="t-label h-9 rounded-control border border-text bg-surface px-2.5 text-text outline-none focus:ring-3 focus:ring-text/10"
          />
        )}
        <FilterSelect
          label="Court"
          value={courtId}
          options={[{ value: '', label: 'All courts' }, ...(courts.data ?? []).map((c) => ({ value: c.id, label: c.name, description: c.sport }))]}
          onChange={setCourtId}
          active={!!courtId}
        />
        <FilterMultiSelect
          label="Status"
          allLabel="Any"
          value={statuses}
          options={(Object.keys(BOOKING_STATUS) as BookingStatus[]).map((s) => ({ value: s, label: BOOKING_STATUS[s].label }))}
          onChange={setStatuses}
        />
      </Toolbar>
      <InfiniteTable
        query={query}
        columns={columns}
        rowKey={(b) => b.id}
        rowHref={(b) => routes.booking(b.id)}
        rowLabel={(b) => bookingRowLabel(f, b)}
        muted={(b) => b.status === 'CANCELLED'}
        caption="Bookings"
        noun={['booking', 'bookings']}
        empty={
          filtered ? (
            <EmptyState icon={MagnifyingGlass} title="No bookings match" message="Try another period, court or status." action={<Button label="Clear filters" variant="secondary" onPress={clear} />} />
          ) : (
            <EmptyState
              icon={CalendarBlank}
              title="No upcoming bookings"
              message="New bookings will appear here as soon as they're made."
              action={<Button label="New booking" icon={Plus} onPress={() => router.push(routes.bookingNew())} />}
            />
          )
        }
      />
    </Card>
  );
}

/** Every court side by side for one day, the web version of the mobile day schedule. */
function BookingSchedule({ today }: { today: CalendarDate }) {
  const router = useAppRouter();
  const courts = useCourts();
  const [date, setDate] = useState<CalendarDate>(today);
  const list = courts.data ?? [];
  const availability = useAvailabilities(
    list.map((c) => c.id),
    date,
  );
  useRegisterRefresh(() => Promise.all([courts.refetch(), ...availability.map((a) => a.refetch())]));

  return (
    <Card padded={false}>
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-5">
        <DateNavigator value={date} today={today} onChange={setDate} />
        <ScheduleLegend />
      </div>
      {courts.isPending ? (
        <TableSkeleton rows={8} columns={4} />
      ) : courts.isSuccess && list.length === 0 ? (
        <EmptyState
          icon={CourtBasketball}
          title="Add a court to see its schedule"
          message="Each court gets its own column with free and booked slots."
          action={<Button label="Add court" icon={Plus} onPress={() => router.push(routes.courtNew)} />}
        />
      ) : (
        <ScheduleBoard
          columns={list.map((court, i) => ({ court, slots: availability[i]?.data?.slots, loading: availability[i]?.isPending, error: availability[i]?.isError }))}
          onOpenBooking={(id) => router.push(routes.booking(id))}
          onBook={(courtId, s) => router.push(routes.bookingNew({ courtId, date, startAt: s.startAt }))}
        />
      )}
    </Card>
  );
}

'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { CalendarBlank, CourtBasketball, MagnifyingGlass, Plus, X } from '@phosphor-icons/react';

import { BOOKING_STATUS } from '@/domain/labels';
import type { BookingStatus } from '@/domain/types';
import { useAvailability, useCourts } from '@/features/courts/api';
import { addDays, formatCalendarDate, type CalendarDate } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { Button } from '@/ui/Button';
import { Chip, ChipRow, SegmentedControl } from '@/ui/Chips';
import { DatePickerSheet } from '@/ui/DateField';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { IconButton } from '@/ui/IconButton';
import { InfiniteList } from '@/ui/InfiniteList';
import { Screen } from '@/ui/Screen';
import { SearchBar } from '@/ui/SearchBar';
import { OptionSheet } from '@/ui/Select';
import { ListSkeleton, Notice } from '@/ui/States';

import { useBookings, type BookingFilters } from '../api';
import { BookingRow } from '../components/BookingRow';
import { DateStrip } from '../components/DateStrip';
import { DayTimeline } from '../components/DayTimeline';

type Period = 'upcoming' | 'today' | 'tomorrow' | 'week' | 'past7' | 'past30' | 'date';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: 'Next 7 days' },
  { value: 'past7', label: 'Past 7 days' },
  { value: 'past30', label: 'Past 30 days' },
  { value: 'date', label: 'Pick a date' },
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

export function BookingsScreen() {
  const router = useAppRouter();
  const f = useFormat();
  const today = f.today();
  const [mode, setMode] = useState<'list' | 'day'>('list');
  const onNew = () => router.push(routes.bookingNew());

  return mode === 'list' ? <BookingList mode={mode} setMode={setMode} today={today} onNew={onNew} /> : <BookingDay mode={mode} setMode={setMode} today={today} onNew={onNew} />;
}

/** The pinned "Bookings" title and its New booking action, shared by both views. */
function titleProps(onNew: () => void) {
  return { title: 'Bookings', titleActions: <IconButton icon={Plus} label="New booking" onPress={onNew} variant="solid" size="sm" /> };
}

type ModeProps = { mode: 'list' | 'day'; setMode: (m: 'list' | 'day') => void; today: CalendarDate; onNew: () => void };

function Header({ mode, setMode, extra }: ModeProps & { extra?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl
        label="View"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'list', label: 'List' },
          { value: 'day', label: 'Day schedule' },
        ]}
      />
      {extra}
    </div>
  );
}

function BookingList(props: ModeProps) {
  const router = useAppRouter();
  const courts = useCourts();
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const [period, setPeriod] = useState<Period>('upcoming');
  const [date, setDate] = useState<CalendarDate>(props.today);
  const [courtId, setCourtId] = useState<string | undefined>();
  const [statuses, setStatuses] = useState<BookingStatus[]>([]);
  const [sheet, setSheet] = useState<'period' | 'court' | 'status' | 'date' | null>(null);
  const closeDate = useCallback(() => setSheet((s) => (s === 'date' ? null : s)), []);

  const filters = useMemo<BookingFilters>(
    () => ({
      ...periodRange(period, props.today, date),
      courtId,
      // "Upcoming" means still to be played, so finished games from earlier today drop off.
      status: statuses.length ? statuses : period === 'upcoming' ? (['CONFIRMED', 'PENDING'] as BookingStatus[]) : undefined,
      q: q || undefined,
    }),
    [period, props.today, date, courtId, statuses, q],
  );
  const query = useBookings(filters);
  const filtered = courtId || statuses.length > 0 || q || period !== 'upcoming';

  const clear = () => {
    setSearch('');
    setPeriod('upcoming');
    setCourtId(undefined);
    setStatuses([]);
  };

  const periodLabel = period === 'date' ? formatCalendarDate(date) : PERIODS.find((p) => p.value === period)!.label;
  const courtLabel = courtId ? (courts.data?.find((c) => c.id === courtId)?.name ?? 'Court') : 'All courts';
  const statusLabel = statuses.length === 0 ? 'Any status' : statuses.length === 1 ? BOOKING_STATUS[statuses[0]].label : `${statuses.length} statuses`;

  return (
    <>
      <InfiniteList
        {...titleProps(props.onNew)}
        query={query}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <BookingRow booking={item} onPress={(id) => router.push(routes.booking(id))} />}
        header={
          <Header
            {...props}
            extra={
              <>
                <SearchBar value={search} onChange={setSearch} placeholder="Search customer or reference" />
                <ChipRow>
                  <Chip label={periodLabel} icon={CalendarBlank} dropdown selected={period !== 'upcoming'} onPress={() => setSheet('period')} />
                  <Chip label={courtLabel} dropdown selected={!!courtId} onPress={() => setSheet('court')} />
                  <Chip label={statusLabel} dropdown selected={statuses.length > 0} onPress={() => setSheet('status')} />
                  {filtered && <Chip label="Clear" icon={X} onPress={clear} />}
                </ChipRow>
              </>
            }
          />
        }
        skeleton={<ListSkeleton />}
        empty={
          filtered ? (
            <EmptyState icon={MagnifyingGlass} title="No bookings match" message="Try another period, court or status." action={<Button label="Clear filters" variant="secondary" onPress={clear} />} />
          ) : (
            <EmptyState
              icon={CalendarBlank}
              title="No upcoming bookings"
              message="New bookings will appear here as soon as they're made."
              action={<Button label="New booking" icon={Plus} onPress={props.onNew} />}
            />
          )
        }
      />
      <OptionSheet
        visible={sheet === 'period'}
        title="Period"
        options={PERIODS}
        selected={[period]}
        onClose={() => setSheet((s) => (s === 'period' ? null : s))}
        onChange={([p]) => {
          // "Pick a date" hands over to the date sheet; the period changes once a date is chosen.
          if (p === 'date') setSheet('date');
          else setPeriod(p);
        }}
      />
      <DatePickerSheet
        visible={sheet === 'date'}
        title="Pick a date"
        value={date}
        onPick={(d) => {
          setDate(d);
          setPeriod('date');
        }}
        onClose={closeDate}
      />
      <OptionSheet
        visible={sheet === 'court'}
        title="Court"
        options={[{ value: '', label: 'All courts' }, ...(courts.data ?? []).map((c) => ({ value: c.id, label: c.name, description: c.sport }))]}
        selected={[courtId ?? '']}
        onClose={() => setSheet(null)}
        onChange={([v]) => setCourtId(v || undefined)}
      />
      <OptionSheet
        visible={sheet === 'status'}
        title="Status"
        multiple
        options={(Object.keys(BOOKING_STATUS) as BookingStatus[]).map((s) => ({ value: s, label: BOOKING_STATUS[s].label }))}
        selected={statuses}
        onClose={() => setSheet(null)}
        onChange={setStatuses}
      />
    </>
  );
}

function BookingDay(props: ModeProps) {
  const router = useAppRouter();
  const courts = useCourts();
  const [date, setDate] = useState<CalendarDate>(props.today);
  const [courtId, setCourtId] = useState<string | undefined>();
  const list = courts.data ?? [];
  const selected = courtId ?? list.find((c) => c.status === 'ACTIVE')?.id ?? list[0]?.id;
  const court = list.find((c) => c.id === selected);
  const availability = useAvailability(selected, date);

  return (
    <Screen {...titleProps(props.onNew)} onRefresh={() => Promise.all([availability.refetch(), courts.refetch()])}>
      <Header {...props} />
      <DateStrip value={date} today={props.today} onChange={setDate} />
      <ChipRow>
        {list.map((c) => (
          <Chip key={c.id} label={c.name} selected={c.id === selected} onPress={() => setCourtId(c.id)} />
        ))}
      </ChipRow>
      {court && court.status !== 'ACTIVE' && (
        <Notice tone="warning" title={`${court.name} is ${court.status === 'MAINTENANCE' ? 'in maintenance' : 'inactive'}`} message="Existing bookings still show here. New bookings are paused." />
      )}
      {courts.isSuccess && list.length === 0 ? (
        <EmptyState
          icon={CourtBasketball}
          title="Add a court to see its schedule"
          message="Each court gets its own day view with free and booked slots."
          action={<Button label="Add court" icon={Plus} onPress={() => router.push(routes.courtNew)} />}
        />
      ) : courts.isPending || availability.isPending ? (
        <ListSkeleton rows={8} withAvatar={false} />
      ) : availability.isError ? (
        <ErrorState title="Couldn't load the schedule" message="Refresh to try again." onRetry={() => void availability.refetch()} />
      ) : (availability.data?.slots.length ?? 0) === 0 ? (
        <EmptyState icon={CalendarBlank} title="Closed this day" message="The facility has no business hours on this day." />
      ) : (
        <DayTimeline
          slots={availability.data!.slots}
          onOpenBooking={(id) => router.push(routes.booking(id))}
          onBook={(s) => router.push(routes.bookingNew({ courtId: selected, date, startAt: s.startAt }))}
        />
      )}
    </Screen>
  );
}

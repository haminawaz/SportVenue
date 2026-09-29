import { useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarBlank } from 'phosphor-react-native';

import { DateStrip } from '@/features/bookings/components/DateStrip';
import { DayTimeline } from '@/features/bookings/components/DayTimeline';
import type { CalendarDate } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { useSession } from '@/session/SessionProvider';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Screen } from '@/ui/Screen';
import { ListSkeleton, Notice } from '@/ui/States';

import { useAvailability, useCourt } from '../api';

/** One court's availability and bookings, day by day. */
export function CourtCalendarScreen() {
  const { id, date: initial } = useLocalSearchParams<{ id: string; date?: string }>();
  const router = useRouter();
  const { can } = useSession();
  const f = useFormat();
  const today = f.today();
  const [date, setDate] = useState<CalendarDate>(initial ?? today);
  const court = useCourt(id);
  const availability = useAvailability(id, date);
  const [refreshing, setRefreshing] = useState(false);
  const bookable = can('booking.create') && court.data?.status === 'ACTIVE';
  const slots = availability.data?.slots ?? [];
  const free = slots.filter((s) => s.status === 'FREE').length;

  return (
    <>
      <Stack.Screen options={{ title: court.data ? `${court.data.name} calendar` : 'Calendar' }} />
      <Screen
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await Promise.all([availability.refetch(), court.refetch()]);
          setRefreshing(false);
        }}
      >
        <DateStrip value={date} today={today} onChange={setDate} />
        {court.data && court.data.status !== 'ACTIVE' && (
          <Notice tone="warning" title={`${court.data.name} is not taking bookings`} message="Existing bookings are shown. Set the court back to active to open free slots." />
        )}
        {!availability.isPending && !availability.isError && slots.length > 0 && (
          <Notice message={free > 0 ? `${free} open ${free === 1 ? 'slot' : 'slots'} on this day. Tap one to book it.` : 'Fully booked on this day.'} />
        )}
        {availability.isPending ? (
          <ListSkeleton rows={8} withAvatar={false} />
        ) : availability.isError ? (
          <ErrorState title="Couldn't load the calendar" message="Try again in a moment." onRetry={() => availability.refetch()} />
        ) : slots.length === 0 ? (
          <EmptyState icon={CalendarBlank} title="Closed this day" message="The facility has no business hours on this day." />
        ) : (
          <DayTimeline
            slots={slots}
            onOpenBooking={(bookingId) => router.push(routes.booking(bookingId))}
            onBook={bookable ? (s) => router.push(routes.bookingNew({ courtId: id, date, startAt: s.startAt })) : undefined}
          />
        )}
      </Screen>
    </>
  );
}

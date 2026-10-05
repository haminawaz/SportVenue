'use client';

import { useState } from 'react';
import { CalendarBlank } from '@phosphor-icons/react';

import { DateStrip } from '@/features/bookings/components/DateStrip';
import { DayTimeline } from '@/features/bookings/components/DayTimeline';
import type { CalendarDate } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { useQueryParams, useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Screen } from '@/ui/Screen';
import { StackHeader } from '@/ui/StackHeader';
import { ListSkeleton, Notice } from '@/ui/States';

import { useAvailability, useCourt } from '../api';

/** One court's availability and bookings, day by day. */
export function CourtCalendarScreen() {
  const id = useRouteParam('id');
  const { date: initial } = useQueryParams('date');
  const router = useAppRouter();
  const f = useFormat();
  const today = f.today();
  const [date, setDate] = useState<CalendarDate>(initial ?? today);
  const court = useCourt(id);
  const availability = useAvailability(id, date);
  const bookable = court.data?.status === 'ACTIVE';
  const slots = availability.data?.slots ?? [];
  const free = slots.filter((s) => s.status === 'FREE').length;

  return (
    <>
      <StackHeader title={court.data ? `${court.data.name} calendar` : 'Calendar'} />
      <Screen onRefresh={() => Promise.all([availability.refetch(), court.refetch()])}>
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
          <ErrorState title="Couldn't load the calendar" message="Try again in a moment." onRetry={() => void availability.refetch()} />
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

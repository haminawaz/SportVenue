'use client';

import { useState } from 'react';
import { CalendarBlank } from '@phosphor-icons/react';

import { DateNavigator } from '@/features/bookings/components/DateNavigator';
import { ScheduleBoard, ScheduleLegend } from '@/features/bookings/components/ScheduleBoard';
import type { CalendarDate } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { useQueryParams, useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { Card } from '@/ui/Card';
import { TableSkeleton } from '@/ui/DataTable';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Page, PageHeader } from '@/ui/Page';
import { Notice } from '@/ui/States';

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
  const name = court.data?.name ?? 'Court';

  return (
    <Page width="wide" onRefresh={() => Promise.all([availability.refetch(), court.refetch()])}>
      <PageHeader
        breadcrumbs={[{ label: 'Courts', href: routes.courts }, { label: name, href: routes.court(id) }, { label: 'Calendar' }]}
        title={court.data ? `${court.data.name} calendar` : 'Calendar'}
        description={!availability.isPending && !availability.isError && slots.length > 0 ? (free > 0 ? `${free} open ${free === 1 ? 'slot' : 'slots'} on this day. Select one to book it.` : 'Fully booked on this day.') : undefined}
      />
      {court.data && court.data.status !== 'ACTIVE' && (
        <Notice tone="warning" title={`${court.data.name} is not taking bookings`} message="Existing bookings are shown. Set the court back to active to open free slots." />
      )}
      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-5">
          <DateNavigator value={date} today={today} onChange={setDate} />
          <ScheduleLegend />
        </div>
        {availability.isPending || !court.data ? (
          court.isError ? (
            <ErrorState plain title="Couldn't load the calendar" message="Try again in a moment." onRetry={() => void court.refetch()} />
          ) : (
            <TableSkeleton rows={8} columns={2} />
          )
        ) : availability.isError ? (
          <ErrorState plain title="Couldn't load the calendar" message="Try again in a moment." onRetry={() => void availability.refetch()} />
        ) : slots.length === 0 ? (
          <EmptyState icon={CalendarBlank} title="Closed this day" message="The facility has no business hours on this day." />
        ) : (
          <ScheduleBoard
            columns={[{ court: court.data, slots }]}
            onOpenBooking={(bookingId) => router.push(routes.booking(bookingId))}
            onBook={bookable ? (courtId, s) => router.push(routes.bookingNew({ courtId, date, startAt: s.startAt })) : undefined}
          />
        )}
      </Card>
    </Page>
  );
}

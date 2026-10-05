'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { qk } from '@/api/queryKeys';
import type { BookingDetail } from '@/domain/types';
import { addMinutesLocal, facilityWallClock, formatCalendarDate, formatTime, minutesBetweenLocal } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { Page, PageHeader } from '@/ui/Page';
import { DescriptionList, QueryView } from '@/ui/States';

import { useBooking, useBookingQuote, useRescheduleBooking } from '../api';
import { QuoteSummary } from '../components/QuoteSummary';
import { SlotPicker, type SlotValue } from '../components/SlotPicker';

export function RescheduleScreen() {
  const id = useRouteParam('id');
  const query = useBooking(id);
  return (
    <Page width="wide">
      <QueryView query={query} errorTitle="Couldn't load booking">
        {(b) => <RescheduleForm booking={b} />}
      </QueryView>
    </Page>
  );
}

function RescheduleForm({ booking: b }: { booking: BookingDetail }) {
  const router = useAppRouter();
  const f = useFormat();
  const queryClient = useQueryClient();
  const reschedule = useRescheduleBooking(b.id);
  const current = facilityWallClock(b.startAt, f.timeZone);
  const [slot, setSlot] = useState<SlotValue>({ courtId: b.courtId, date: current.date, durationMinutes: minutesBetweenLocal(b.startAt, b.endAt) });
  const [error, setError] = useState<string>();

  const input = useMemo(() => (slot.courtId && slot.startAt ? { courtId: slot.courtId, startAt: slot.startAt, endAt: addMinutesLocal(slot.startAt, slot.durationMinutes) } : null), [slot]);
  const quote = useBookingQuote(input ? { ...input } : null);
  const unchanged = input && input.courtId === b.courtId && input.startAt.slice(0, 16) === b.startAt.slice(0, 16) && input.endAt.slice(0, 16) === b.endAt.slice(0, 16);

  const save = () => {
    if (!input) {
      setError('Choose a new start time.');
      return;
    }
    reschedule.mutate(input, {
      onSuccess: () => router.back(routes.booking(b.id)),
      onError: () => void queryClient.invalidateQueries({ queryKey: qk.availability }),
    });
  };

  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Bookings', href: routes.bookings }, { label: b.reference, href: routes.booking(b.id) }, { label: 'Reschedule' }]} title="Reschedule booking" description={`${b.customerName} · ${b.reference}`} hideRefresh />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card padded={false}>
          <CardHeader title="Move to" />
          <div className="p-5">
            <SlotPicker
              value={slot}
              onChange={(s) => {
                setSlot(s);
                setError(undefined);
              }}
              ignoreBookingId={b.id}
              slotError={error}
            />
          </div>
        </Card>
        <aside className="flex flex-col gap-6 lg:sticky lg:top-20">
          <Card padded={false}>
            <CardHeader title="Currently" />
            <div className="px-5 py-2">
              <DescriptionList
                items={[
                  { label: 'Date', value: formatCalendarDate(current.date) },
                  { label: 'Time', value: `${formatTime(b.startAt, f.timeZone)} - ${formatTime(b.endAt, f.timeZone)}` },
                  { label: 'Court', value: b.courtName },
                  { label: 'Customer', value: b.customerName },
                ]}
              />
            </div>
          </Card>
          <Card padded={false}>
            <CardHeader title="New price" />
            <div className="flex flex-col gap-4 p-5">
              <QuoteSummary quote={quote.data} loading={quote.isFetching} previousTotal={b.price} error={quote.isError} />
              <Button label="Reschedule" size="lg" block onPress={save} loading={reschedule.isPending} disabled={!!unchanged} />
              <Button label="Cancel" variant="ghost" block onPress={() => router.back(routes.booking(b.id))} />
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}

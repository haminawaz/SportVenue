import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { qk } from '@/api/queryKeys';
import type { BookingDetail } from '@/domain/types';
import { addMinutesLocal, facilityWallClock, formatCalendarDate, formatTime, minutesBetweenLocal } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { Button } from '@/ui/Button';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { QueryView } from '@/ui/States';
import { CalendarBlank } from 'phosphor-react-native';

import { useBooking, useBookingQuote, useRescheduleBooking } from '../api';
import { QuoteSummary } from '../components/QuoteSummary';
import { SlotPicker, type SlotValue } from '../components/SlotPicker';

export function RescheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useBooking(id);
  return (
    <>
      <Stack.Screen options={{ title: 'Reschedule' }} />
      <QueryView query={query} errorTitle="Couldn't load booking">
        {(b) => <RescheduleForm booking={b} />}
      </QueryView>
    </>
  );
}

function RescheduleForm({ booking: b }: { booking: BookingDetail }) {
  const router = useRouter();
  const f = useFormat();
  const queryClient = useQueryClient();
  const reschedule = useRescheduleBooking(b.id);
  const current = facilityWallClock(b.startAt, f.timeZone);
  const [slot, setSlot] = useState<SlotValue>({ courtId: b.courtId, date: current.date, durationMinutes: minutesBetweenLocal(b.startAt, b.endAt) });
  const [error, setError] = useState<string>();

  const input = useMemo(
    () => (slot.courtId && slot.startAt ? { courtId: slot.courtId, startAt: slot.startAt, endAt: addMinutesLocal(slot.startAt, slot.durationMinutes) } : null),
    [slot],
  );
  const quote = useBookingQuote(input ? { ...input } : null);
  const unchanged = input && input.courtId === b.courtId && input.startAt.slice(0, 16) === b.startAt.slice(0, 16) && input.endAt.slice(0, 16) === b.endAt.slice(0, 16);

  const save = () => {
    if (!input) {
      setError('Choose a new start time.');
      return;
    }
    reschedule.mutate(input, {
      onSuccess: () => router.back(),
      onError: () => void queryClient.invalidateQueries({ queryKey: qk.availability }),
    });
  };

  return (
    <Screen keyboard footer={<Button label="Reschedule" block onPress={save} loading={reschedule.isPending} disabled={!!unchanged} />}>
      <ListGroup title="Currently">
        <ListRow
          icon={CalendarBlank}
          title={`${formatCalendarDate(current.date)}, ${formatTime(b.startAt, f.timeZone)} - ${formatTime(b.endAt, f.timeZone)}`}
          subtitle={`${b.courtName} · ${b.customerName}`}
        />
      </ListGroup>
      <View>
        <SectionHeader title="Move to" />
        <SlotPicker
          value={slot}
          onChange={(s) => {
            setSlot(s);
            setError(undefined);
          }}
          ignoreBookingId={b.id}
          slotError={error}
        />
      </View>
      <QuoteSummary quote={quote.data} loading={quote.isFetching} previousTotal={b.price} error={quote.isError} />
    </Screen>
  );
}

'use client';

import { useMemo } from 'react';
import { CalendarX } from '@phosphor-icons/react';

import { useAvailability, useCourts } from '@/features/courts/api';
import { addDays, addMinutesLocal, formatTime, type CalendarDate } from '@/lib/datetime';
import { formatDuration, useFormat } from '@/lib/format';
import { AppText } from '@/ui/AppText';
import { cn } from '@/ui/cn';
import { EmptyState } from '@/ui/EmptyState';
import { DateField, FieldShell, SelectField } from '@/ui/Fields';
import { Skeleton } from '@/ui/Skeleton';
import { SegmentedControl } from '@/ui/Tabs';

export type SlotValue = { courtId?: string; date: CalendarDate; durationMinutes: number; startAt?: string };

const DURATIONS = [60, 90, 120];

type SlotPickerProps = {
  value: SlotValue;
  onChange: (v: SlotValue) => void;
  /** When rescheduling, the booking's own slots count as free. */
  ignoreBookingId?: string;
  courtError?: string;
  slotError?: string;
};

/**
 * Court, date, length and start time. Start times come from the server's
 * availability for that court and day; the server re-validates on save.
 */
export function SlotPicker({ value, onChange, ignoreBookingId, courtError, slotError }: SlotPickerProps) {
  const f = useFormat();
  const today = f.today();
  const courts = useCourts(['ACTIVE']);
  const availability = useAvailability(value.courtId, value.date);

  const starts = useMemo(() => {
    const slots = availability.data?.slots ?? [];
    const step = availability.data?.slotMinutes ?? 60;
    const need = Math.ceil(value.durationMinutes / step);
    const usable = (i: number) => slots[i] && (slots[i].status === 'FREE' || (ignoreBookingId && slots[i].bookingId === ignoreBookingId));
    const out: { startAt: string; rate?: number }[] = [];
    for (let i = 0; i + need <= slots.length; i++) {
      let ok = true;
      for (let k = 0; k < need; k++) if (!usable(i + k)) ok = false;
      if (ok) out.push({ startAt: slots[i].startAt, rate: slots[i].rate });
    }
    return out;
  }, [availability.data, value.durationMinutes, ignoreBookingId]);

  const set = (patch: Partial<SlotValue>) => onChange({ ...value, startAt: undefined, ...patch });
  const courtList = courts.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {courts.isPending ? (
          <FieldShell label="Court">
            <Skeleton height={40} />
          </FieldShell>
        ) : courtList.length === 0 ? (
          <FieldShell label="Court" error={courtError}>
            <AppText variant="small" tone="muted">
              No courts are open for booking. Set a court to active first.
            </AppText>
          </FieldShell>
        ) : (
          <SelectField
            label="Court"
            value={value.courtId}
            placeholder="Choose a court"
            options={courtList.map((c) => ({ value: c.id, label: c.name, description: c.sport }))}
            onChange={(courtId) => set({ courtId })}
            error={courtError}
          />
        )}
        <DateField label="Date" value={value.date} minimumDate={today} maximumDate={addDays(today, 90)} onChange={(date) => set({ date })} />
      </div>

      <FieldShell label="Length">
        <div>
          <SegmentedControl label="Length" value={String(value.durationMinutes)} options={DURATIONS.map((d) => ({ value: String(d), label: formatDuration(d) }))} onChange={(d) => set({ durationMinutes: Number(d) })} />
        </div>
      </FieldShell>

      <FieldShell label="Start time" error={slotError}>
        {!value.courtId ? (
          <AppText variant="small" tone="muted">
            Choose a court to see open times.
          </AppText>
        ) : availability.isPending ? (
          <div role="progressbar" aria-label="Loading open times" className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} height={52} />
            ))}
          </div>
        ) : availability.isError ? (
          <AppText variant="small" tone="danger" role="alert">
            Couldn’t load open times. Refresh or pick the date again.
          </AppText>
        ) : starts.length === 0 ? (
          <EmptyState framed compact icon={CalendarX} title="No open times" message={`Nothing free for ${formatDuration(value.durationMinutes)} on this day. Try another day, court or a shorter game.`} />
        ) : (
          <div role="radiogroup" aria-label="Start time" className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-6">
            {starts.map((s) => {
              const on = s.startAt === value.startAt;
              const label = formatTime(s.startAt, f.timeZone);
              const end = formatTime(addMinutesLocal(s.startAt, value.durationMinutes), f.timeZone);
              return (
                <button
                  key={s.startAt}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={`${label} to ${end}`}
                  onClick={() => onChange({ ...value, startAt: s.startAt })}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-control border px-2 py-2 transition-colors',
                    on ? 'border-primary bg-primary text-on-primary' : 'border-border-strong bg-surface text-text hover:border-text',
                  )}
                >
                  <span className="t-text-strong tabular-nums">{label}</span>
                  <span className={cn('t-mini tabular-nums', on ? 'text-on-primary/80' : 'text-text-muted')}>to {end}</span>
                </button>
              );
            })}
          </div>
        )}
      </FieldShell>
    </div>
  );
}

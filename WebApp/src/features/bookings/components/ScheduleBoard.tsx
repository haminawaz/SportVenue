'use client';

import { Plus, Prohibit } from '@phosphor-icons/react';

import { COURT_STATUS } from '@/domain/labels';
import type { AvailabilitySlot, Court } from '@/domain/types';
import { formatTime } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { AppText } from '@/ui/AppText';
import { cn } from '@/ui/cn';
import { Skeleton } from '@/ui/Skeleton';
import { Spinner } from '@/ui/Spinner';
import { StatusBadge } from '@/ui/StatusBadge';

/** Pixels per minute on the time axis: an hour is 64px tall. */
const PX = 64 / 60;

export type ScheduleColumn = {
  court: Pick<Court, 'id' | 'name' | 'sport' | 'status'>;
  slots?: AvailabilitySlot[];
  loading?: boolean;
  error?: boolean;
};

type ScheduleBoardProps = {
  columns: ScheduleColumn[];
  onBook?: (courtId: string, slot: AvailabilitySlot) => void;
  onOpenBooking?: (bookingId: string) => void;
};

const minutesOf = (local: string) => Number(local.slice(11, 13)) * 60 + Number(local.slice(14, 16));
const isMidnight = (local: string) => local.slice(11, 16) === '00:00';

/** Consecutive slots of the same booking become one block, so a 90-minute game reads as one item. */
function mergeBlocks(slots: AvailabilitySlot[]) {
  const blocks: AvailabilitySlot[] = [];
  for (const s of slots) {
    const last = blocks[blocks.length - 1];
    if (last && s.status === 'BOOKED' && last.status === 'BOOKED' && last.bookingId === s.bookingId) last.endAt = s.endAt;
    else blocks.push({ ...s });
  }
  return blocks;
}

/**
 * A day calendar with one column per court on a shared time axis: booked
 * blocks open the booking, free slots start a booking, closed and past slots
 * are greyed out. On narrow screens the columns scroll sideways.
 */
export function ScheduleBoard({ columns, onBook, onOpenBooking }: ScheduleBoardProps) {
  const f = useFormat();
  const all = columns.flatMap((c) => c.slots ?? []);
  const loading = columns.some((c) => c.loading);
  const start = all.length ? Math.floor(Math.min(...all.map((s) => minutesOf(s.startAt))) / 60) * 60 : 7 * 60;
  const end = all.length ? Math.ceil(Math.max(...all.map((s) => (isMidnight(s.endAt) ? 24 * 60 : minutesOf(s.endAt)))) / 60) * 60 : 23 * 60;
  const hours = Array.from({ length: Math.max(1, (end - start) / 60) }, (_, i) => start + i * 60);
  const height = (end - start) * PX;
  const clock = (m: number) => `${m / 60 % 12 === 0 ? 12 : (m / 60) % 12} ${m < 720 || m === 1440 ? 'AM' : 'PM'}`;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full" style={{ width: `max(100%, ${72 + columns.length * 180}px)` }}>
        {/* Court headers */}
        <div className="sticky top-0 z-10 flex border-b border-border bg-surface">
          <div className="w-[72px] shrink-0" />
          {columns.map(({ court }) => (
            <div key={court.id} className="flex min-w-0 flex-1 items-center gap-2 border-l border-border px-3 py-2.5">
              <span className="flex min-w-0 flex-col">
                <AppText variant="text-strong" lines={1}>
                  {court.name}
                </AppText>
                <AppText variant="mini" tone="muted" lines={1}>
                  {court.sport}
                </AppText>
              </span>
              {court.status !== 'ACTIVE' && <StatusBadge label={COURT_STATUS[court.status].label} tone={COURT_STATUS[court.status].tone} />}
            </div>
          ))}
        </div>

        <div className="relative flex" style={{ height }}>
          {/* Time axis */}
          <div className="relative w-[72px] shrink-0">
            {hours.map((m) => (
              <AppText key={m} variant="mini" tone="subtle" numeric className="absolute right-3 -translate-y-1/2 whitespace-nowrap" style={{ top: (m - start) * PX }}>
                {m === start ? '' : clock(m)}
              </AppText>
            ))}
          </div>
          {/* Hour lines */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 left-[72px]">
            {hours.map((m) => (
              <div key={m} className="absolute inset-x-0 border-t border-border/70" style={{ top: (m - start) * PX }} />
            ))}
          </div>

          {columns.map(({ court, slots, loading: colLoading, error }) => (
            <div key={court.id} role="list" aria-label={`${court.name} schedule`} className="relative min-w-0 flex-1 border-l border-border">
              {colLoading ? (
                <div className="flex flex-col gap-2 p-2">
                  <Skeleton height={56} />
                  <Skeleton height={56} />
                </div>
              ) : error ? (
                <AppText variant="small" tone="danger" className="p-3">
                  Couldn’t load this court.
                </AppText>
              ) : (slots ?? []).length === 0 ? (
                <AppText variant="small" tone="subtle" className="p-3">
                  Closed this day
                </AppText>
              ) : (
                mergeBlocks(slots ?? []).map((s) => {
                  const top = (minutesOf(s.startAt) - start) * PX;
                  const h = ((isMidnight(s.endAt) ? 24 * 60 : minutesOf(s.endAt)) - minutesOf(s.startAt)) * PX;
                  const range = `${formatTime(s.startAt, f.timeZone)} - ${formatTime(s.endAt, f.timeZone)}`;
                  const style = { top: top + 1, height: Math.max(h - 2, 18) };
                  if (s.status === 'BOOKED') {
                    const canOpen = !!onOpenBooking && !!s.bookingId;
                    return (
                      <div key={s.startAt} role="listitem" className="absolute inset-x-1" style={style}>
                        <button
                          type="button"
                          aria-label={`Booked, ${court.name}, ${range}, ${s.customerName ?? ''}`}
                          disabled={!canOpen}
                          onClick={() => s.bookingId && onOpenBooking?.(s.bookingId)}
                          className="flex h-full w-full flex-col overflow-hidden rounded-[8px] border-l-[3px] border-accent bg-accent-soft px-2 py-1 text-left transition-[filter] enabled:hover:brightness-95"
                        >
                          <AppText variant="label" lines={1}>
                            {s.customerName ?? 'Booked'}
                          </AppText>
                          {h > 36 && (
                            <AppText variant="mini" tone="muted" numeric lines={1}>
                              {range}
                            </AppText>
                          )}
                        </button>
                      </div>
                    );
                  }
                  if (s.status === 'FREE') {
                    return (
                      <div key={s.startAt} role="listitem" className="absolute inset-x-1" style={style}>
                        <button
                          type="button"
                          aria-label={`Free, ${court.name}, ${range}${s.rate ? `, ${f.moneyA11y(s.rate)} per hour` : ''}. Book this slot`}
                          disabled={!onBook}
                          onClick={() => onBook?.(court.id, s)}
                          className="group flex h-full w-full items-start justify-between gap-1 overflow-hidden rounded-[8px] border border-dashed border-transparent px-2 py-1 text-left transition-colors enabled:hover:border-accent enabled:hover:bg-accent-soft/50 focus-visible:border-accent"
                        >
                          <AppText variant="mini" tone="subtle" numeric>
                            {s.rate ? `${f.money(s.rate)}/h` : 'Free'}
                          </AppText>
                          {onBook && (
                            <span className="t-mini flex items-center gap-0.5 font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                              <Plus size={11} weight="bold" aria-hidden />
                              Book
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={s.startAt}
                      role="listitem"
                      aria-label={`${s.status === 'CLOSED' ? 'Closed' : 'Past'}, ${range}`}
                      className={cn('absolute inset-x-1 flex items-start gap-1 rounded-[8px] px-2 py-1 text-text-subtle', s.status === 'CLOSED' ? 'bg-[repeating-linear-gradient(135deg,var(--surface-muted)_0_6px,transparent_6px_12px)]' : 'bg-surface-muted/60')}
                      style={style}
                    >
                      {s.status === 'CLOSED' && <Prohibit size={11} className="mt-0.5" aria-hidden />}
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>
      {loading && (
        <span className="sr-only">
          <Spinner label="Loading schedule" />
        </span>
      )}
    </div>
  );
}

/** Colour key for the schedule. */
export function ScheduleLegend() {
  const item = (cls: string, label: string) => (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className={cn('h-3 w-3 rounded-[3px]', cls)} />
      <AppText variant="mini" tone="muted">
        {label}
      </AppText>
    </span>
  );
  return (
    <div className="flex flex-wrap items-center gap-4">
      {item('border-l-[3px] border-accent bg-accent-soft', 'Booked')}
      {item('border border-dashed border-accent', 'Free (select to book)')}
      {item('bg-surface-muted', 'Passed')}
      {item('bg-[repeating-linear-gradient(135deg,var(--border-strong)_0_2px,transparent_2px_4px)]', 'Closed')}
    </div>
  );
}

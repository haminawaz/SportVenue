'use client';

import { Plus, Prohibit } from '@phosphor-icons/react';

import type { AvailabilitySlot } from '@/domain/types';
import { formatTime } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { AppText } from '@/ui/AppText';

type DayTimelineProps = {
  slots: AvailabilitySlot[];
  onBook?: (slot: AvailabilitySlot) => void;
  onOpenBooking?: (bookingId: string) => void;
};

/**
 * A compact list of one court's slots (court side panel, landing preview).
 * Consecutive slots of the same booking are merged into one item.
 */
export function DayTimeline({ slots, onBook, onOpenBooking }: DayTimelineProps) {
  const f = useFormat();

  const blocks: AvailabilitySlot[] = [];
  for (const s of slots) {
    const last = blocks[blocks.length - 1];
    if (last && s.status === 'BOOKED' && last.status === 'BOOKED' && last.bookingId === s.bookingId) last.endAt = s.endAt;
    else blocks.push({ ...s });
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {blocks.map((s) => {
        const time = formatTime(s.startAt, f.timeZone);
        const range = `${time} - ${formatTime(s.endAt, f.timeZone)}`;
        const timeLabel = (
          <AppText variant="mini" tone="muted" numeric className="w-14 shrink-0 pt-2 text-right">
            {time}
          </AppText>
        );
        if (s.status === 'BOOKED') {
          const canOpen = !!onOpenBooking && !!s.bookingId;
          return (
            <li key={s.startAt}>
              <button type="button" aria-label={`Booked, ${range}, ${s.customerName ?? ''}`} disabled={!canOpen} onClick={() => s.bookingId && onOpenBooking?.(s.bookingId)} className="flex w-full gap-3 text-left disabled:cursor-default">
                {timeLabel}
                <span className="flex min-w-0 flex-1 flex-col rounded-[8px] border-l-[3px] border-accent bg-accent-soft px-2.5 py-1.5 transition-[filter] hover:brightness-95">
                  <AppText variant="label" lines={1}>
                    {s.customerName ?? 'Booked'}
                  </AppText>
                  <AppText variant="mini" tone="muted" numeric>
                    {range}
                  </AppText>
                </span>
              </button>
            </li>
          );
        }
        if (s.status === 'FREE') {
          return (
            <li key={s.startAt}>
              <button type="button" aria-label={`Free, ${range}${s.rate ? `, ${f.moneyA11y(s.rate)} per hour` : ''}. Book this slot`} disabled={!onBook} onClick={() => onBook?.(s)} className="group flex w-full gap-3 text-left disabled:cursor-default">
                {timeLabel}
                <span className="flex min-h-9 flex-1 items-center rounded-[8px] border border-dashed border-border-strong px-2.5 transition-colors group-enabled:group-hover:border-accent group-enabled:group-hover:bg-accent-soft/50">
                  <AppText variant="small" tone="muted" className="flex-1">
                    Free{s.rate ? ` · ${f.money(s.rate)}/h` : ''}
                  </AppText>
                  {onBook && (
                    <span className="t-mini flex items-center gap-0.5 font-medium text-accent">
                      <Plus size={11} weight="bold" aria-hidden />
                      Book
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        }
        return (
          <li key={s.startAt} aria-label={`${s.status === 'CLOSED' ? 'Closed' : 'Past'}, ${range}`} className="flex gap-3">
            {timeLabel}
            <span aria-hidden className="flex min-h-8 flex-1 items-center gap-1.5 rounded-[8px] bg-surface-muted px-2.5 text-text-subtle">
              {s.status === 'CLOSED' && <Prohibit size={12} />}
              <AppText variant="mini" tone="subtle">
                {s.status === 'CLOSED' ? 'Closed' : 'Passed'}
              </AppText>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

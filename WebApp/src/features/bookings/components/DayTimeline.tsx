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
 * A court's day, slot by slot. Consecutive slots of the same booking are
 * merged into one block so a 90-minute game reads as one item.
 */
export function DayTimeline({ slots, onBook, onOpenBooking }: DayTimelineProps) {
  const f = useFormat();

  const blocks: (AvailabilitySlot & { endAt: string })[] = [];
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
          <AppText variant="body-sm" tone={s.status === 'BOOKED' || s.status === 'FREE' ? 'muted' : 'subtle'} numeric className="w-16 shrink-0 pt-2.5 text-right">
            {time}
          </AppText>
        );

        if (s.status === 'BOOKED') {
          const canOpen = !!onOpenBooking && !!s.bookingId;
          return (
            <li key={s.startAt}>
              <button
                type="button"
                aria-label={`Booked, ${range}, ${s.customerName ?? ''}`}
                disabled={!canOpen}
                onClick={() => s.bookingId && onOpenBooking?.(s.bookingId)}
                className="flex w-full items-stretch gap-3 text-left transition-opacity enabled:hover:opacity-90 enabled:active:opacity-80 disabled:cursor-default"
              >
                {timeLabel}
                <span className="flex min-h-11 min-w-0 flex-1 flex-col justify-center rounded-control border-l-[3px] border-accent bg-accent-soft px-3 py-2">
                  <AppText variant="body-strong" lines={1}>
                    {s.customerName ?? 'Booked'}
                  </AppText>
                  <AppText variant="body-sm" tone="muted" numeric>
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
              <button
                type="button"
                aria-label={`Free, ${range}${s.rate ? `, ${f.moneyA11y(s.rate)} per hour` : ''}. Book this slot`}
                disabled={!onBook}
                onClick={() => onBook?.(s)}
                className="group flex w-full items-stretch gap-3 text-left disabled:cursor-default"
              >
                {timeLabel}
                <span className="flex min-h-11 min-w-0 flex-1 items-center rounded-control border border-dashed border-border px-3 py-2 transition-colors group-enabled:group-hover:border-accent group-enabled:group-hover:bg-accent-soft/40">
                  <AppText variant="nav-link" tone="muted" className="flex-1">
                    Free{s.rate ? ` · ${f.money(s.rate)}/h` : ''}
                  </AppText>
                  {onBook && (
                    <span className="flex items-center gap-0.5 text-accent">
                      <Plus size={14} weight="bold" aria-hidden />
                      <AppText variant="nav-link" className="text-current">
                        Book
                      </AppText>
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        }
        return (
          <li key={s.startAt} aria-label={`${s.status === 'CLOSED' ? 'Closed' : 'Past'}, ${range}`} className="flex items-stretch gap-3">
            {timeLabel}
            <span aria-hidden className="flex min-h-9 flex-1 items-center gap-1.5 rounded-control bg-surface-muted px-3 py-2 text-text-subtle">
              {s.status === 'CLOSED' && <Prohibit size={14} />}
              <AppText variant="body-sm" tone="subtle">
                {s.status === 'CLOSED' ? 'Closed' : 'Passed'}
              </AppText>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

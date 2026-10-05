'use client';

import { CaretLeft, CaretRight } from '@phosphor-icons/react';

import { addDays, formatCalendarDate, relativeDayLabel, type CalendarDate } from '@/lib/datetime';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';

type DateNavigatorProps = { value: CalendarDate; today: CalendarDate; onChange: (d: CalendarDate) => void };

/** Day stepper for calendars: previous/next, jump to today, or pick any date. */
export function DateNavigator({ value, today, onChange }: DateNavigatorProps) {
  const rel = relativeDayLabel(value, today);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex overflow-hidden rounded-control border border-border-strong bg-surface">
        <button type="button" aria-label="Previous day" title="Previous day" onClick={() => onChange(addDays(value, -1))} className="flex h-9 w-9 items-center justify-center text-text-muted hover:bg-surface-muted hover:text-text">
          <CaretLeft size={16} weight="bold" />
        </button>
        <button type="button" aria-label="Next day" title="Next day" onClick={() => onChange(addDays(value, 1))} className="flex h-9 w-9 items-center justify-center border-l border-border-strong text-text-muted hover:bg-surface-muted hover:text-text">
          <CaretRight size={16} weight="bold" />
        </button>
      </div>
      <Button label="Today" variant="secondary" disabled={value === today} onPress={() => onChange(today)} />
      <input
        type="date"
        aria-label="Pick a date"
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="t-label h-9 rounded-control border border-border-strong bg-surface px-2.5 text-text outline-none focus:border-text focus:ring-3 focus:ring-text/10"
      />
      <AppText as="h2" variant="heading" aria-live="polite" className="ml-1">
        {rel === formatCalendarDate(value) ? rel : `${rel}, ${formatCalendarDate(value)}`}
      </AppText>
    </div>
  );
}

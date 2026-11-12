'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

import { addDays, type CalendarDate } from '@/lib/datetime';

import { AppText } from './AppText';
import { cn } from './cn';

/** A calendar month as "YYYY-MM". */
type Month = string;

const utc = (d: CalendarDate) => new Date(`${d}T00:00:00Z`);
const monthOf = (d: CalendarDate): Month => d.slice(0, 7);
const addMonths = (m: Month, n: number): Month => {
  const d = new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};
const daysIn = (m: Month) => new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0)).getUTCDate();
/** Same day of the month `n` months on, kept inside that month. */
const shiftMonths = (d: CalendarDate, n: number): CalendarDate => {
  const m = addMonths(monthOf(d), n);
  return `${m}-${String(Math.min(Number(d.slice(8, 10)), daysIn(m))).padStart(2, '0')}`;
};
/** Monday = 0 ... Sunday = 6. */
const weekdayIndex = (d: CalendarDate) => (utc(d).getUTCDay() + 6) % 7;

const monthTitle = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' });
const dayLabel = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const WEEK = [
  ['Mo', 'Monday'],
  ['Tu', 'Tuesday'],
  ['We', 'Wednesday'],
  ['Th', 'Thursday'],
  ['Fr', 'Friday'],
  ['Sa', 'Saturday'],
  ['Su', 'Sunday'],
] as const;

/** The weeks of a month, Monday first, with empty cells before the 1st and after the last day. */
function weeksOf(m: Month): (CalendarDate | null)[][] {
  const first = `${m}-01`;
  const cells: (CalendarDate | null)[] = Array.from({ length: weekdayIndex(first) }, () => null);
  for (let i = 0; i < daysIn(m); i++) cells.push(addDays(first, i));
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

type RangeCalendarProps = {
  /** First day picked, if any. */
  start: CalendarDate | null;
  /** Last day picked, if any (never before `start`). */
  end: CalendarDate | null;
  /** Last day that can be picked (today when future days are not allowed). */
  max: CalendarDate;
  /** Today, marked on the calendar. */
  today: CalendarDate;
  /** Months side by side. */
  months?: 1 | 2;
  onPick: (date: CalendarDate) => void;
};

/**
 * A month grid for picking a date range: weeks start on Monday, days after
 * `max` are disabled, and the days between the two ends are highlighted (as a
 * preview while choosing the last day). Arrow keys move by day and week, Page
 * Up and Page Down by month, Home and End to the start and end of the week.
 * It takes focus on the start day (or the latest day) when it mounts.
 */
export function RangeCalendar({ start, end, max, today, months = 2, onPick }: RangeCalendarProps) {
  const [focused, setFocused] = useState<CalendarDate>(() => end ?? start ?? (today <= max ? today : max));
  // The last month shown holds the focused day, so recent days are in view.
  const [lastMonth, setLastMonth] = useState<Month>(() => monthOf(end ?? start ?? (today <= max ? today : max)));
  const [hover, setHover] = useState<CalendarDate | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const moved = useRef(true);

  const firstMonth = addMonths(lastMonth, -(months - 1));
  const shown = Array.from({ length: months }, (_, i) => addMonths(firstMonth, i));
  const canGoNext = lastMonth < monthOf(max);

  // Move real focus with the roving day (on mount and after keyboard moves).
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
  }, [focused, lastMonth]);

  const focusDay = (d: CalendarDate) => {
    const day = d > max ? max : d;
    const m = monthOf(day);
    if (m > lastMonth) setLastMonth(m);
    else if (m < firstMonth) setLastMonth(addMonths(m, months - 1));
    moved.current = true;
    setFocused(day);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, () => CalendarDate> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => shiftMonths(focused, -1),
      PageDown: () => shiftMonths(focused, 1),
      Home: () => addDays(focused, -weekdayIndex(focused)),
      End: () => addDays(focused, 6 - weekdayIndex(focused)),
    };
    const move = moves[e.key];
    if (!move || !(e.target as HTMLElement).dataset.date) return;
    e.preventDefault();
    focusDay(move());
  };

  // The range drawn: both ends once picked, or the start to the hovered day while picking the end.
  const lo = start;
  const hi = end ?? (start && hover && hover >= start ? hover : null);

  return (
    <div>
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setLastMonth((m) => addMonths(m, -1))}
          className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text"
        >
          <CaretLeft size={16} weight="bold" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Next month"
          disabled={!canGoNext}
          onClick={() => setLastMonth((m) => addMonths(m, 1))}
          className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text disabled:pointer-events-none disabled:opacity-35"
        >
          <CaretRight size={16} weight="bold" aria-hidden />
        </button>
      </div>
      <div ref={grid} onKeyDown={onKey} onMouseLeave={() => setHover(null)} className={cn('grid gap-6', months === 2 && 'grid-cols-2')}>
        {shown.map((m) => (
          <div key={m} className="min-w-0">
            <AppText as="h3" variant="label" className="mb-2 text-center" aria-hidden>
              {monthTitle.format(utc(`${m}-01`))}
            </AppText>
            <table role="grid" aria-label={monthTitle.format(utc(`${m}-01`))} className="w-full border-collapse">
              <thead>
                <tr>
                  {WEEK.map(([short, long]) => (
                    <th key={short} scope="col" abbr={long} className="t-mini h-8 font-medium text-text-subtle">
                      {short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeksOf(m).map((week, w) => (
                  <tr key={w}>
                    {week.map((d, i) => {
                      if (!d) return <td key={i} className="p-0" />;
                      const isStart = d === lo;
                      const isEnd = d === hi;
                      const between = !!lo && !!hi && d > lo && d < hi;
                      const disabled = d > max;
                      return (
                        <td
                          key={i}
                          className={cn(
                            'p-0',
                            (between || (isStart && hi && hi !== lo) || (isEnd && lo && hi !== lo)) && 'bg-accent-soft',
                            isStart && hi && hi !== lo && 'rounded-l-full',
                            isEnd && lo && hi !== lo && 'rounded-r-full',
                          )}
                        >
                          <button
                            type="button"
                            data-date={d}
                            tabIndex={d === focused ? 0 : -1}
                            disabled={disabled}
                            aria-pressed={isStart || (isEnd && !!end)}
                            aria-label={`${dayLabel.format(utc(d))}${d === today ? ', today' : ''}${isStart ? ', first day' : ''}${isEnd && end ? ', last day' : ''}`}
                            onClick={() => {
                              setFocused(d);
                              onPick(d);
                            }}
                            onMouseEnter={() => setHover(d)}
                            onFocus={() => setFocused(d)}
                            className={cn(
                              't-label mx-auto grid size-9 place-items-center rounded-full tabular-nums transition-colors',
                              isStart || isEnd ? 'bg-accent font-semibold text-on-accent' : between ? 'text-text hover:bg-surface' : 'text-text hover:bg-surface-muted',
                              d === today && !isStart && !isEnd && 'ring-1 ring-border-strong ring-inset',
                              disabled && 'cursor-not-allowed text-text-subtle opacity-40 hover:bg-transparent',
                            )}
                          >
                            {Number(d.slice(8, 10))}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

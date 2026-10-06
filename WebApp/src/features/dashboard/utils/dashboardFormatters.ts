import { daysBetween, formatCalendarDate, formatMonthDay, startOfWeek, type CalendarDate } from '@/lib/datetime';
import type { BadgeTone } from '@/ui/StatusBadge';

import type { BookingStatus, DateRange, DateRangePreset, RecommendedAction } from '../types/facilityDashboard.types';

/**
 * Range rules for the dashboard filter, matching the report API: past and
 * present only, at most one year (366 days, so a leap year fits).
 */
export const RANGE_RULES = { allowFuture: false, maxRangeDays: 366 } as const;

/** Every preset runs from the start of its period up to today. Quarters are calendar quarters (Jan, Apr, Jul, Oct). */
export function buildPresetRange(preset: Exclude<DateRangePreset, 'custom'>, today: CalendarDate): DateRange {
  const year = today.slice(0, 4);
  const month = Number(today.slice(5, 7));
  switch (preset) {
    case 'today':
      return { preset, startDate: today, endDate: today };
    case 'this_week':
      return { preset, startDate: startOfWeek(today), endDate: today };
    case 'this_month':
      return { preset, startDate: `${today.slice(0, 8)}01`, endDate: today };
    case 'this_quarter': {
      const first = month - ((month - 1) % 3);
      return { preset, startDate: `${year}-${String(first).padStart(2, '0')}-01`, endDate: today };
    }
    case 'this_year':
      return { preset, startDate: `${year}-01-01`, endDate: today };
  }
}

/** A custom period between two days, inclusive. */
export function buildCustomRange(startDate: CalendarDate, endDate: CalendarDate): DateRange {
  return { preset: 'custom', startDate, endDate };
}

export type RangeValidation = { valid: true } | { valid: false; reason: string };

export function validateRange(range: DateRange, today: CalendarDate): RangeValidation {
  if (daysBetween(range.startDate, range.endDate) < 0) return { valid: false, reason: 'Start date must be on or before end date.' };
  if (!RANGE_RULES.allowFuture && daysBetween(today, range.endDate) > 0) return { valid: false, reason: 'Pick today or an earlier date.' };
  if (daysBetween(range.startDate, range.endDate) + 1 > RANGE_RULES.maxRangeDays) {
    return { valid: false, reason: 'Pick a range of one year or less.' };
  }
  return { valid: true };
}

export function isSameRange(a: DateRange, b: DateRange) {
  return a.startDate === b.startDate && a.endDate === b.endDate;
}

export const PRESET_TITLES: Record<Exclude<DateRangePreset, 'custom'>, string> = {
  today: 'Today',
  this_week: 'This week',
  this_month: 'This month',
  this_quarter: 'This quarter',
  this_year: 'This year',
};

const span = (range: DateRange) => (range.startDate === range.endDate ? formatMonthDay(range.endDate) : `${formatMonthDay(range.startDate)} - ${formatMonthDay(range.endDate)}`);

/** Label for the selected period, for example "Today, Sep 29", "This month, Sep 1 - Sep 29" or "Aug 3, 2026 - Sep 29, 2026". */
export function rangeLabel(range: DateRange): { title: string; detail: string } {
  if (range.preset === 'custom') {
    return {
      title: range.startDate === range.endDate ? formatCalendarDate(range.startDate) : `${formatCalendarDate(range.startDate)} - ${formatCalendarDate(range.endDate)}`,
      detail: '',
    };
  }
  return { title: PRESET_TITLES[range.preset], detail: span(range) };
}

export type Trend = { direction: 'up' | 'down' | 'flat'; text: string; a11y: string };

/** `short` replaces `against` in the visible text only (narrow tiles); screen readers always hear `against`. */
export function percentTrend(change: number | null | undefined, against: string, short = against): Trend | null {
  if (change === null || change === undefined) return null;
  // Round the magnitude so -4.25 and +4.25 both read as 4.3.
  const abs = Math.round(Math.abs(change) * 10) / 10;
  if (abs === 0) return { direction: 'flat', text: `No change ${short}`, a11y: `No change ${against}` };
  const direction = change > 0 ? 'up' : 'down';
  return { direction, text: `${change > 0 ? '+' : '-'}${abs}% ${short}`, a11y: `${direction} ${abs} percent ${against}` };
}

export function countTrend(change: number | null | undefined, against: string): Trend | null {
  if (change === null || change === undefined) return null;
  if (change === 0) return { direction: 'flat', text: `No change ${against}`, a11y: `No change ${against}` };
  const direction = change > 0 ? 'up' : 'down';
  const abs = Math.abs(change);
  return { direction, text: `${change > 0 ? '+' : '-'}${abs} ${against}`, a11y: `${direction} ${abs} ${against}` };
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function pluralize(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

const STATUS: Record<BookingStatus, { label: string; tone: BadgeTone }> = {
  PAID: { label: 'Paid', tone: 'positive' },
  PARTIALLY_PAID: { label: 'Part paid', tone: 'warning' },
  UNPAID: { label: 'Unpaid', tone: 'danger' },
  PENDING: { label: 'Pending', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

export function bookingStatusMeta(status: BookingStatus | string): { label: string; tone: BadgeTone } {
  return STATUS[status as BookingStatus] ?? { label: String(status).replace(/_/g, ' ').toLowerCase(), tone: 'neutral' };
}

/**
 * Human text for a backend recommendation. Returns null for anything the
 * app does not know how to phrase; the UI then shows no suggestion rather
 * than inventing one.
 */
export function recommendationText(action: RecommendedAction | undefined, format: (amount: number) => string): string | null {
  if (!action) return null;
  const value =
    action.value === undefined ? null : action.unit === 'PERCENT' ? `${action.value}%` : action.unit === 'AMOUNT' ? format(action.value) : null;
  switch (action.type) {
    case 'DISCOUNT':
      return value ? `Suggested: offer a ${value} discount` : 'Suggested: offer a discount';
    case 'PRICE_INCREASE':
      return value ? `Suggested: raise the price by ${value}` : 'Suggested: raise the price';
    case 'REMIND':
      return 'Suggested: send a payment reminder';
    case 'CONTACT':
      return 'Suggested: get in touch with this customer';
    default:
      return null;
  }
}

/** Greeting for the hour at the facility: morning 5-11, afternoon 12-16, evening 17-20, night 21-4. */
export function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

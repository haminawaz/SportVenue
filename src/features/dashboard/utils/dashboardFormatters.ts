import { addDays, daysBetween, formatCalendarDate, formatMonthDay, startOfWeek, type CalendarDate } from '@/lib/datetime';
import type { BadgeTone } from '@/ui/StatusBadge';

import type { BookingStatus, DateRange, DateRangePreset, RecommendedAction } from '../types/facilityDashboard.types';

/**
 * Range rules for the dashboard filter. Assumed until the backend publishes
 * its own limits: past and present only, at most 31 days.
 */
export const RANGE_RULES = { allowFuture: false, maxRangeDays: 31 } as const;

export function buildPresetRange(preset: Exclude<DateRangePreset, 'custom'>, today: CalendarDate): DateRange {
  switch (preset) {
    case 'today':
      return { preset, startDate: today, endDate: today };
    case 'yesterday': {
      const y = addDays(today, -1);
      return { preset, startDate: y, endDate: y };
    }
    case 'this_week':
      return { preset, startDate: startOfWeek(today), endDate: today };
  }
}

export function buildCustomDayRange(date: CalendarDate): DateRange {
  return { preset: 'custom', startDate: date, endDate: date };
}

export type RangeValidation = { valid: true } | { valid: false; reason: string };

export function validateRange(range: DateRange, today: CalendarDate): RangeValidation {
  if (daysBetween(range.startDate, range.endDate) < 0) return { valid: false, reason: 'Start date must be on or before end date.' };
  if (!RANGE_RULES.allowFuture && daysBetween(today, range.endDate) > 0) return { valid: false, reason: 'Pick today or an earlier date.' };
  if (daysBetween(range.startDate, range.endDate) + 1 > RANGE_RULES.maxRangeDays) {
    return { valid: false, reason: `Pick a range of ${RANGE_RULES.maxRangeDays} days or fewer.` };
  }
  return { valid: true };
}

export function isSameRange(a: DateRange, b: DateRange) {
  return a.startDate === b.startDate && a.endDate === b.endDate;
}

/** Label for the filter chip, for example "Today, Sep 29" or "This week, Sep 28 - Sep 29". */
export function rangeLabel(range: DateRange): { title: string; detail: string } {
  switch (range.preset) {
    case 'today':
      return { title: 'Today', detail: formatMonthDay(range.endDate) };
    case 'yesterday':
      return { title: 'Yesterday', detail: formatMonthDay(range.endDate) };
    case 'this_week':
      return {
        title: 'This week',
        detail: range.startDate === range.endDate ? formatMonthDay(range.endDate) : `${formatMonthDay(range.startDate)} - ${formatMonthDay(range.endDate)}`,
      };
    case 'custom':
      return { title: formatCalendarDate(range.startDate), detail: '' };
  }
}

/** What the backend's "change" figures are compared against. */
export function comparisonLabel(preset: DateRangePreset): string {
  switch (preset) {
    case 'today':
      return 'vs yesterday';
    case 'this_week':
      return 'vs last week';
    default:
      return 'vs day before';
  }
}

/** Revenue label follows the selected period so the card never claims "today" for last week. */
export function revenueLabel(preset: DateRangePreset): string {
  if (preset === 'today') return "Today's revenue";
  if (preset === 'yesterday') return "Yesterday's revenue";
  if (preset === 'this_week') return 'Revenue this week';
  return 'Revenue';
}

export type Trend = { direction: 'up' | 'down' | 'flat'; text: string; a11y: string };

export function percentTrend(change: number | null | undefined, against: string): Trend | null {
  if (change === null || change === undefined) return null;
  // Round the magnitude so -4.25 and +4.25 both read as 4.3.
  const abs = Math.round(Math.abs(change) * 10) / 10;
  if (abs === 0) return { direction: 'flat', text: `No change ${against}`, a11y: `No change ${against}` };
  const direction = change > 0 ? 'up' : 'down';
  return { direction, text: `${change > 0 ? '+' : '-'}${abs}% ${against}`, a11y: `${direction} ${abs} percent ${against}` };
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

export function greetingFor(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

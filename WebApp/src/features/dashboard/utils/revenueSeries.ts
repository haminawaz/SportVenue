import { REGION } from '@/config/region';
import { addDays, daysBetween, formatCalendarDate, formatMonthDay, startOfWeek, type CalendarDate } from '@/lib/datetime';
import { WEEKDAY_SHORT } from '@/lib/format';

export type RevenueBucket = 'day' | 'week' | 'month';

export type RevenuePoint = {
  key: string;
  /** Full label for the bar, read out and shown on hover: "Tue, Sep 29", "Week of Sep 28", "September 2026". */
  label: string;
  /** Short label under the bar: "Tue", "Sep 28", "Sep". */
  axisLabel: string;
  /** Revenue on the bar's days inside the period. */
  amount: number;
  /**
   * Revenue already booked for the bar's days that are still to come (after
   * the period). Absent when the bar has no such days.
   */
  ahead?: number;
};

/**
 * Days after the period that the chart still shows, up to `until` (the end of
 * this week, month or quarter), with the revenue already booked for each.
 * Without `byDay` (a backend that doesn't report it) those days count as zero.
 */
export type RevenueAhead = { until: CalendarDate; byDay?: { date: CalendarDate; amount: number }[] };

const monthLong = new Intl.DateTimeFormat(REGION.locale, { timeZone: 'UTC', month: 'long', year: 'numeric' });
const monthShort = new Intl.DateTimeFormat(REGION.locale, { timeZone: 'UTC', month: 'short' });
const utc = (d: CalendarDate) => new Date(`${d}T00:00:00Z`);

/** Bars stay readable at every period: one per day up to a month, per week up to about four months, then per month. */
export function revenueBucketFor(start: CalendarDate, end: CalendarDate): RevenueBucket {
  const days = daysBetween(start, end) + 1;
  if (days <= 31) return 'day';
  if (days <= 120) return 'week';
  return 'month';
}

/**
 * Groups daily revenue into the bars the chart shows for the period. Days keep
 * their order; groups are summed. Days still to come (see RevenueAhead) follow
 * the period: as their own bars when bars are daily, otherwise added to the
 * week or month they fall in.
 */
export function revenueSeries(
  byDay: { date: CalendarDate; amount: number }[],
  start: CalendarDate,
  end: CalendarDate,
  ahead?: RevenueAhead,
): { bucket: RevenueBucket; points: RevenuePoint[] } {
  const last = ahead && ahead.until > end ? ahead.until : end;
  const bucket = revenueBucketFor(start, last);
  const span = daysBetween(start, last) + 1;

  // Every day the chart covers: the period's own, then the days still to come.
  const booked = new Map((ahead?.byDay ?? []).map((d) => [d.date, d.amount]));
  const days: { date: CalendarDate; amount: number; ahead?: number }[] = [...byDay];
  for (let d = addDays(end, 1); d <= last; d = addDays(d, 1)) days.push({ date: d, amount: 0, ahead: booked.get(d) ?? 0 });

  if (bucket === 'day') {
    return {
      bucket,
      points: days.map((d) => ({
        key: d.date,
        label: formatCalendarDate(d.date),
        axisLabel: span <= 14 ? WEEKDAY_SHORT[utc(d.date).getUTCDay()] : formatMonthDay(d.date),
        amount: d.amount,
        ...(d.ahead !== undefined ? { ahead: d.ahead } : {}),
      })),
    };
  }

  const groups = new Map<string, RevenuePoint>();
  for (const d of days) {
    const key = bucket === 'week' ? startOfWeek(d.date) : d.date.slice(0, 7);
    let group = groups.get(key);
    if (!group) {
      group =
        bucket === 'week'
          ? { key, label: `Week of ${formatMonthDay(key)}`, axisLabel: formatMonthDay(key), amount: 0 }
          : { key, label: monthLong.format(utc(`${key}-01`)), axisLabel: monthShort.format(utc(`${key}-01`)), amount: 0 };
      groups.set(key, group);
    }
    group.amount += d.amount;
    if (d.ahead !== undefined) group.ahead = (group.ahead ?? 0) + d.ahead;
  }
  return { bucket, points: [...groups.values()] };
}

import { daysBetween, formatCalendarDate, formatMonthDay, startOfWeek, type CalendarDate } from '@/lib/datetime';
import { WEEKDAY_SHORT } from '@/lib/format';

export type RevenueBucket = 'day' | 'week' | 'month';

export type RevenuePoint = {
  key: string;
  /** Full label for the bar, read out and shown on hover: "Tue, Sep 29", "Week of Sep 28", "September 2026". */
  label: string;
  /** Short label under the bar: "Tue", "Sep 28", "Sep". */
  axisLabel: string;
  amount: number;
};

const monthLong = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' });
const monthShort = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' });
const utc = (d: CalendarDate) => new Date(`${d}T00:00:00Z`);

/** Bars stay readable at every period: one per day up to a month, per week up to about four months, then per month. */
export function revenueBucketFor(start: CalendarDate, end: CalendarDate): RevenueBucket {
  const days = daysBetween(start, end) + 1;
  if (days <= 31) return 'day';
  if (days <= 120) return 'week';
  return 'month';
}

/** Groups daily revenue into the bars the chart shows for the period. Days keep their order; groups are summed. */
export function revenueSeries(byDay: { date: CalendarDate; amount: number }[], start: CalendarDate, end: CalendarDate): { bucket: RevenueBucket; points: RevenuePoint[] } {
  const bucket = revenueBucketFor(start, end);
  const span = daysBetween(start, end) + 1;

  if (bucket === 'day') {
    return {
      bucket,
      points: byDay.map((d) => ({
        key: d.date,
        label: formatCalendarDate(d.date),
        axisLabel: span <= 14 ? WEEKDAY_SHORT[utc(d.date).getUTCDay()] : formatMonthDay(d.date),
        amount: d.amount,
      })),
    };
  }

  const groups = new Map<string, RevenuePoint>();
  for (const d of byDay) {
    const key = bucket === 'week' ? startOfWeek(d.date) : d.date.slice(0, 7);
    const existing = groups.get(key);
    if (existing) {
      existing.amount += d.amount;
      continue;
    }
    groups.set(
      key,
      bucket === 'week'
        ? { key, label: `Week of ${formatMonthDay(key)}`, axisLabel: formatMonthDay(key), amount: d.amount }
        : { key, label: monthLong.format(utc(`${key}-01`)), axisLabel: monthShort.format(utc(`${key}-01`)), amount: d.amount },
    );
  }
  return { bucket, points: [...groups.values()] };
}

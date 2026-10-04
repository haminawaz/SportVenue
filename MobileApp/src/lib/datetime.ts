/**
 * Facility-timezone date helpers.
 *
 * The dashboard shows the facility's day, not the phone's. A calendar date is
 * a "YYYY-MM-DD" string in the facility's zone. Arithmetic on calendar dates
 * runs in UTC so that DST on the phone can never shift a day.
 */

export type CalendarDate = string;

type WallClock = { date: CalendarDate; hour: number; minute: number };

const OFFSET_PATTERN = /([zZ]|[+-]\d{2}:?\d{2})$/;
const NAIVE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

const partsCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string) {
  let f = partsCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    partsCache.set(timeZone, f);
  }
  return f;
}

function wallClockOf(instant: Date, timeZone: string): WallClock {
  const parts = Object.fromEntries(partsFormatter(timeZone).formatToParts(instant).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

/** Current calendar date at the facility. */
export function todayIn(timeZone: string, now: Date = new Date()): CalendarDate {
  return wallClockOf(now, timeZone).date;
}

/** Facility-local "YYYY-MM-DDTHH:MM:00" for now, comparable with backend timestamps. */
export function nowLocalIn(timeZone: string, now: Date = new Date()): string {
  const w = wallClockOf(now, timeZone);
  return `${w.date}T${String(w.hour).padStart(2, '0')}:${String(w.minute).padStart(2, '0')}:00`;
}

/** Current hour (0-23) at the facility. */
export function hourIn(timeZone: string, now: Date = new Date()): number {
  return wallClockOf(now, timeZone).hour;
}

function toUtc(date: CalendarDate) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(date: Date): CalendarDate {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: CalendarDate): CalendarDate {
  const weekday = toUtc(date).getUTCDay(); // 0 = Sunday
  return addDays(date, -((weekday + 6) % 7));
}

export function daysBetween(start: CalendarDate, end: CalendarDate): number {
  return Math.round((toUtc(end).getTime() - toUtc(start).getTime()) / 86_400_000);
}

/** "YYYY-MM-DD" from the Y/M/D the user picked in a native date picker. */
export function calendarDateFromPicker(value: Date): CalendarDate {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** A local Date with the same Y/M/D, for handing to a native date picker. */
export function pickerValueFromCalendarDate(date: CalendarDate): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const shortDate = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
const monthDay = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });

/** "Tue, Sep 29" */
export function formatCalendarDate(date: CalendarDate): string {
  return shortDate.format(toUtc(date));
}

/** "Sep 29" */
export function formatMonthDay(date: CalendarDate): string {
  return monthDay.format(toUtc(date));
}

/** "Today", "Yesterday", "Tomorrow" or "Tue, Sep 29", relative to the facility's today. */
export function relativeDayLabel(date: CalendarDate, today: CalendarDate): string {
  const diff = daysBetween(today, date);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return formatCalendarDate(date);
}

/**
 * Wall-clock reading of a backend timestamp at the facility.
 * - With an offset or Z: converted into the facility zone.
 * - Without an offset ("2026-09-29T20:00:00"): already facility-local, read as-is.
 */
export function facilityWallClock(iso: string, timeZone: string): WallClock {
  if (!OFFSET_PATTERN.test(iso)) {
    const match = NAIVE_PATTERN.exec(iso);
    if (match) {
      const [, y, mo, d, h, mi] = match;
      return { date: `${y}-${mo}-${d}`, hour: Number(h), minute: Number(mi) };
    }
  }
  return wallClockOf(new Date(iso), timeZone);
}

function formatClock({ hour, minute }: { hour: number; minute: number }) {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

/** Adds minutes to a facility-local "YYYY-MM-DDTHH:MM:SS" string without touching time zones. */
export function addMinutesLocal(local: string, minutes: number): string {
  const ms = Date.parse(`${local.slice(0, 19)}Z`) + minutes * 60_000;
  return new Date(ms).toISOString().slice(0, 19);
}

/** Minutes between two facility-local timestamps. */
export function minutesBetweenLocal(start: string, end: string): number {
  return Math.round((Date.parse(`${end.slice(0, 19)}Z`) - Date.parse(`${start.slice(0, 19)}Z`)) / 60_000);
}

/** "8:00 PM" */
export function formatTime(iso: string, timeZone: string): string {
  return formatClock(facilityWallClock(iso, timeZone));
}

/** "8:00 PM - 9:00 PM" */
export function formatTimeRange(startIso: string, endIso: string, timeZone: string): string {
  return `${formatTime(startIso, timeZone)} - ${formatTime(endIso, timeZone)}`;
}

/** "Today, 8:00 PM" or "Tue, Sep 29, 8:00 PM" */
export function formatDayAndTime(iso: string, timeZone: string, today: CalendarDate): string {
  const clock = facilityWallClock(iso, timeZone);
  return `${relativeDayLabel(clock.date, today)}, ${formatClock(clock)}`;
}

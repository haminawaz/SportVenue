import { useCallback, useMemo } from 'react';

import { useAuth } from '@/session/SessionProvider';

import { facilityWallClock, formatCalendarDate, relativeDayLabel, todayIn, type CalendarDate } from './datetime';
import { formatMoney, formatMoneyForA11y, moneySymbol } from './money';

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
/** Display order starting Monday. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

/** "20:00" -> "8:00 PM" */
export function formatClock(clock: string): string {
  const [h, m] = clock.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Half-hour (or custom step) clock options between two times, inclusive. */
export function clockOptions(from = '05:00', to = '23:30', step = 30): string[] {
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  const out: string[] = [];
  for (let m = fh * 60 + fm; m <= th * 60 + tm; m += step) out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  return out;
}

/** "Mon, Tue, Wed" or "Weekdays" / "Every day" / "Weekends". */
export function formatWeekdays(days: readonly number[]): string {
  const set = new Set(days);
  if (set.size === 7) return 'Every day';
  if (set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d))) return 'Weekdays';
  if (set.size === 2 && set.has(0) && set.has(6)) return 'Weekends';
  return WEEK_ORDER.filter((d) => set.has(d)).map((d) => WEEKDAY_SHORT[d]).join(', ');
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

const COMPACT_STEPS: [number, string][] = [
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
];

/**
 * "Rs 1.2M" style for chart labels and tight spaces. Built by hand rather
 * than with Intl's compact notation, which Hermes on Android ignores (it
 * printed "PKR 4,445,750.0").
 */
export function formatCompactMoney(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  const step = COMPACT_STEPS.find(([size]) => abs >= size);
  if (!step) return formatMoney(amount, currency);
  const [size, suffix] = step;
  const scaled = Math.round((abs / size) * 10) / 10;
  const symbol = moneySymbol(currency);
  return `${amount < 0 ? '-' : ''}${symbol}${symbol.length > 1 ? ' ' : ''}${String(scaled)}${suffix}`;
}

export function formatNumber(n: number, maxFractionDigits = 1): string {
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: maxFractionDigits }).format(n);
  } catch {
    return String(Math.round(n * 10) / 10);
  }
}

/**
 * Facility-aware formatters. Currency and timezone come from the session,
 * so a change in facility settings re-renders every amount and time.
 */
export function useFormat() {
  const { session } = useAuth();
  const currency = session?.facility.currency ?? 'USD';
  const timeZone = session?.facility.timezone ?? 'UTC';

  const money = useCallback((n: number, c = currency) => formatMoney(n, c), [currency]);
  const moneyA11y = useCallback((n: number, c = currency) => formatMoneyForA11y(n, c), [currency]);
  const compactMoney = useCallback((n: number) => formatCompactMoney(n, currency), [currency]);
  /** For narrow tiles: exact below a million, compact above ("Rs 4.6M"). Pair with moneyA11y. */
  const tileMoney = useCallback((n: number) => (Math.abs(n) >= 1_000_000 ? formatCompactMoney(n, currency) : formatMoney(n, currency)), [currency]);
  const today = useCallback(() => todayIn(timeZone), [timeZone]);
  const day = useCallback((iso: string) => relativeDayLabel(facilityWallClock(iso, timeZone).date, todayIn(timeZone)), [timeZone]);
  const date = useCallback((d: CalendarDate) => formatCalendarDate(d), []);

  return useMemo(
    () => ({ currency, timeZone, money, moneyA11y, compactMoney, tileMoney, today, day, date }),
    [currency, timeZone, money, moneyA11y, compactMoney, tileMoney, today, day, date],
  );
}

/** "Today, 8:00 PM" / "Tue, Sep 29, 8:00 PM" for a facility-local timestamp. */
export function formatDateTimeLocal(local: string, today: CalendarDate): string {
  const clock = local.slice(11, 16);
  return `${relativeDayLabel(local.slice(0, 10), today)}, ${formatClock(clock)}`;
}

/** "5 min ago", "3 h ago", "Yesterday", "Tue, Sep 29" for facility-local timestamps. */
export function formatRelative(iso: string, nowIso: string): string {
  const toMs = (s: string) => Date.parse(`${s.slice(0, 19)}${/[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? '' : 'Z'}`);
  const diff = Math.max(0, (toMs(nowIso) - toMs(iso)) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${Math.floor(diff)} min ago`;
  if (diff < 60 * 24) return `${Math.floor(diff / 60)} h ago`;
  if (diff < 60 * 48) return 'Yesterday';
  return formatCalendarDate(iso.slice(0, 10));
}

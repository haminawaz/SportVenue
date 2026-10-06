import { addDays, facilityWallClock, formatDayAndTime, formatTimeRange, startOfWeek, todayIn } from '@/lib/datetime';
import { formatMoney, formatMoneyForA11y } from '@/lib/money';

import {
  bookingStatusMeta,
  buildCustomRange,
  buildPresetRange,
  countTrend,
  greetingFor,
  percentTrend,
  rangeLabel,
  recommendationText,
  validateRange,
} from '../utils/dashboardFormatters';

const nbsp = (s: string) => s.replace(/ /g, ' ');

describe('money', () => {
  test.each([
    ['PKR', /^Rs ?24,500$/],
    ['INR', /^₹ ?24,500$/],
    ['EUR', /^€ ?24,500$/],
    ['GBP', /^£ ?24,500$/],
    ['AED', /^AED ?24,500$/],
  ])('formats %s using the facility currency, not a hard-coded symbol', (currency, expected) => {
    expect(nbsp(formatMoney(24500, currency, 'en-US'))).toMatch(expected);
  });

  test('speaks currency names for screen readers', () => {
    expect(formatMoneyForA11y(2500, 'PKR', 'en-US')).toBe('2,500 Pakistani rupees');
  });

  test('falls back safely for an unknown currency code', () => {
    expect(formatMoney(1234.5, 'NOT_A_CODE')).toBe('NOT_A_CODE 1,234.50');
  });
});

describe('facility dates', () => {
  test('today is taken in the facility zone, not the device zone', () => {
    // 2026-09-29 21:30 UTC is already Sep 30 in Karachi (UTC+5) but still Sep 29 in Los Angeles.
    const instant = new Date('2026-09-29T21:30:00Z');
    expect(todayIn('Asia/Karachi', instant)).toBe('2026-09-30');
    expect(todayIn('America/Los_Angeles', instant)).toBe('2026-09-29');
  });

  test('offset-less timestamps are read as facility wall time', () => {
    expect(facilityWallClock('2026-09-29T20:00:00', 'Asia/Karachi')).toEqual({ date: '2026-09-29', hour: 20, minute: 0 });
  });

  test('UTC timestamps are converted into the facility zone', () => {
    expect(facilityWallClock('2026-09-29T15:00:00Z', 'Asia/Karachi')).toEqual({ date: '2026-09-29', hour: 20, minute: 0 });
  });

  test('formats times without en or em dashes', () => {
    const text = formatTimeRange('2026-09-29T20:00:00', '2026-09-29T21:00:00', 'Asia/Karachi');
    expect(text).toBe('8:00 PM - 9:00 PM');
    expect(text).not.toMatch(/[–—]/);
  });

  test('labels today and yesterday relative to the facility', () => {
    expect(formatDayAndTime('2026-09-29T20:00:00', 'Asia/Karachi', '2026-09-29')).toBe('Today, 8:00 PM');
    expect(formatDayAndTime('2026-09-28T09:05:00', 'Asia/Karachi', '2026-09-29')).toBe('Yesterday, 9:05 AM');
  });

  test('weeks start on Monday', () => {
    expect(startOfWeek('2026-09-29')).toBe('2026-09-28'); // Tuesday -> Monday
    expect(startOfWeek('2026-10-04')).toBe('2026-09-28'); // Sunday -> Monday
  });
});

describe('date range filter', () => {
  const today = '2026-09-29';

  test('builds presets from the start of each period up to today', () => {
    expect(buildPresetRange('today', today)).toEqual({ preset: 'today', startDate: today, endDate: today });
    expect(buildPresetRange('this_week', today)).toEqual({ preset: 'this_week', startDate: '2026-09-28', endDate: today });
    expect(buildPresetRange('this_month', today)).toEqual({ preset: 'this_month', startDate: '2026-09-01', endDate: today });
    expect(buildPresetRange('this_quarter', today)).toEqual({ preset: 'this_quarter', startDate: '2026-07-01', endDate: today });
    expect(buildPresetRange('this_year', today)).toEqual({ preset: 'this_year', startDate: '2026-01-01', endDate: today });
  });

  test.each([
    ['2026-01-15', '2026-01-01'],
    ['2026-03-31', '2026-01-01'],
    ['2026-04-01', '2026-04-01'],
    ['2026-12-31', '2026-10-01'],
  ])('the quarter containing %s starts on %s', (day, start) => {
    expect(buildPresetRange('this_quarter', day).startDate).toBe(start);
  });

  test('rejects future dates, reversed ranges and ranges over one year', () => {
    expect(validateRange(buildCustomRange(today, addDays(today, 1)), today).valid).toBe(false);
    expect(validateRange(buildCustomRange(today, addDays(today, -1)), today).valid).toBe(false);
    expect(validateRange(buildCustomRange(addDays(today, -366), today), today).valid).toBe(false);
    expect(validateRange(buildCustomRange(addDays(today, -365), today), today).valid).toBe(true);
    expect(validateRange(buildPresetRange('this_year', today), today).valid).toBe(true);
  });

  test('labels presets and custom ranges', () => {
    expect(rangeLabel(buildPresetRange('this_month', today))).toEqual({ title: 'This month', detail: 'Sep 1 - Sep 29' });
    expect(rangeLabel(buildPresetRange('today', today))).toEqual({ title: 'Today', detail: 'Sep 29' });
    expect(rangeLabel(buildCustomRange('2026-08-03', today)).title).toMatch(/Aug 3.* - .*Sep 29/);
  });
});

describe('display helpers', () => {
  test('trends read as text, not only colour', () => {
    expect(percentTrend(12, 'vs yesterday')).toMatchObject({ direction: 'up', text: '+12% vs yesterday' });
    expect(percentTrend(-4.25, 'vs yesterday')).toMatchObject({ direction: 'down', text: '-4.3% vs yesterday' });
    expect(countTrend(0, 'vs last week')).toMatchObject({ direction: 'flat', text: 'No change vs last week' });
    expect(percentTrend(null, 'vs yesterday')).toBeNull();
  });

  test('only phrases recommendations the backend sent', () => {
    const fmt = (n: number) => `Rs ${n}`;
    expect(recommendationText({ type: 'DISCOUNT', value: 15, unit: 'PERCENT' }, fmt)).toBe('Suggested: offer a 15% discount');
    expect(recommendationText(undefined, fmt)).toBeNull();
    expect(recommendationText({ type: 'SOMETHING_NEW' }, fmt)).toBeNull();
  });

  test('every booking status has a text label', () => {
    for (const s of ['PAID', 'PARTIALLY_PAID', 'UNPAID', 'CANCELLED', 'PENDING'] as const) {
      expect(bookingStatusMeta(s).label.length).toBeGreaterThan(0);
    }
    expect(bookingStatusMeta('ON_HOLD').label).toBe('on hold');
  });
});

describe('greeting', () => {
  test.each([
    [5, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [16, 'Good afternoon'],
    [17, 'Good evening'],
    [20, 'Good evening'],
    [21, 'Good night'],
    [0, 'Good night'],
    [4, 'Good night'],
  ])('at %i:00 says %s', (hour, greeting) => {
    expect(greetingFor(hour)).toBe(greeting);
  });
});

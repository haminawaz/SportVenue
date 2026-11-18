import type { Analytics } from '@/domain/types';

/**
 * The landing pages show the sample club's real dashboard over the eight full
 * weeks (Monday to Sunday) before the capture week, so its numbers must read as
 * a growing business whichever day the screenshots are taken.
 */
function lastEightWeeksAsOf(now: Date): Analytics {
  jest.useFakeTimers({ now });
  jest.resetModules();
  const { addDays, startOfWeek, todayIn } = jest.requireActual<typeof import('@/lib/datetime')>('@/lib/datetime');
  const { analyticsView } = jest.requireActual<typeof import('../views')>('../views');
  const endDate = addDays(startOfWeek(todayIn('America/Chicago')), -1);
  return analyticsView(addDays(endDate, -55), endDate);
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

afterEach(() => jest.useRealTimers());

// Monday 9 November 2026 to Sunday the 15th, at noon in Austin (6 PM UTC).
test.each([0, 1, 2, 3, 4, 5, 6])('the sample club is growing (captured on day %i of the week)', (day) => {
  const a = lastEightWeeksAsOf(new Date(Date.UTC(2026, 10, 9 + day, 18)));
  const weeks = Array.from({ length: 8 }, (_, i) => sum(a.revenue.byDay.slice(i * 7, i * 7 + 7).map((d) => d.amount)));

  expect(a.revenue.changePercent).toBeGreaterThan(15);
  expect(a.bookings.changePercent).toBeGreaterThan(15);
  expect(sum(weeks.slice(4))).toBeGreaterThan(sum(weeks.slice(0, 4)));
  expect(weeks[7]).toBeGreaterThan(weeks[0] * 1.1);
  // The chart ends on (or within a whisker of) its best week, never on a slide.
  expect(weeks[7]).toBeGreaterThanOrEqual(Math.max(...weeks) * 0.97);
});

/** The dashboard's view of each preset as of `now`, compared like for like (as the app asks for it). */
function presetsAsOf(now: Date) {
  jest.useFakeTimers({ now });
  jest.resetModules();
  const { todayIn } = jest.requireActual<typeof import('@/lib/datetime')>('@/lib/datetime');
  const { buildPresetRange, comparisonFor } = jest.requireActual<typeof import('@/features/dashboard/utils/dashboardFormatters')>('@/features/dashboard/utils/dashboardFormatters');
  const { analyticsView } = jest.requireActual<typeof import('../views')>('../views');
  const today = todayIn('America/Chicago');
  return (['today', 'this_week', 'this_month', 'this_quarter'] as const).map((preset) => {
    const range = buildPresetRange(preset, today);
    return { preset, a: analyticsView(range.startDate, range.endDate, undefined, comparisonFor(range)) };
  });
}

// Opening the dashboard in a demo on any day: two full weeks, and the turn of a month.
const DEMO_DAYS = [...Array.from({ length: 14 }, (_, i) => `2026-11-${String(2 + i).padStart(2, '0')}`), '2026-11-30', '2026-12-01', '2026-12-02'];
test.each(DEMO_DAYS)('the dashboard opens on growth for every period (%s)', (day) => {
  for (const { a } of presetsAsOf(new Date(`${day}T18:00:00Z`))) {
    expect(a.revenue.changePercent).toBeGreaterThan(0);
    expect(a.bookings.changePercent).toBeGreaterThan(0);
  }
});

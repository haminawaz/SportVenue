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
  const endDate = addDays(startOfWeek(todayIn('Asia/Karachi')), -1);
  return analyticsView(addDays(endDate, -55), endDate);
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

afterEach(() => jest.useRealTimers());

// Monday 9 November 2026 to Sunday the 15th, at noon in Lahore.
test.each([0, 1, 2, 3, 4, 5, 6])('the sample club is growing (captured on day %i of the week)', (day) => {
  const a = lastEightWeeksAsOf(new Date(Date.UTC(2026, 10, 9 + day, 7)));
  const weeks = Array.from({ length: 8 }, (_, i) => sum(a.revenue.byDay.slice(i * 7, i * 7 + 7).map((d) => d.amount)));

  expect(a.revenue.changePercent).toBeGreaterThan(15);
  expect(a.bookings.changePercent).toBeGreaterThan(15);
  expect(sum(weeks.slice(4))).toBeGreaterThan(sum(weeks.slice(0, 4)));
  expect(weeks[7]).toBeGreaterThan(weeks[0] * 1.1);
  // The chart ends on (or within a whisker of) its best week, never on a slide.
  expect(weeks[7]).toBeGreaterThanOrEqual(Math.max(...weeks) * 0.97);
});

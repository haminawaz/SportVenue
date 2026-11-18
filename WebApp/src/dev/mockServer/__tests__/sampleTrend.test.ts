import { vi } from 'vitest';

import type { Analytics } from '@/domain/types';

/**
 * The landing pages show the sample club's real dashboard over the eight full
 * weeks (Monday to Sunday) before the capture week, so its numbers must read as
 * a growing business whichever day the screenshots are taken.
 */
async function lastEightWeeksAsOf(now: Date): Promise<Analytics> {
  vi.useFakeTimers({ now, toFake: ['Date'] });
  vi.resetModules();
  const { addDays, startOfWeek, todayIn } = await import('@/lib/datetime');
  const { analyticsView } = await import('../views');
  const endDate = addDays(startOfWeek(todayIn('America/Chicago')), -1);
  return analyticsView(addDays(endDate, -55), endDate);
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

afterEach(() => vi.useRealTimers());

// Monday 9 November 2026 to Sunday the 15th, at noon in Austin (6 PM UTC).
test.each([0, 1, 2, 3, 4, 5, 6])('the sample club is growing (captured on day %i of the week)', async (day) => {
  const a = await lastEightWeeksAsOf(new Date(Date.UTC(2026, 10, 9 + day, 18)));
  const weeks = Array.from({ length: 8 }, (_, i) => sum(a.revenue.byDay.slice(i * 7, i * 7 + 7).map((d) => d.amount)));

  expect(a.revenue.changePercent).toBeGreaterThan(15);
  expect(a.bookings.changePercent).toBeGreaterThan(15);
  expect(sum(weeks.slice(4))).toBeGreaterThan(sum(weeks.slice(0, 4)));
  expect(weeks[7]).toBeGreaterThan(weeks[0] * 1.1);
  // The chart ends on (or within a whisker of) its best week, never on a slide.
  expect(weeks[7]).toBeGreaterThanOrEqual(Math.max(...weeks) * 0.97);
});

import { addDays } from '@/lib/datetime';

import { revenueBucketFor, revenueSeries } from '../utils/revenueSeries';

const days = (start: string, end: string, amount = 100) => {
  const out: { date: string; amount: number }[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push({ date: d, amount });
  return out;
};

test('one bar per day up to a month, per week up to four months, then per month', () => {
  expect(revenueBucketFor('2026-09-29', '2026-09-29')).toBe('day');
  expect(revenueBucketFor('2026-09-01', '2026-10-01')).toBe('day');
  expect(revenueBucketFor('2026-07-01', '2026-09-29')).toBe('week');
  expect(revenueBucketFor('2026-01-01', '2026-09-29')).toBe('month');
});

test('a week is labelled by weekday', () => {
  const { points } = revenueSeries(days('2026-09-28', '2026-10-04'), '2026-09-28', '2026-10-04');
  expect(points.map((p) => p.axisLabel)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
});

test('a quarter is summed by week, weeks starting on Monday', () => {
  const { bucket, points } = revenueSeries(days('2026-07-01', '2026-09-29'), '2026-07-01', '2026-09-29');
  expect(bucket).toBe('week');
  expect(points[0]).toMatchObject({ key: '2026-06-29', label: 'Week of Jun 29', amount: 500 }); // Wed Jul 1 - Sun Jul 5
  expect(points[1]).toMatchObject({ key: '2026-07-06', amount: 700 });
  expect(points.reduce((s, p) => s + p.amount, 0)).toBe(91 * 100);
});

test('a year is summed by month', () => {
  const { bucket, points } = revenueSeries(days('2026-01-01', '2026-09-29'), '2026-01-01', '2026-09-29');
  expect(bucket).toBe('month');
  expect(points).toHaveLength(9);
  expect(points[0]).toMatchObject({ key: '2026-01', label: 'January 2026', axisLabel: 'Jan', amount: 3100 });
  expect(points[1].amount).toBe(2800);
});

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

test('this week runs Monday to Sunday: days still to come carry what is already booked', () => {
  // Monday to Thursday so far; Friday has bookings, the weekend none yet.
  const { bucket, points } = revenueSeries(days('2026-11-09', '2026-11-12'), '2026-11-09', '2026-11-12', {
    until: '2026-11-15',
    byDay: [
      { date: '2026-11-13', amount: 45000 },
      { date: '2026-11-14', amount: 0 },
      { date: '2026-11-15', amount: 0 },
    ],
  });
  expect(bucket).toBe('day');
  expect(points.map((p) => p.axisLabel)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  expect(points.map((p) => p.ahead)).toEqual([undefined, undefined, undefined, undefined, 45000, 0, 0]);
  expect(points[3]).toEqual({ key: '2026-11-12', label: 'Thu, Nov 12', axisLabel: 'Thu', amount: 100 });
  expect(points[4]).toMatchObject({ key: '2026-11-13', label: 'Fri, Nov 13', amount: 0, ahead: 45000 });
});

test('this month runs to its last day', () => {
  const { bucket, points } = revenueSeries(days('2026-11-01', '2026-11-12'), '2026-11-01', '2026-11-12', { until: '2026-11-30' });
  expect(bucket).toBe('day');
  expect(points).toHaveLength(30);
  expect(points.filter((p) => p.ahead !== undefined)).toHaveLength(18);
});

test('this quarter runs to its end by week: the current week stacks what is played on what is booked', () => {
  // Thu Oct 1 to Thu Nov 12 so far, with 50 booked on each day still to come.
  const ahead = days('2026-11-13', '2026-12-31', 50);
  const { bucket, points } = revenueSeries(days('2026-10-01', '2026-11-12'), '2026-10-01', '2026-11-12', { until: '2026-12-31', byDay: ahead });
  expect(bucket).toBe('week');
  expect(points.at(-1)?.key).toBe('2026-12-28');
  const current = points.find((p) => p.key === '2026-11-09');
  expect(current).toMatchObject({ amount: 400, ahead: 150 }); // Mon to Thu played, Fri to Sun booked
  expect(points.find((p) => p.key === '2026-11-02')?.ahead).toBeUndefined();
  expect(points.find((p) => p.key === '2026-11-16')).toMatchObject({ amount: 0, ahead: 350 });
});

test('days still to come count as nothing booked when the backend does not report them', () => {
  const { points } = revenueSeries(days('2026-11-09', '2026-11-12'), '2026-11-09', '2026-11-12', { until: '2026-11-15' });
  expect(points).toHaveLength(7);
  expect(points.slice(4).every((p) => p.ahead === 0 && p.amount === 0)).toBe(true);
});

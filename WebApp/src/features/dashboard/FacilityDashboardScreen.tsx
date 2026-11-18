'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { hourIn, todayIn } from '@/lib/datetime';
import { useSession } from '@/session/SessionProvider';
import { Page, PageHeader } from '@/ui/Page';
import { DetailSkeleton, QueryView } from '@/ui/States';

import { AnalyticsReport } from './components/AnalyticsReport';
import { DateRangeSelector } from './components/DateRangeSelector';
import { useAnalytics } from './hooks/useAnalytics';
import type { DateRange } from './types/facilityDashboard.types';
import { buildPresetRange, calendarPeriodEnd, comparisonFor, DEFAULT_PRESET, greetingFor, isSameRange, rangeLabel } from './utils/dashboardFormatters';

/**
 * Home screen: a greeting for the time of day at the facility, the period
 * picker, and the full facility report (revenue, bookings, utilization, peak
 * hours, customers, outstanding payments, cancellations) for that period.
 */
export function FacilityDashboardScreen() {
  const { session } = useSession();
  const { facility, user } = session;
  const tz = facility.timezone;

  const [today, setToday] = useState(() => todayIn(tz));
  const [hour, setHour] = useState(() => hourIn(tz));
  const [range, setRange] = useState<DateRange>(() => buildPresetRange(DEFAULT_PRESET, todayIn(tz)));

  // Keep "Today" and the greeting honest if the tab stays open past midnight (or into the evening) at the facility.
  const syncToday = useCallback(() => {
    const now = todayIn(tz);
    setToday(now);
    setHour(hourIn(tz));
    setRange((current) => {
      if (current.preset === 'custom') return current;
      const next = buildPresetRange(current.preset, now);
      return isSameRange(current, next) ? current : next;
    });
  }, [tz]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncToday();
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(syncToday, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [syncToday]);

  // This week, month and quarter run to their last day on the chart: the days still to come show what is already booked.
  const periodEnd = calendarPeriodEnd(range.preset, today);
  const aheadUntil = periodEnd && periodEnd > range.endDate ? periodEnd : undefined;
  // Like for like: this week so far against the same days last week, and so on.
  const comparison = useMemo(() => comparisonFor(range), [range]);
  const query = useAnalytics(range.startDate, range.endDate, aheadUntil, comparison);

  const onRangeChange = useCallback((next: DateRange) => {
    // Same dates means same data; only the label could differ.
    setRange((current) => (isSameRange(current, next) && current.preset === next.preset ? current : next));
  }, []);

  const { refetch } = query;
  const onRefresh = useCallback(async () => {
    syncToday();
    await refetch();
  }, [refetch, syncToday]);

  const label = rangeLabel(range);

  return (
    <Page onRefresh={onRefresh}>
      <PageHeader
        title={`${greetingFor(hour)}, ${user.firstName}`}
        description={
          <>
            <span>{facility.name}</span> · <span className="text-text">{label.title}</span>
            {label.detail ? `, ${label.detail}` : ''}
          </>
        }
        actions={<DateRangeSelector value={range} today={today} onChange={onRangeChange} />}
      />
      <QueryView query={query} skeleton={<DetailSkeleton />} errorTitle="Couldn't load your dashboard">
        {(a) => <AnalyticsReport a={a} fetching={query.isFetching} aheadUntil={aheadUntil} comparison={comparison} />}
      </QueryView>
    </Page>
  );
}

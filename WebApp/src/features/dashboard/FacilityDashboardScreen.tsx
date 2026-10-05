'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CloudSlash } from '@phosphor-icons/react';

import { toUserFacingError } from '@/api/errors';
import { useUnreadCount } from '@/features/notifications/api';
import { formatTime, hourIn, todayIn } from '@/lib/datetime';
import { useSession } from '@/session/SessionProvider';
import { AppText } from '@/ui/AppText';
import { ErrorState } from '@/ui/ErrorState';
import { Page, PageHeader } from '@/ui/Page';

import { CourtUtilizationSection } from './components/CourtUtilizationSection';
import { DashboardMetricGrid } from './components/DashboardMetricGrid';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { DateRangeSelector } from './components/DateRangeSelector';
import { NeedsAttentionSection } from './components/NeedsAttentionSection';
import { QuickActions } from './components/QuickActions';
import { RecentBookingsSection } from './components/RecentBookingsSection';
import { useDashboardNavigation } from './hooks/useDashboardNavigation';
import { useFacilityDashboard, useSendPaymentReminder } from './hooks/useFacilityDashboard';
import type { DateRange } from './types/facilityDashboard.types';
import { buildPresetRange, greetingFor, isSameRange, rangeLabel } from './utils/dashboardFormatters';

export function FacilityDashboardScreen() {
  const { session } = useSession();
  const nav = useDashboardNavigation();
  const { facility, user } = session;
  const tz = facility.timezone;

  const [today, setToday] = useState(() => todayIn(tz));
  const [range, setRange] = useState<DateRange>(() => buildPresetRange('today', todayIn(tz)));

  // Keep "Today" honest if the tab stays open past midnight at the facility.
  const syncToday = useCallback(() => {
    const now = todayIn(tz);
    setToday(now);
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
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [syncToday]);

  const query = useFacilityDashboard(range);
  const unread = useUnreadCount();
  const reminder = useSendPaymentReminder();
  const data = query.data;

  // Reminders depend on the facility's plan, not on who is signed in.
  const canRemind = data?.capabilities?.paymentReminders === true;
  const remindingBookingId = reminder.isPending ? (reminder.variables ?? null) : null;

  const onRangeChange = useCallback((next: DateRange) => {
    // Same dates means same data; only the label could differ.
    setRange((current) => (isSameRange(current, next) && current.preset === next.preset ? current : next));
  }, []);

  const { refetch: refetchDashboard } = query;
  const { refetch: refetchUnread } = unread;
  const onRefresh = useCallback(async () => {
    syncToday();
    await Promise.all([refetchDashboard(), refetchUnread()]);
  }, [refetchDashboard, refetchUnread, syncToday]);

  const { mutate: remind } = reminder;
  const onRemind = useCallback((bookingId: string) => remind(bookingId), [remind]);

  const opportunityHandlers = useMemo(
    () => ({ onViewSlot: nav.openCourtDay, onViewBooking: nav.openBooking, onViewCustomer: nav.openCustomer, onRemind, onOpen: nav.openOpportunity }),
    [nav, onRemind],
  );

  const onCourtPress = useCallback((courtId: string) => nav.openCourtDay(courtId, range.endDate), [nav, range.endDate]);
  const label = rangeLabel(range);

  let body: ReactNode;
  if (query.isPending) {
    body = <DashboardSkeleton />;
  } else if (query.isError && !data) {
    const err = toUserFacingError(query.error, 'Unable to load dashboard');
    body = (
      <ErrorState
        title={err.title}
        message={err.retryable ? "We couldn't retrieve your facility data. " + err.message : err.message}
        onRetry={err.retryable ? () => void query.refetch() : undefined}
        retrying={query.isFetching}
      />
    );
  } else if (data) {
    body = (
      <>
        {query.isRefetchError && !query.isFetching && (
          <div role="alert" className="flex items-center gap-2 rounded-control border border-border bg-surface-muted px-3 py-2 text-text-muted">
            <CloudSlash size={16} aria-hidden />
            <AppText variant="small" tone="muted">
              {`Couldn't refresh. Showing data from ${formatTime(new Date(query.dataUpdatedAt).toISOString(), tz)}.`}
            </AppText>
          </div>
        )}

        <DashboardMetricGrid summary={data.summary} currency={data.currency} preset={range.preset} onOutstanding={nav.openOutstanding} />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-6">
            <RecentBookingsSection bookings={data.recentBookings} currency={data.currency} timeZone={tz} onBookingPress={nav.openBooking} onNewBooking={nav.openNewBooking} onSeeAll={nav.openBookings} />
            <CourtUtilizationSection title={range.preset === 'today' ? 'Courts today' : 'Courts'} courts={data.courts} currency={data.currency} onCourtPress={onCourtPress} onSeeAll={nav.openCourts} />
          </div>
          <div className="flex min-w-0 flex-col gap-6">
            <QuickActions onNewBooking={nav.openNewBooking} onRecordPayment={nav.openOutstanding} onNewCustomer={nav.openNewCustomer} />
            <NeedsAttentionSection
              payments={data.outstandingPayments}
              opportunities={data.opportunities}
              currency={data.currency}
              timeZone={tz}
              today={today}
              fallbackDate={range.endDate}
              canRemind={canRemind}
              remindingBookingId={remindingBookingId}
              handlers={opportunityHandlers}
              onRecord={nav.openRecordPayment}
              onSeeAll={nav.openOpportunities}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <Page onRefresh={onRefresh}>
      <PageHeader
        title={`${greetingFor(hourIn(tz))}, ${user.firstName}`}
        description={
          <>
            <span>{facility.name}</span> · <span className="text-text">{label.title}</span>
            {label.detail ? `, ${label.detail}` : ''}
          </>
        }
        actions={<DateRangeSelector value={range} today={today} onChange={onRangeChange} />}
      />
      {body}
    </Page>
  );
}

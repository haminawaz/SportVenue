import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { CloudSlash, LockKey } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toUserFacingError } from '@/api/errors';
import { useUnreadCount } from '@/features/notifications/api';
import { formatTime, hourIn, todayIn } from '@/lib/datetime';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';

import { CourtUtilizationSection } from './components/CourtUtilizationSection';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardMetricGrid, SCREEN_GUTTER } from './components/DashboardMetricGrid';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { OutstandingPaymentsSection } from './components/OutstandingPaymentsSection';
import { QuickActions } from './components/QuickActions';
import { RecentBookingsSection } from './components/RecentBookingsSection';
import { RevenueOpportunitySection } from './components/RevenueOpportunitySection';
import { useDashboardNavigation } from './hooks/useDashboardNavigation';
import { useFacilityDashboard, useSendPaymentReminder } from './hooks/useFacilityDashboard';
import type { DateRange } from './types/facilityDashboard.types';
import { buildPresetRange, greetingFor, isSameRange } from './utils/dashboardFormatters';

export function FacilityDashboardScreen() {
  const { session, can } = useSession();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useDashboardNavigation();
  const { facility, user } = session;
  const tz = facility.timezone;

  const [today, setToday] = useState(() => todayIn(tz));
  const [range, setRange] = useState<DateRange>(() => buildPresetRange('today', todayIn(tz)));
  const [pullRefreshing, setPullRefreshing] = useState(false);

  // Keep "Today" honest if the app stays open past midnight at the facility.
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
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') syncToday();
    });
    return () => sub.remove();
  }, [syncToday]);

  const canViewDashboard = can('dashboard.view');
  const query = useFacilityDashboard(range, canViewDashboard);
  const unread = useUnreadCount();
  const reminder = useSendPaymentReminder();
  const data = query.data;

  const canCreateBooking = can('booking.create');
  const canViewBooking = can('booking.view');
  const canViewPayments = can('payment.view');
  const canRecord = can('payment.record');
  const canRemind = can('payment.remind') && data?.capabilities?.paymentReminders === true;
  const canViewOpportunities = can('opportunity.view');
  const remindingBookingId = reminder.isPending ? (reminder.variables ?? null) : null;

  const onRangeChange = useCallback((next: DateRange) => {
    // Same dates means same data; only the label could differ.
    setRange((current) => (isSameRange(current, next) && current.preset === next.preset ? current : next));
  }, []);

  const onRefresh = useCallback(async () => {
    setPullRefreshing(true);
    syncToday();
    try {
      await Promise.all([query.refetch(), unread.refetch()]);
    } finally {
      setPullRefreshing(false);
    }
  }, [query, unread, syncToday]);

  const onRemind = useCallback((bookingId: string) => reminder.mutate(bookingId), [reminder]);

  const opportunityHandlers = useMemo(
    () => ({
      onViewSlot: nav.openCourtDay,
      onViewBooking: nav.openBooking,
      onViewCustomer: nav.openCustomer,
      onRemind,
      onOpen: nav.openOpportunity,
    }),
    [nav, onRemind],
  );

  const onCourtPress = useCallback((courtId: string) => nav.openCourtDay(courtId, range.endDate), [nav, range.endDate]);

  let body: ReactNode;
  if (!canViewDashboard) {
    body = <EmptyState icon={LockKey} title="No access" message="You don't have permission to view this dashboard." />;
  } else if (query.isPending) {
    body = <DashboardSkeleton />;
  } else if (query.isError && !data) {
    const err = toUserFacingError(query.error, 'Unable to load dashboard');
    body = (
      <ErrorState
        title={err.title}
        message={err.retryable ? "We couldn't retrieve your facility data. " + err.message : err.title === 'No access' ? "You don't have permission to view this dashboard." : err.message}
        onRetry={err.retryable ? () => query.refetch() : undefined}
        retrying={query.isFetching}
      />
    );
  } else if (data) {
    body = (
      <View style={styles.sections}>
        {query.isRefetchError && !pullRefreshing && (
          <View role="alert" style={[styles.stale, { backgroundColor: colors.surfaceMuted }]}>
            <CloudSlash size={16} color={colors.textMuted} />
            <AppText variant="caption" tone="muted" style={styles.flex}>
              {`Couldn't refresh. Showing data from ${formatTime(new Date(query.dataUpdatedAt).toISOString(), tz)}.`}
            </AppText>
          </View>
        )}

        <DashboardMetricGrid summary={data.summary} currency={data.currency} preset={range.preset} onOutstanding={canViewPayments ? nav.openOutstanding : undefined} />

        <QuickActions
          onNewBooking={canCreateBooking ? nav.openNewBooking : undefined}
          onRecordPayment={canRecord ? nav.openOutstanding : undefined}
          onNewCustomer={can('customer.manage') ? nav.openNewCustomer : undefined}
        />

        {canViewOpportunities && (
          <RevenueOpportunitySection
            opportunities={data.opportunities}
            currency={data.currency}
            timeZone={tz}
            today={today}
            fallbackDate={range.endDate}
            canViewBooking={canViewBooking}
            canRemind={canRemind}
            remindingBookingId={remindingBookingId}
            handlers={opportunityHandlers}
            onSeeAll={nav.openOpportunities}
          />
        )}

        <CourtUtilizationSection
          title={range.preset === 'today' ? "Today's courts" : 'Courts'}
          courts={data.courts}
          currency={data.currency}
          onCourtPress={onCourtPress}
          onSeeAll={can('court.view') ? nav.openCourts : undefined}
        />

        {canViewPayments && (
          <OutstandingPaymentsSection
            payments={data.outstandingPayments}
            timeZone={tz}
            today={today}
            canViewBooking={canViewBooking}
            canRecord={canRecord}
            canRemind={canRemind}
            remindingBookingId={remindingBookingId}
            onViewBooking={nav.openBooking}
            onRecord={nav.openRecordPayment}
            onRemind={onRemind}
            onSeeAll={nav.openOutstanding}
          />
        )}

        <RecentBookingsSection
          bookings={data.recentBookings}
          currency={data.currency}
          timeZone={tz}
          onBookingPress={canViewBooking ? nav.openBooking : undefined}
          onNewBooking={canCreateBooking ? nav.openNewBooking : undefined}
          onSeeAll={canViewBooking ? nav.openBookings : undefined}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.huge, paddingLeft: insets.left + SCREEN_GUTTER, paddingRight: insets.right + SCREEN_GUTTER },
      ]}
      refreshControl={
        canViewDashboard ? (
          <RefreshControl refreshing={pullRefreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} progressBackgroundColor={colors.surface} />
        ) : undefined
      }
      aria-label="Facility dashboard"
    >
      <DashboardHeader
        greeting={`${greetingFor(hourIn(tz))}, ${user.firstName}`}
        facilityName={facility.name}
        range={range}
        today={today}
        onRangeChange={onRangeChange}
        unread={unread.data?.count}
        onNotifications={nav.openNotifications}
      />
      <View style={styles.body}>{body}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  body: { marginTop: spacing.xxl },
  sections: { gap: spacing.huge },
  stale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.control,
    marginBottom: -spacing.lg,
  },
  flex: { flex: 1 },
});

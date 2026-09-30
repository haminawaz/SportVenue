import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { CloudSlash } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toUserFacingError } from '@/api/errors';
import { useUnreadCount } from '@/features/notifications/api';
import { formatTime, hourIn, todayIn } from '@/lib/datetime';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { ErrorState } from '@/ui/ErrorState';

import { CourtUtilizationSection } from './components/CourtUtilizationSection';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardMetricGrid, SCREEN_GUTTER } from './components/DashboardMetricGrid';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { NeedsAttentionSection } from './components/NeedsAttentionSection';
import { QuickActions } from './components/QuickActions';
import { RecentBookingsSection } from './components/RecentBookingsSection';
import { useDashboardNavigation } from './hooks/useDashboardNavigation';
import { useFacilityDashboard, useSendPaymentReminder } from './hooks/useFacilityDashboard';
import type { DateRange } from './types/facilityDashboard.types';
import { buildPresetRange, greetingFor, isSameRange } from './utils/dashboardFormatters';

export function FacilityDashboardScreen() {
  const { session } = useSession();
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
  if (query.isPending) {
    body = <DashboardSkeleton />;
  } else if (query.isError && !data) {
    const err = toUserFacingError(query.error, 'Unable to load dashboard');
    body = (
      <ErrorState
        title={err.title}
        message={err.retryable ? "We couldn't retrieve your facility data. " + err.message : err.message}
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
            <AppText variant="body-sm" tone="muted" style={styles.flex}>
              {`Couldn't refresh. Showing data from ${formatTime(new Date(query.dataUpdatedAt).toISOString(), tz)}.`}
            </AppText>
          </View>
        )}

        <DashboardMetricGrid summary={data.summary} currency={data.currency} preset={range.preset} onOutstanding={nav.openOutstanding} />

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

        <CourtUtilizationSection
          title={range.preset === 'today' ? 'Courts today' : 'Courts'}
          courts={data.courts}
          currency={data.currency}
          onCourtPress={onCourtPress}
          onSeeAll={nav.openCourts}
        />

        <RecentBookingsSection
          bookings={data.recentBookings}
          currency={data.currency}
          timeZone={tz}
          onBookingPress={nav.openBooking}
          onNewBooking={nav.openNewBooking}
          onSeeAll={nav.openBookings}
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
        <RefreshControl refreshing={pullRefreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} progressBackgroundColor={colors.surface} />
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
  sections: { gap: spacing.xxxl + spacing.xs },
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

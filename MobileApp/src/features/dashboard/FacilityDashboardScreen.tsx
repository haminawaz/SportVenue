import { useCallback, useEffect, useState } from "react";
import {
  AppState,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUnreadCount } from "@/features/notifications/api";
import { hourIn, todayIn } from "@/lib/datetime";
import { routes } from "@/navigation/routes";
import { useSession } from "@/session/SessionProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import { DetailSkeleton, QueryView } from "@/ui/States";
import { GUTTER } from "@/ui/surface";

import { AnalyticsReport } from "./components/AnalyticsReport";
import { DashboardHeader } from "./components/DashboardHeader";
import { useAnalytics } from "./hooks/useAnalytics";
import type { DateRange } from "./types/facilityDashboard.types";
import {
  buildPresetRange,
  greetingFor,
  isSameRange,
} from "./utils/dashboardFormatters";

/**
 * Home tab: a greeting for the time of day at the facility, the period
 * picker, and the full facility report (revenue, bookings, utilization, peak
 * hours, customers, outstanding payments, cancellations) for that period.
 */
export function FacilityDashboardScreen() {
  const { session } = useSession();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { facility, user } = session;
  const tz = facility.timezone;

  const [today, setToday] = useState(() => todayIn(tz));
  const [hour, setHour] = useState(() => hourIn(tz));
  const [range, setRange] = useState<DateRange>(() =>
    buildPresetRange("today", todayIn(tz)),
  );
  const [pullRefreshing, setPullRefreshing] = useState(false);

  // Keep "Today" and the greeting honest if the app stays open past midnight (or into the evening) at the facility.
  const syncToday = useCallback(() => {
    const now = todayIn(tz);
    setToday(now);
    setHour(hourIn(tz));
    setRange((current) => {
      if (current.preset === "custom") return current;
      const next = buildPresetRange(current.preset, now);
      return isSameRange(current, next) ? current : next;
    });
  }, [tz]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (status) => {
      if (status === "active") syncToday();
    });
    const timer = setInterval(syncToday, 60_000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [syncToday]);

  const query = useAnalytics(range.startDate, range.endDate);
  const unread = useUnreadCount();

  const onRangeChange = useCallback((next: DateRange) => {
    // Same dates means same data; only the label could differ.
    setRange((current) =>
      isSameRange(current, next) && current.preset === next.preset
        ? current
        : next,
    );
  }, []);

  const { refetch } = query;
  const { refetch: refetchUnread } = unread;
  const onRefresh = useCallback(async () => {
    setPullRefreshing(true);
    syncToday();
    try {
      await Promise.all([refetch(), refetchUnread()]);
    } finally {
      setPullRefreshing(false);
    }
  }, [refetch, refetchUnread, syncToday]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: spacing.huge,
            paddingLeft: insets.left + GUTTER,
            paddingRight: insets.right + GUTTER,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.surface}
          />
        }
        aria-label="Facility dashboard"
      >
        <DashboardHeader
          greeting={`${greetingFor(hour)}, ${user.firstName}`}
          facilityName={facility.name}
          range={range}
          today={today}
          onRangeChange={onRangeChange}
          unread={unread.data?.count}
          onNotifications={() => router.push(routes.notifications)}
        />
        <View style={styles.body}>
          <QueryView
            query={query}
            skeleton={<DetailSkeleton />}
            errorTitle="Couldn't load your dashboard"
          >
            {(a) => (
              <AnalyticsReport
                a={a}
                fetching={query.isFetching && !pullRefreshing}
              />
            )}
          </QueryView>
        </View>
      </ScrollView>
      {/* Solid strip under the status bar so scrolled content never runs behind the clock and icons. */}
      <View
        pointerEvents="none"
        style={[
          styles.statusBar,
          { height: insets.top, backgroundColor: colors.background },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  statusBar: { position: "absolute", top: 0, left: 0, right: 0 },
  content: { flexGrow: 1, width: "100%", maxWidth: 760, alignSelf: "center" },
  body: { marginTop: spacing.xxl },
});

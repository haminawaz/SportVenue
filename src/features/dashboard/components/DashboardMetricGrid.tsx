import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowDownRight, ArrowUpRight, CaretRight, Minus } from 'phosphor-react-native';

import { formatCompactMoney } from '@/lib/format';
import { formatMoney, formatMoneyForA11y } from '@/lib/money';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { ProgressBar } from '@/ui/ProgressBar';
import { GUTTER, tileWidth } from '@/ui/surface';

import type { DateRangePreset, FacilityDashboard } from '../types/facilityDashboard.types';
import { comparisonLabel, countTrend, formatPercent, percentTrend, pluralize, revenueLabel, type Trend } from '../utils/dashboardFormatters';

export const SCREEN_GUTTER = GUTTER;

/** Two columns on every phone width; one column when the user runs very large text. */
export function metricColumnWidth(screenWidth: number, fontScale: number) {
  return tileWidth(screenWidth, fontScale);
}

const big = (n: number, c: string) => (Math.abs(n) >= 100_000_000 ? formatCompactMoney(n, c) : formatMoney(n, c));

function TrendPill({ trend }: { trend: Trend }) {
  const { colors } = useTheme();
  const Icon = trend.direction === 'up' ? ArrowUpRight : trend.direction === 'down' ? ArrowDownRight : Minus;
  const fg = trend.direction === 'down' ? colors.onInkMuted : colors.inkAccent;
  return (
    <View style={[styles.pill, { backgroundColor: colors.inkLine }]}>
      <Icon size={16} color={fg} weight="bold" />
      <AppText variant="nav-link" numeric style={{ color: fg }}>
        {trend.text}
      </AppText>
    </View>
  );
}

type DashboardMetricGridProps = {
  summary: FacilityDashboard['summary'];
  currency: string;
  preset: DateRangePreset;
  onOutstanding?: () => void;
};

/**
 * The first thing an owner reads: one ink summary card with the period's
 * revenue, bookings and utilization, closed by what is still owed.
 * Green is used only on the figures that move; everything else is neutral.
 */
export function DashboardMetricGrid({ summary, currency, preset, onOutstanding }: DashboardMetricGridProps) {
  const { colors, scheme } = useTheme();
  const against = comparisonLabel(preset);
  const { revenue, bookings, utilization, outstanding } = summary;
  const revenueTrend = percentTrend(revenue.changePercent, against);
  const bookingTrend = countTrend(bookings.change, against);
  const utilTrend = percentTrend(utilization.changePercent, against);
  const owes = outstanding.amount > 0;

  const heroLabel = [
    revenueLabel(preset),
    formatMoneyForA11y(revenue.amount, currency),
    revenueTrend?.a11y,
    `${bookings.count} bookings`,
    bookingTrend?.a11y,
    `${Math.round(utilization.percentage)} percent utilization, ${utilization.bookedSlots} of ${utilization.totalSlots} slots`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={[styles.card, { backgroundColor: colors.ink, shadowColor: colors.shadow }, scheme === 'dark' && { borderWidth: 1, borderColor: colors.border }]}>
      <View accessible aria-label={heroLabel} style={styles.top}>
        <AppText variant="body-strong" style={{ color: colors.onInkMuted }}>
          {revenueLabel(preset)}
        </AppText>
        <AppText numeric numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={[styles.heroValue, { color: colors.onInk }]}>
          {big(revenue.amount, currency)}
        </AppText>
        {revenueTrend && <TrendPill trend={revenueTrend} />}

        <View style={[styles.split, { borderTopColor: colors.inkLine }]}>
          <View style={styles.half}>
            <AppText variant="body-sm" style={{ color: colors.onInkMuted }}>
              Bookings
            </AppText>
            <AppText variant="display-lg" numeric style={{ color: colors.onInk }}>
              {String(bookings.count)}
            </AppText>
            {bookingTrend && (
              <AppText variant="nav-link" numeric style={{ color: colors.onInkMuted }}>
                {bookingTrend.text}
              </AppText>
            )}
          </View>
          <View style={[styles.divider, { backgroundColor: colors.inkLine }]} />
          <View style={styles.half}>
            <AppText variant="body-sm" style={{ color: colors.onInkMuted }}>
              Utilization
            </AppText>
            <AppText variant="display-lg" numeric style={{ color: colors.onInk }}>
              {formatPercent(utilization.percentage)}
            </AppText>
            <ProgressBar value={utilization.percentage} tone="onInk" />
            <AppText variant="nav-link" numeric style={{ color: colors.onInkMuted }}>
              {`${utilization.bookedSlots} of ${utilization.totalSlots} slots`}
            </AppText>
            {utilTrend && (
              <AppText variant="nav-link" numeric style={{ color: colors.onInkMuted }}>
                {utilTrend.text}
              </AppText>
            )}
          </View>
        </View>
      </View>

      <Pressable
        role={onOutstanding ? 'button' : undefined}
        disabled={!onOutstanding}
        onPress={onOutstanding}
        aria-label={`Outstanding, ${formatMoneyForA11y(outstanding.amount, currency)}, ${outstanding.bookingCount > 0 ? pluralize(outstanding.bookingCount, 'booking') : 'all paid'}`}
        accessibilityHint={onOutstanding ? 'Opens outstanding payments' : undefined}
        style={({ pressed }) => [styles.owed, { backgroundColor: colors.inkLine }, pressed && { opacity: 0.8 }]}
      >
        <View style={styles.flex}>
          <AppText variant="body-sm" style={{ color: colors.onInkMuted }}>
            Outstanding
          </AppText>
          <View style={styles.owedRow}>
            <AppText variant="title-md" numeric numberOfLines={1} style={{ color: owes ? colors.onInk : colors.onInkMuted }}>
              {big(outstanding.amount, currency)}
            </AppText>
            <AppText variant="nav-link" style={{ color: colors.onInkMuted }}>
              {outstanding.bookingCount > 0 ? pluralize(outstanding.bookingCount, 'booking') : 'All paid'}
            </AppText>
          </View>
        </View>
        {onOutstanding && owes && (
          <View style={styles.collect}>
            <AppText variant="body-strong" style={{ color: colors.inkAccent }}>
              Collect
            </AppText>
            <CaretRight size={16} color={colors.inkAccent} weight="bold" />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.hero,
    padding: spacing.xl,
    gap: spacing.xl,
    shadowOpacity: 0.14,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  top: { gap: spacing.sm, paddingHorizontal: spacing.xs, paddingTop: spacing.xs },
  heroValue: typography['display-mega'],
  pill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1 },
  split: { flexDirection: 'row', borderTopWidth: 1, marginTop: spacing.lg, paddingTop: spacing.lg, gap: spacing.lg },
  half: { flex: 1, gap: spacing.xs + 2 },
  divider: { width: 1 },
  owed: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.card, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 68 },
  owedRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap', marginTop: 2 },
  collect: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 44 },
  flex: { flex: 1 },
});

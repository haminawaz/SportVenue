import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowDownRight, ArrowUpRight, CaretRight, Minus, Receipt } from 'phosphor-react-native';

import { formatCompactMoney } from '@/lib/format';
import { formatMoney, formatMoneyForA11y } from '@/lib/money';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { ProgressBar } from '@/ui/ProgressBar';
import { GUTTER, tileWidth, useSurface } from '@/ui/surface';

import type { DateRangePreset, FacilityDashboard } from '../types/facilityDashboard.types';
import { comparisonLabel, countTrend, formatPercent, percentTrend, pluralize, revenueLabel, type Trend } from '../utils/dashboardFormatters';

export const SCREEN_GUTTER = GUTTER;

/** Two columns on every phone width; one column when the user runs very large text. */
export function metricColumnWidth(screenWidth: number, fontScale: number) {
  return tileWidth(screenWidth, fontScale);
}

const big = (n: number, c: string) => (Math.abs(n) >= 100_000_000 ? formatCompactMoney(n, c) : formatMoney(n, c));

function TrendPill({ trend, onHero }: { trend: Trend; onHero?: boolean }) {
  const { colors } = useTheme();
  const Icon = trend.direction === 'up' ? ArrowUpRight : trend.direction === 'down' ? ArrowDownRight : Minus;
  const fg = onHero ? colors.heroText : trend.direction === 'down' ? colors.danger : colors.accent;
  return (
    <View style={[styles.pill, { backgroundColor: onHero ? 'rgba(255,255,255,0.14)' : colors.accentSoft }]}>
      <Icon size={16} color={fg} weight="bold" />
      <AppText variant="label" numeric style={{ color: fg }}>
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
 * The first thing an owner reads: a solid hero with the period's revenue,
 * bookings and utilization, then what is still owed.
 */
export function DashboardMetricGrid({ summary, currency, preset, onOutstanding }: DashboardMetricGridProps) {
  const { colors } = useTheme();
  const warning = useSurface('warning');
  const plain = useSurface();
  const against = comparisonLabel(preset);
  const { revenue, bookings, utilization, outstanding } = summary;
  const revenueTrend = percentTrend(revenue.changePercent, against);
  const bookingTrend = countTrend(bookings.change, against);
  const utilTrend = percentTrend(utilization.changePercent, against);

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
    <View style={styles.stack}>
      <View style={[styles.hero, { backgroundColor: colors.accentStrong }]} accessible aria-label={heroLabel}>
        <AppText variant="bodyStrong" style={{ color: colors.heroMuted }}>
          {revenueLabel(preset)}
        </AppText>
        <AppText numeric numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={[styles.heroValue, { color: colors.heroText }]}>
          {big(revenue.amount, currency)}
        </AppText>
        {revenueTrend && <TrendPill trend={revenueTrend} onHero />}

        <View style={[styles.split, { borderTopColor: 'rgba(255,255,255,0.16)' }]}>
          <View style={styles.half}>
            <AppText variant="label" style={{ color: colors.heroMuted }}>
              Bookings
            </AppText>
            <AppText variant="metric" numeric style={{ color: colors.heroText }}>
              {String(bookings.count)}
            </AppText>
            {bookingTrend && (
              <AppText variant="label" numeric style={{ color: colors.heroMuted }}>
                {bookingTrend.text}
              </AppText>
            )}
          </View>
          <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.16)' }]} />
          <View style={styles.half}>
            <AppText variant="label" style={{ color: colors.heroMuted }}>
              Utilization
            </AppText>
            <AppText variant="metric" numeric style={{ color: colors.heroText }}>
              {formatPercent(utilization.percentage)}
            </AppText>
            <ProgressBar value={utilization.percentage} tone="onHero" />
            <AppText variant="label" numeric style={{ color: colors.heroMuted }}>
              {`${utilization.bookedSlots} of ${utilization.totalSlots} slots`}
            </AppText>
            {utilTrend && (
              <AppText variant="label" numeric style={{ color: colors.heroMuted }}>
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
        style={({ pressed }) => [outstanding.amount > 0 ? warning : plain, styles.owed, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.owedTop}>
          <View style={[styles.owedIcon, { backgroundColor: colors.surface }]}>
            <Receipt size={22} color={outstanding.amount > 0 ? colors.warning : colors.accent} weight="bold" />
          </View>
          <AppText variant="bodyStrong" tone="muted" style={styles.flex}>
            Outstanding
          </AppText>
          {onOutstanding && outstanding.amount > 0 && (
            <View style={[styles.collect, { backgroundColor: colors.surface }]}>
              <AppText variant="label" style={{ color: colors.warning }}>
                Collect
              </AppText>
              <CaretRight size={14} color={colors.warning} weight="bold" />
            </View>
          )}
        </View>
        <AppText variant="metric" numeric numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {big(outstanding.amount, currency)}
        </AppText>
        <AppText variant="caption" tone="muted">
          {outstanding.bookingCount > 0 ? pluralize(outstanding.bookingCount, 'booking') : 'All paid'}
        </AppText>
      </Pressable>
    </View>
  );
}


const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  hero: { borderRadius: radius.card, padding: spacing.xxl, gap: spacing.sm },
  heroValue: { ...typography.display, fontSize: 44, lineHeight: 52, letterSpacing: -1.4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1 },
  split: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.lg, paddingTop: spacing.lg, gap: spacing.lg },
  half: { flex: 1, gap: spacing.xs + 2 },
  divider: { width: StyleSheet.hairlineWidth },
  owed: { padding: spacing.xl, gap: spacing.xs },
  owedTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  owedIcon: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  collect: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radius.full, paddingHorizontal: spacing.md, minHeight: 40 },
  flex: { flex: 1, gap: spacing.xxs },
});

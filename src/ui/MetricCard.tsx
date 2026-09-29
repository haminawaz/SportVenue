import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { ArrowDownRight, ArrowUpRight, Minus, type IconProps } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { Card } from './Card';

export type MetricTrend = { direction: 'up' | 'down' | 'flat'; text: string; a11y: string };

export type MetricCardProps = {
  label: string;
  value: string;
  /** Spoken value when it differs from the visual one (currency names, "percent"). */
  valueA11y?: string;
  trend?: MetricTrend | null;
  /** Whether "up" is good news. False for things like cancellations. */
  upIsGood?: boolean;
  supporting?: string;
  icon?: ComponentType<IconProps>;
  tint?: 'surface' | 'accent' | 'warning';
  width?: number;
};

/** Generic KPI tile. Holds no business logic; callers pass formatted values. */
export function MetricCard({ label, value, valueA11y, trend, upIsGood = true, supporting, icon: Icon, tint = 'surface', width }: MetricCardProps) {
  const { colors } = useTheme();

  const TrendIcon = trend?.direction === 'up' ? ArrowUpRight : trend?.direction === 'down' ? ArrowDownRight : Minus;
  const good = trend && trend.direction !== 'flat' && (trend.direction === 'up') === upIsGood;
  const trendColor = !trend || trend.direction === 'flat' ? colors.textMuted : good ? colors.accent : colors.danger;
  const iconBg = tint === 'surface' ? colors.accentSoft : colors.surface;
  const iconFg = tint === 'warning' ? colors.warning : colors.accent;

  const a11yLabel = [label, valueA11y ?? value, trend?.a11y, supporting].filter(Boolean).join(', ');

  return (
    <Card tint={tint} style={[styles.card, width !== undefined && { width }]}>
      <View accessible aria-label={a11yLabel} style={styles.inner}>
        {Icon && (
          <View style={[styles.icon, { backgroundColor: iconBg }]}>
            <Icon size={20} color={iconFg} weight="bold" />
          </View>
        )}
        <AppText variant="label" tone="muted" numberOfLines={2}>
          {label}
        </AppText>
        <AppText variant="metric" numeric numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={fitValue(value, width)}>
          {value}
        </AppText>
        {trend && (
          <View style={styles.trendRow}>
            <TrendIcon size={16} color={trendColor} weight="bold" />
            <AppText variant="label" numeric style={[styles.trendText, { color: trendColor }]} numberOfLines={2}>
              {trend.text}
            </AppText>
          </View>
        )}
        {supporting && (
          <AppText variant="caption" tone="muted" numeric numberOfLines={2}>
            {supporting}
          </AppText>
        )}
      </View>
    </Card>
  );
}

/**
 * Shrinks long values to fit narrow tiles. Native also auto-fits, but web
 * does not, so size from the text length and the tile's inner width.
 */
function fitValue(value: string, width?: number) {
  if (!width) return undefined;
  const inner = width - (spacing.lg + 2) * 2;
  const size = Math.max(18, Math.min(28, Math.floor(inner / (value.length * 0.62))));
  return size < 28 ? { fontSize: size, lineHeight: Math.round(size * 1.22) } : undefined;
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg + 2 },
  inner: { gap: spacing.xs + 2 },
  icon: { width: 38, height: 38, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  trendRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  trendText: { flexShrink: 1 },
});

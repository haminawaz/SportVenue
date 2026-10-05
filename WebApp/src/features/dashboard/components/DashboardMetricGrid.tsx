import { CalendarCheck, ChartBar, CurrencyCircleDollar, Receipt } from '@phosphor-icons/react';

import { formatCompactMoney } from '@/lib/format';
import { formatMoney, formatMoneyForA11y } from '@/lib/money';
import { Button } from '@/ui/Button';
import { ProgressBar } from '@/ui/ProgressBar';
import { StatCard, StatGrid } from '@/ui/StatCard';
import { GUTTER, tileWidth } from '@/ui/surface';

import type { DateRangePreset, FacilityDashboard } from '../types/facilityDashboard.types';
import { comparisonLabel, countTrend, formatPercent, percentTrend, pluralize, revenueLabel } from '../utils/dashboardFormatters';

export const SCREEN_GUTTER = GUTTER;

/** Narrow-screen tile rule: two columns on every phone width, one for very large text. */
export function metricColumnWidth(screenWidth: number, fontScale: number) {
  return tileWidth(screenWidth, fontScale);
}

const big = (n: number, c: string) => (Math.abs(n) >= 100_000_000 ? formatCompactMoney(n, c) : formatMoney(n, c));

type DashboardMetricGridProps = {
  summary: FacilityDashboard['summary'];
  currency: string;
  preset: DateRangePreset;
  onOutstanding?: () => void;
};

/**
 * The period at a glance: revenue, bookings, utilization and what is still
 * owed, each with its comparison against the previous period.
 */
export function DashboardMetricGrid({ summary, currency, preset, onOutstanding }: DashboardMetricGridProps) {
  const against = comparisonLabel(preset);
  const { revenue, bookings, utilization, outstanding } = summary;
  const owes = outstanding.amount > 0;

  return (
    <StatGrid>
      <StatCard icon={CurrencyCircleDollar} label={revenueLabel(preset)} value={big(revenue.amount, currency)} valueA11y={formatMoneyForA11y(revenue.amount, currency)} trend={percentTrend(revenue.changePercent, against)} />
      <StatCard icon={CalendarCheck} label="Bookings" value={String(bookings.count)} trend={countTrend(bookings.change, against)} />
      <StatCard
        icon={ChartBar}
        label="Utilization"
        value={formatPercent(utilization.percentage)}
        valueA11y={`${Math.round(utilization.percentage)} percent, ${utilization.bookedSlots} of ${utilization.totalSlots} slots`}
        trend={percentTrend(utilization.changePercent, against)}
        supporting={`${utilization.bookedSlots} of ${utilization.totalSlots} slots`}
      >
        <ProgressBar value={utilization.percentage} />
      </StatCard>
      <StatCard
        icon={Receipt}
        tint={owes ? 'warning' : 'surface'}
        label="Outstanding"
        value={big(outstanding.amount, currency)}
        valueA11y={formatMoneyForA11y(outstanding.amount, currency)}
        supporting={outstanding.bookingCount > 0 ? pluralize(outstanding.bookingCount, 'booking') : 'All paid'}
      >
        {onOutstanding && owes && (
          <div className="mt-auto">
            <Button label="Collect payments" variant="tertiary" size="sm" onPress={onOutstanding} />
          </div>
        )}
      </StatCard>
    </StatGrid>
  );
}

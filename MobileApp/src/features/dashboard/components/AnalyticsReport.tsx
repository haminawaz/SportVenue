import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarBlank, CalendarCheck, ChartBar, CurrencyCircleDollar, Receipt, UserPlus, Users, XCircle } from 'phosphor-react-native';

import type { Analytics } from '@/domain/types';
import { daysBetween } from '@/lib/datetime';
import { formatNumber, useFormat, WEEK_ORDER, WEEKDAY_SHORT } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { ListGroup, ListRow } from '@/ui/List';
import { MetricCard } from '@/ui/MetricCard';
import { useTileWidth } from '@/ui/surface';
import { SectionHeader } from '@/ui/SectionHeader';
import { Notice } from '@/ui/States';

import { percentTrend } from '../utils/dashboardFormatters';
import { revenueSeries } from '../utils/revenueSeries';

import { BarList, ColumnChart, Heatmap } from './Charts';

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;
const hourShort = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'a' : 'p'}`;

/**
 * The facility report for the dashboard's selected period: headline numbers
 * against the period before, revenue over time and by court, utilization,
 * peak hours, customers, outstanding payments and cancellations.
 */
export function AnalyticsReport({ a, fetching }: { a: Analytics; fetching: boolean }) {
  const router = useRouter();
  const f = useFormat();
  const { half: tile } = useTileWidth();
  const span = daysBetween(a.period.startDate, a.period.endDate) + 1;
  const against = 'vs previous period';

  // One bar per day up to a month, per week up to about four months, then per month.
  const series = useMemo(() => revenueSeries(a.revenue.byDay, a.period.startDate, a.period.endDate), [a.revenue.byDay, a.period.startDate, a.period.endDate]);
  const byDay = useMemo(
    () => series.points.map((p) => ({ key: p.key, label: p.label, value: p.amount, valueLabel: f.money(p.amount), axisLabel: p.axisLabel })),
    [series, f],
  );

  const peakTop = [...a.peakHours].sort((x, y) => y.utilization - x.utilization)[0];
  const quietest = [...a.peakHours].filter((c) => c.hour >= 9 && c.hour < 21).sort((x, y) => x.utilization - y.utilization)[0];

  return (
    <View style={[styles.report, fetching && { opacity: 0.6 }]}>
      <View style={styles.tiles}>
        <MetricCard width={tile} tint="accent" icon={CurrencyCircleDollar} label="Revenue" value={f.tileMoney(a.revenue.total)} valueA11y={f.moneyA11y(a.revenue.total)} trend={percentTrend(a.revenue.changePercent, against, 'vs prior')} />
        <MetricCard width={tile} icon={CalendarCheck} label="Bookings" value={formatNumber(a.bookings.total, 0)} trend={percentTrend(a.bookings.changePercent, against, 'vs prior')} supporting={`${formatNumber(a.bookings.averagePerDay)} a day`} />
        <MetricCard width={tile} icon={ChartBar} label="Utilization" value={`${Math.round(a.utilization.overall)}%`} valueA11y={`${Math.round(a.utilization.overall)} percent`} supporting="Booked share of open hours" />
        <MetricCard width={tile} icon={Receipt} label="Average booking" value={f.tileMoney(a.bookings.averageValue)} valueA11y={f.moneyA11y(a.bookings.averageValue)} />
      </View>

      <View>
        <SectionHeader title="Revenue over time" />
        <Card>
          <ColumnChart data={byDay} summary={{ label: span === 1 ? 'Total for the day' : `Total for ${span} days · tap a bar for one ${series.bucket}`, value: f.money(a.revenue.total) }} />
        </Card>
      </View>

      <View>
        <SectionHeader title="Revenue by court" />
        <Card>
          {a.revenueByCourt.length === 0 ? (
            <AppText tone="muted">No revenue in this period.</AppText>
          ) : (
            <BarList
              data={a.revenueByCourt.map((c) => ({ key: c.courtId, label: c.courtName, value: c.amount, valueLabel: f.money(c.amount), onPress: () => router.push(routes.court(c.courtId)) }))}
            />
          )}
        </Card>
      </View>

      <View>
        <SectionHeader title="Court utilization" />
        <Card>
          <BarList
            max={100}
            data={[...a.utilization.byCourt].sort((x, y) => y.utilization - x.utilization).map((c) => ({ key: c.courtId, label: c.courtName, value: c.utilization, valueLabel: `${Math.round(c.utilization)}%` }))}
          />
        </Card>
      </View>

      <View>
        <SectionHeader title="Peak and off-peak hours" />
        <Card>
          <Heatmap
            cells={a.peakHours.map((p) => ({ row: p.weekday, col: p.hour, value: p.utilization }))}
            rows={[...WEEK_ORDER]}
            cols={Array.from({ length: 16 }, (_, i) => i + 7)}
            rowLabel={(r) => WEEKDAY_SHORT[r]}
            colLabel={hourLabel}
            colShort={hourShort}
            valueLabel={(v) => `${Math.round(v)}% booked`}
          />
        </Card>
        {peakTop && quietest && (
          <View style={styles.notice}>
            <Notice
              message={`Busiest: ${WEEKDAY_SHORT[peakTop.weekday]} around ${hourLabel(peakTop.hour)} (${Math.round(peakTop.utilization)}% booked). Quietest daytime hour: ${WEEKDAY_SHORT[quietest.weekday]} around ${hourLabel(quietest.hour)} (${Math.round(quietest.utilization)}%).`}
            />
          </View>
        )}
      </View>

      <View>
        <SectionHeader title="Customers" onLink={() => router.push(routes.customers)} />
        <View style={styles.tiles}>
          <MetricCard width={tile} icon={Users} label="Played" value={formatNumber(a.customers.active, 0)} supporting="customers in period" />
          <MetricCard width={tile} icon={UserPlus} label="New" value={formatNumber(a.customers.new, 0)} supporting={`${formatNumber(a.customers.returning, 0)} returning`} />
        </View>
        {a.customers.top.length > 0 && (
          <View style={styles.gapTop}>
            <ListGroup title="Top customers by spend">
              {a.customers.top.map((c, i) => (
                <ListRow key={c.customerId} title={`${i + 1}. ${c.name}`} subtitle={`${c.bookings} bookings`} value={f.money(c.spent)} valueTone="default" onPress={() => router.push(routes.customer(c.customerId))} />
              ))}
            </ListGroup>
          </View>
        )}
      </View>

      <View>
        <SectionHeader title="Outstanding payments" onLink={() => router.push(routes.payments('outstanding'))} />
        <Card tint={a.outstanding.total > 0 ? 'warning' : 'surface'}>
          <AppText variant="display-lg" numeric aria-label={f.moneyA11y(a.outstanding.total)}>
            {f.money(a.outstanding.total)}
          </AppText>
          <AppText variant="body-sm" tone="muted" style={styles.gapBottom}>
            Owed across {a.outstanding.bookingCount} bookings, by how long it has been due
          </AppText>
          <BarList data={a.outstanding.aging.map((b) => ({ key: b.label, label: b.label, value: b.amount, valueLabel: f.money(b.amount) }))} />
        </Card>
      </View>

      <View>
        <SectionHeader title="Cancellations" />
        <View style={styles.tiles}>
          <MetricCard width={tile} icon={XCircle} label="Cancelled" value={formatNumber(a.cancellations.count, 0)} supporting={`${formatNumber(a.cancellations.rate)}% of bookings`} />
          <MetricCard width={tile} icon={CalendarBlank} label="No-shows" value={formatNumber(a.cancellations.noShows, 0)} />
        </View>
        {a.cancellations.reasons.length > 0 && (
          <Card style={styles.gapTop}>
            <AppText variant="nav-link" tone="muted" style={styles.gapBottom}>
              Reasons given
            </AppText>
            <BarList data={a.cancellations.reasons.map((r) => ({ key: r.reason, label: r.reason, value: r.count, valueLabel: String(r.count) }))} />
          </Card>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  report: { gap: spacing.xxxl },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  notice: { marginTop: spacing.md },
  gapTop: { marginTop: spacing.md },
  gapBottom: { marginBottom: spacing.md },
});

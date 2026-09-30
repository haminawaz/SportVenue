import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CalendarBlank, CalendarCheck, ChartBar, CurrencyCircleDollar, Receipt, Table, UserPlus, Users, XCircle } from 'phosphor-react-native';

import type { Analytics } from '@/domain/types';
import { addDays, daysBetween, formatCalendarDate, formatMonthDay, type CalendarDate } from '@/lib/datetime';
import { formatNumber, useFormat, WEEK_ORDER, WEEKDAY_SHORT } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip, ChipRow } from '@/ui/Chips';
import { DatePickerSheet } from '@/ui/DateField';
import { ListGroup, ListRow } from '@/ui/List';
import { MetricCard } from '@/ui/MetricCard';
import { Screen } from '@/ui/Screen';
import { useTileWidth } from '@/ui/surface';
import { SectionHeader } from '@/ui/SectionHeader';
import { DetailSkeleton, Notice, QueryView } from '@/ui/States';

import { percentTrend } from '@/features/dashboard/utils/dashboardFormatters';

import { useAnalytics } from '../api';
import { BarList, ColumnChart, Heatmap } from '../components/Charts';

type Preset = '7d' | '30d' | '90d' | 'month' | 'lastMonth' | 'custom';
const PRESETS: { value: Preset; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'month', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'custom', label: 'Custom' },
];

function presetRange(p: Exclude<Preset, 'custom'>, today: CalendarDate) {
  switch (p) {
    case '7d':
      return { start: addDays(today, -6), end: today };
    case '30d':
      return { start: addDays(today, -29), end: today };
    case '90d':
      return { start: addDays(today, -89), end: today };
    case 'month':
      return { start: `${today.slice(0, 8)}01`, end: today };
    case 'lastMonth': {
      const firstThis = `${today.slice(0, 8)}01`;
      const lastPrev = addDays(firstThis, -1);
      return { start: `${lastPrev.slice(0, 8)}01`, end: lastPrev };
    }
  }
}

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;
const hourShort = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'a' : 'p'}`;

export function AnalyticsScreen() {
  const f = useFormat();
  const today = f.today();
  const [preset, setPreset] = useState<Preset>('30d');
  const [custom, setCustom] = useState({ start: addDays(today, -13), end: today });
  const [picking, setPicking] = useState<'start' | 'end' | null>(null);
  const [rangeError, setRangeError] = useState<string>();
  const range = preset === 'custom' ? custom : presetRange(preset, today);
  const query = useAnalytics(range.start, range.end);
  const [refreshing, setRefreshing] = useState(false);
  const closePicker = () => setPicking(null);

  const pick = (d: CalendarDate) => {
    const next = picking === 'start' ? { ...custom, start: d } : { ...custom, end: d };
    if (next.end < next.start) {
      setRangeError('The end date must be on or after the start date.');
      return;
    }
    if (daysBetween(next.start, next.end) > 365) {
      setRangeError('Choose a period of one year or less.');
      return;
    }
    setRangeError(undefined);
    setCustom(next);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Analytics' }} />
      <Screen
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await query.refetch();
          setRefreshing(false);
        }}
      >
        <View style={styles.filters}>
          <ChipRow>
            {PRESETS.map((p) => (
              <Chip key={p.value} label={p.label} selected={preset === p.value} onPress={() => setPreset(p.value)} />
            ))}
          </ChipRow>
          {preset === 'custom' && (
            <ChipRow bleed={false}>
              <Chip label={`From ${formatMonthDay(custom.start)}`} icon={CalendarBlank} dropdown onPress={() => setPicking('start')} />
              <Chip label={`To ${formatMonthDay(custom.end)}`} icon={CalendarBlank} dropdown onPress={() => setPicking('end')} />
            </ChipRow>
          )}
          {rangeError ? (
            <AppText variant="body-sm" tone="danger" role="alert">
              {rangeError}
            </AppText>
          ) : (
            <AppText variant="body-sm" tone="muted">
              {formatCalendarDate(range.start)} - {formatCalendarDate(range.end)}, compared with the {daysBetween(range.start, range.end) + 1} days before
            </AppText>
          )}
        </View>

        <QueryView query={query} skeleton={<DetailSkeleton />} errorTitle="Couldn't load analytics">
          {(a) => <Report a={a} fetching={query.isFetching} />}
        </QueryView>
      </Screen>
      <DatePickerSheet
        visible={picking !== null}
        title={picking === 'start' ? 'Start date' : 'End date'}
        value={picking === 'start' ? custom.start : custom.end}
        maximumDate={today}
        onPick={pick}
        onClose={closePicker}
      />
    </>
  );
}

function Report({ a, fetching }: { a: Analytics; fetching: boolean }) {
  const router = useRouter();
  const f = useFormat();
  const [table, setTable] = useState(false);
  const { half: tile } = useTileWidth();
  const span = daysBetween(a.period.startDate, a.period.endDate) + 1;
  const against = 'vs previous period';

  const byDay = useMemo(
    () =>
      a.revenue.byDay.map((d) => ({
        key: d.date,
        label: formatCalendarDate(d.date),
        value: d.amount,
        valueLabel: f.money(d.amount),
        axisLabel: span <= 14 ? WEEKDAY_SHORT[new Date(`${d.date}T00:00:00Z`).getUTCDay()] : formatMonthDay(d.date),
      })),
    [a.revenue.byDay, f, span],
  );

  const peakTop = [...a.peakHours].sort((x, y) => y.utilization - x.utilization)[0];
  const quietest = [...a.peakHours].filter((c) => c.hour >= 9 && c.hour < 21).sort((x, y) => x.utilization - y.utilization)[0];

  return (
    <View style={[styles.report, fetching && { opacity: 0.6 }]}>
      <View style={styles.tiles}>
        <MetricCard width={tile} tint="accent" icon={CurrencyCircleDollar} label="Revenue" value={f.tileMoney(a.revenue.total)} valueA11y={f.moneyA11y(a.revenue.total)} trend={percentTrend(a.revenue.changePercent, against)} />
        <MetricCard width={tile} icon={CalendarCheck} label="Bookings" value={formatNumber(a.bookings.total, 0)} trend={percentTrend(a.bookings.changePercent, against)} supporting={`${formatNumber(a.bookings.averagePerDay)} a day`} />
        <MetricCard width={tile} icon={ChartBar} label="Utilization" value={`${Math.round(a.utilization.overall)}%`} valueA11y={`${Math.round(a.utilization.overall)} percent`} supporting="Booked share of open hours" />
        <MetricCard width={tile} icon={Receipt} label="Average booking" value={f.tileMoney(a.bookings.averageValue)} valueA11y={f.moneyA11y(a.bookings.averageValue)} />
      </View>

      <View>
        <SectionHeader title="Revenue over time" />
        <Card>
          {table ? (
            <View style={styles.table}>
              {byDay.map((d) => (
                <View key={d.key} style={styles.tableRow}>
                  <AppText tone="muted" style={styles.flex}>
                    {d.label}
                  </AppText>
                  <AppText numeric>{d.valueLabel}</AppText>
                </View>
              ))}
            </View>
          ) : (
            <ColumnChart data={byDay} summary={{ label: `Total for ${span} days · tap a bar for one day`, value: f.money(a.revenue.total) }} />
          )}
          <View style={styles.cardFoot}>
            <Button size="sm" variant="ghost" label={table ? 'Show chart' : 'Show as table'} icon={table ? ChartBar : Table} onPress={() => setTable((t) => !t)} />
          </View>
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
  filters: { gap: spacing.sm },
  report: { gap: spacing.xxxl },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  table: { gap: spacing.xs },
  tableRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: 2 },
  flex: { flex: 1 },
  cardFoot: { marginTop: spacing.md, alignItems: 'flex-start' },
  notice: { marginTop: spacing.md },
  gapTop: { marginTop: spacing.md },
  gapBottom: { marginBottom: spacing.md },
});

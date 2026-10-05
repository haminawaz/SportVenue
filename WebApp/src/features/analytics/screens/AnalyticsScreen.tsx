'use client';

import { useMemo, useState } from 'react';
import { CalendarBlank, CalendarCheck, ChartBar, CurrencyCircleDollar, Receipt, Table, UserPlus, Users, XCircle } from '@phosphor-icons/react';

import type { Analytics } from '@/domain/types';
import { percentTrend } from '@/features/dashboard/utils/dashboardFormatters';
import { addDays, daysBetween, formatCalendarDate, formatMonthDay, type CalendarDate } from '@/lib/datetime';
import { formatNumber, useFormat, WEEK_ORDER, WEEKDAY_SHORT } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip, ChipRow } from '@/ui/Chips';
import { cn } from '@/ui/cn';
import { DatePickerSheet } from '@/ui/DateField';
import { ListGroup, ListRow } from '@/ui/List';
import { MetricCard, MetricGrid } from '@/ui/MetricCard';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { StackHeader } from '@/ui/StackHeader';
import { DetailSkeleton, Notice, QueryView } from '@/ui/States';

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
      <StackHeader title="Analytics" />
      <Screen onRefresh={() => query.refetch()}>
        <div className="flex flex-col gap-2">
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
        </div>

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
  const router = useAppRouter();
  const f = useFormat();
  const [table, setTable] = useState(false);
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
    <div className={cn('flex flex-col gap-8 transition-opacity', fetching && 'opacity-60')}>
      <MetricGrid>
        <MetricCard tint="accent" icon={CurrencyCircleDollar} label="Revenue" value={f.tileMoney(a.revenue.total)} valueA11y={f.moneyA11y(a.revenue.total)} trend={percentTrend(a.revenue.changePercent, against)} />
        <MetricCard icon={CalendarCheck} label="Bookings" value={formatNumber(a.bookings.total, 0)} trend={percentTrend(a.bookings.changePercent, against)} supporting={`${formatNumber(a.bookings.averagePerDay)} a day`} />
        <MetricCard icon={ChartBar} label="Utilization" value={`${Math.round(a.utilization.overall)}%`} valueA11y={`${Math.round(a.utilization.overall)} percent`} supporting="Booked share of open hours" />
        <MetricCard icon={Receipt} label="Average booking" value={f.tileMoney(a.bookings.averageValue)} valueA11y={f.moneyA11y(a.bookings.averageValue)} />
      </MetricGrid>

      <section>
        <SectionHeader title="Revenue over time" />
        <Card>
          {table ? (
            <table className="w-full">
              <caption className="sr-only">Revenue per day</caption>
              <tbody>
                {byDay.map((d) => (
                  <tr key={d.key}>
                    <th scope="row" className="py-0.5 text-left font-normal">
                      <AppText tone="muted">{d.label}</AppText>
                    </th>
                    <td className="py-0.5 text-right">
                      <AppText numeric>{d.valueLabel}</AppText>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <ColumnChart data={byDay} summary={{ label: `Total for ${span} days · hover or tap a bar for one day`, value: f.money(a.revenue.total) }} />
          )}
          <div className="mt-3 flex">
            <Button size="sm" variant="ghost" label={table ? 'Show chart' : 'Show as table'} icon={table ? ChartBar : Table} onPress={() => setTable((t) => !t)} />
          </div>
        </Card>
      </section>

      <section>
        <SectionHeader title="Revenue by court" />
        <Card>
          {a.revenueByCourt.length === 0 ? (
            <AppText tone="muted">No revenue in this period.</AppText>
          ) : (
            <BarList data={a.revenueByCourt.map((c) => ({ key: c.courtId, label: c.courtName, value: c.amount, valueLabel: f.money(c.amount), onPress: () => router.push(routes.court(c.courtId)) }))} />
          )}
        </Card>
      </section>

      <section>
        <SectionHeader title="Court utilization" />
        <Card>
          <BarList
            max={100}
            data={[...a.utilization.byCourt].sort((x, y) => y.utilization - x.utilization).map((c) => ({ key: c.courtId, label: c.courtName, value: c.utilization, valueLabel: `${Math.round(c.utilization)}%` }))}
          />
        </Card>
      </section>

      <section>
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
          <div className="mt-3">
            <Notice
              message={`Busiest: ${WEEKDAY_SHORT[peakTop.weekday]} around ${hourLabel(peakTop.hour)} (${Math.round(peakTop.utilization)}% booked). Quietest daytime hour: ${WEEKDAY_SHORT[quietest.weekday]} around ${hourLabel(quietest.hour)} (${Math.round(quietest.utilization)}%).`}
            />
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Customers" onLink={() => router.push(routes.customers)} />
        <MetricGrid>
          <MetricCard icon={Users} label="Played" value={formatNumber(a.customers.active, 0)} supporting="customers in period" />
          <MetricCard icon={UserPlus} label="New" value={formatNumber(a.customers.new, 0)} supporting={`${formatNumber(a.customers.returning, 0)} returning`} />
        </MetricGrid>
        {a.customers.top.length > 0 && (
          <div className="mt-3">
            <ListGroup title="Top customers by spend">
              {a.customers.top.map((c, i) => (
                <ListRow key={c.customerId} title={`${i + 1}. ${c.name}`} subtitle={`${c.bookings} bookings`} value={f.money(c.spent)} valueTone="default" onPress={() => router.push(routes.customer(c.customerId))} />
              ))}
            </ListGroup>
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Outstanding payments" onLink={() => router.push(routes.payments('outstanding'))} />
        <Card tint={a.outstanding.total > 0 ? 'warning' : 'surface'}>
          <AppText variant="display-lg" numeric aria-label={f.moneyA11y(a.outstanding.total)}>
            {f.money(a.outstanding.total)}
          </AppText>
          <AppText variant="body-sm" tone="muted" className="mb-3">
            Owed across {a.outstanding.bookingCount} bookings, by how long it has been due
          </AppText>
          <BarList data={a.outstanding.aging.map((b) => ({ key: b.label, label: b.label, value: b.amount, valueLabel: f.money(b.amount) }))} />
        </Card>
      </section>

      <section>
        <SectionHeader title="Cancellations" />
        <MetricGrid>
          <MetricCard icon={XCircle} label="Cancelled" value={formatNumber(a.cancellations.count, 0)} supporting={`${formatNumber(a.cancellations.rate)}% of bookings`} />
          <MetricCard icon={CalendarBlank} label="No-shows" value={formatNumber(a.cancellations.noShows, 0)} />
        </MetricGrid>
        {a.cancellations.reasons.length > 0 && (
          <Card className="mt-3">
            <AppText variant="nav-link" tone="muted" className="mb-3">
              Reasons given
            </AppText>
            <BarList data={a.cancellations.reasons.map((r) => ({ key: r.reason, label: r.reason, value: r.count, valueLabel: String(r.count) }))} />
          </Card>
        )}
      </section>
    </div>
  );
}

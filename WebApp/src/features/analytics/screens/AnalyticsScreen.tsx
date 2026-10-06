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
import { Card, CardHeader } from '@/ui/Card';
import { cn } from '@/ui/cn';
import { DataTable } from '@/ui/DataTable';
import { Page, PageHeader } from '@/ui/Page';
import { StatCard, StatGrid } from '@/ui/StatCard';
import { DetailSkeleton, Notice, QueryView } from '@/ui/States';
import { SegmentedControl } from '@/ui/Tabs';

import { useAnalytics } from '../api';
import { BarList, ColumnChart, Heatmap } from '../components/Charts';

type Preset = '7d' | '30d' | '90d' | 'month' | 'lastMonth' | 'custom';
const PRESETS: { value: Preset; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
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

const dateInput = 't-label h-9 rounded-control border border-border-strong bg-surface px-2.5 text-text outline-none focus:border-text focus:ring-3 focus:ring-text/10';

export function AnalyticsScreen() {
  const f = useFormat();
  const today = f.today();
  const [preset, setPreset] = useState<Preset>('30d');
  const [custom, setCustom] = useState({ start: addDays(today, -13), end: today });
  const [rangeError, setRangeError] = useState<string>();
  const range = preset === 'custom' ? custom : presetRange(preset, today);
  const query = useAnalytics(range.start, range.end);

  const pick = (which: 'start' | 'end', d: CalendarDate) => {
    const next = which === 'start' ? { ...custom, start: d } : { ...custom, end: d };
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
    <Page onRefresh={() => query.refetch()}>
      <PageHeader
        title="Analytics"
        description={
          rangeError ? (
            <span role="alert" className="text-danger">
              {rangeError}
            </span>
          ) : (
            `${formatCalendarDate(range.start)} - ${formatCalendarDate(range.end)}, compared with the ${daysBetween(range.start, range.end) + 1} days before`
          )
        }
        actions={
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
            <SegmentedControl label="Period" value={preset} options={PRESETS} onChange={setPreset} />
            {preset === 'custom' && (
              <div className="flex items-center gap-1.5">
                <input type="date" aria-label="Start date" value={custom.start} max={today} onChange={(e) => e.target.value && pick('start', e.target.value)} className={dateInput} />
                <AppText variant="small" tone="muted">
                  to
                </AppText>
                <input type="date" aria-label="End date" value={custom.end} max={today} onChange={(e) => e.target.value && pick('end', e.target.value)} className={dateInput} />
              </div>
            )}
          </div>
        }
      />
      <QueryView query={query} skeleton={<DetailSkeleton />} errorTitle="Couldn't load analytics">
        {(a) => <Report a={a} fetching={query.isFetching} />}
      </QueryView>
    </Page>
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
    <div className={cn('flex flex-col gap-6 transition-opacity', fetching && 'opacity-60')}>
      <StatGrid>
        <StatCard icon={CurrencyCircleDollar} label="Revenue" value={f.tileMoney(a.revenue.total)} valueA11y={f.moneyA11y(a.revenue.total)} trend={percentTrend(a.revenue.changePercent, against)} />
        <StatCard icon={CalendarCheck} label="Bookings" value={formatNumber(a.bookings.total, 0)} trend={percentTrend(a.bookings.changePercent, against)} supporting={`${formatNumber(a.bookings.averagePerDay)} a day`} />
        <StatCard icon={ChartBar} label="Utilization" value={`${Math.round(a.utilization.overall)}%`} valueA11y={`${Math.round(a.utilization.overall)} percent`} supporting="Booked share of open hours" />
        <StatCard icon={Receipt} label="Average booking" value={f.tileMoney(a.bookings.averageValue)} valueA11y={f.moneyA11y(a.bookings.averageValue)} />
      </StatGrid>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <Card padded={false} as="section" className="xl:col-span-2">
          <CardHeader title="Revenue over time" actions={<Button size="sm" variant="ghost" label={table ? 'Show chart' : 'Show as table'} icon={table ? ChartBar : Table} onPress={() => setTable((t) => !t)} />} />
          <div className="p-5">
            {table ? (
              <table className="w-full">
                <caption className="sr-only">Revenue per day</caption>
                <tbody>
                  {byDay.map((d) => (
                    <tr key={d.key} className="border-b border-border last:border-b-0">
                      <th scope="row" className="t-text py-1.5 text-left font-normal text-text-muted">
                        {d.label}
                      </th>
                      <td className="t-text py-1.5 text-right tabular-nums">{d.valueLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <ColumnChart data={byDay} height={220} summary={{ label: `Total for ${span} days · hover or select a bar for one day`, value: f.money(a.revenue.total) }} />
            )}
          </div>
        </Card>
        <Card padded={false} as="section">
          <CardHeader title="Revenue by court" />
          <div className="p-5">
            {a.revenueByCourt.length === 0 ? (
              <AppText variant="small" tone="muted">
                No revenue in this period.
              </AppText>
            ) : (
              <BarList data={a.revenueByCourt.map((c) => ({ key: c.courtId, label: c.courtName, value: c.amount, valueLabel: f.money(c.amount), onPress: () => router.push(routes.court(c.courtId)) }))} />
            )}
          </div>
        </Card>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <Card padded={false} as="section" className="xl:col-span-2">
          <CardHeader title="Peak and off-peak hours" description="Share of court time booked, by weekday and hour." />
          <div className="flex flex-col gap-4 p-5">
            <Heatmap
              cells={a.peakHours.map((p) => ({ row: p.weekday, col: p.hour, value: p.utilization }))}
              rows={[...WEEK_ORDER]}
              cols={Array.from({ length: 16 }, (_, i) => i + 7)}
              rowLabel={(r) => WEEKDAY_SHORT[r]}
              colLabel={hourLabel}
              colShort={hourShort}
              valueLabel={(v) => `${Math.round(v)}% booked`}
            />
            {peakTop && quietest && (
              <Notice
                message={`Busiest: ${WEEKDAY_SHORT[peakTop.weekday]} around ${hourLabel(peakTop.hour)} (${Math.round(peakTop.utilization)}% booked). Quietest daytime hour: ${WEEKDAY_SHORT[quietest.weekday]} around ${hourLabel(quietest.hour)} (${Math.round(quietest.utilization)}%).`}
              />
            )}
          </div>
        </Card>
        <Card padded={false} as="section">
          <CardHeader title="Court utilization" />
          <div className="p-5">
            <BarList max={100} data={[...a.utilization.byCourt].sort((x, y) => y.utilization - x.utilization).map((c) => ({ key: c.courtId, label: c.courtName, value: c.utilization, valueLabel: `${Math.round(c.utilization)}%` }))} />
          </div>
        </Card>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card padded={false} as="section">
          <CardHeader title="Customers" actions={<Button label="All customers" variant="ghost" size="sm" onPress={() => router.push(routes.customers)} />} />
          <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
            <MiniStat icon={Users} label="Played" value={formatNumber(a.customers.active, 0)} supporting="customers in period" />
            <MiniStat icon={UserPlus} label="New" value={formatNumber(a.customers.new, 0)} supporting={`${formatNumber(a.customers.returning, 0)} returning`} />
          </div>
          {a.customers.top.length > 0 && (
            <DataTable
              caption="Top customers by spend"
              rows={a.customers.top}
              rowKey={(c) => c.customerId}
              rowHref={(c) => routes.customer(c.customerId)}
              dense
              columns={[
                { key: 'rank', header: '#', cell: (c) => <span className="text-text-subtle tabular-nums">{a.customers.top.indexOf(c) + 1}</span> },
                { key: 'name', header: 'Top customers', primary: true, cell: (c) => <AppText variant="text-strong">{c.name}</AppText> },
                { key: 'bookings', header: 'Bookings', align: 'right', cell: (c) => c.bookings },
                { key: 'spent', header: 'Spent', align: 'right', cell: (c) => <span className="t-text-strong">{f.money(c.spent)}</span> },
              ]}
            />
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card padded={false} as="section">
            <CardHeader title="Outstanding payments" actions={<Button label="Collect" variant="ghost" size="sm" onPress={() => router.push(routes.payments('outstanding'))} />} />
            <div className="flex flex-col gap-4 p-5">
              <div>
                <AppText variant="stat" numeric tone={a.outstanding.total > 0 ? 'warning' : 'default'} aria-label={f.moneyA11y(a.outstanding.total)}>
                  {f.money(a.outstanding.total)}
                </AppText>
                <AppText variant="small" tone="muted">
                  Owed across {a.outstanding.bookingCount} bookings, by how long it has been due
                </AppText>
              </div>
              <BarList data={a.outstanding.aging.map((b) => ({ key: b.label, label: b.label, value: b.amount, valueLabel: f.money(b.amount) }))} />
            </div>
          </Card>
          <Card padded={false} as="section">
            <CardHeader title="Cancellations" />
            <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
              <MiniStat icon={XCircle} label="Cancelled" value={formatNumber(a.cancellations.count, 0)} supporting={`${formatNumber(a.cancellations.rate)}% of bookings`} />
              <MiniStat icon={CalendarBlank} label="No-shows" value={formatNumber(a.cancellations.noShows, 0)} />
            </div>
            {a.cancellations.reasons.length > 0 && (
              <div className="flex flex-col gap-3 p-5">
                <AppText variant="label" tone="muted">
                  Reasons given
                </AppText>
                <BarList data={a.cancellations.reasons.map((r) => ({ key: r.reason, label: r.reason, value: r.count, valueLabel: String(r.count) }))} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, supporting }: { icon: typeof Users; label: string; value: string; supporting?: string }) {
  return (
    <div role="group" aria-label={[label, value, supporting].filter(Boolean).join(', ')} className="flex flex-col gap-1 p-5">
      <span aria-hidden className="flex items-center gap-2 text-text-subtle">
        <Icon size={15} />
        <AppText variant="label" tone="muted">
          {label}
        </AppText>
      </span>
      <AppText variant="stat" numeric aria-hidden>
        {value}
      </AppText>
      {supporting && (
        <AppText variant="small" tone="muted" aria-hidden>
          {supporting}
        </AppText>
      )}
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { CalendarBlank, CalendarCheck, ChartBar, CurrencyCircleDollar, Receipt, UserPlus, Users, XCircle } from '@phosphor-icons/react';

import type { Analytics } from '@/domain/types';
import { daysBetween } from '@/lib/datetime';
import { formatNumber, useFormat, WEEK_ORDER, WEEKDAY_SHORT } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { cn } from '@/ui/cn';
import { DataTable } from '@/ui/DataTable';
import { StatCard, StatGrid } from '@/ui/StatCard';
import { Notice } from '@/ui/States';

import { percentTrend } from '../utils/dashboardFormatters';
import { revenueSeries } from '../utils/revenueSeries';

import { BarList, ColumnChart, Heatmap } from './Charts';

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;
const hourShort = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'a' : 'p'}`;

/**
 * The facility report for the dashboard's selected period: headline numbers
 * against the period before, revenue over time and by court, peak hours,
 * court utilization, customers, outstanding payments and cancellations.
 */
export function AnalyticsReport({ a, fetching }: { a: Analytics; fetching: boolean }) {
  const router = useAppRouter();
  const f = useFormat();
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
    <div className={cn('flex flex-col gap-6 transition-opacity', fetching && 'opacity-60')}>
      <StatGrid>
        <StatCard icon={CurrencyCircleDollar} label="Revenue" value={f.tileMoney(a.revenue.total)} valueA11y={f.moneyA11y(a.revenue.total)} trend={percentTrend(a.revenue.changePercent, against)} />
        <StatCard icon={CalendarCheck} label="Bookings" value={formatNumber(a.bookings.total, 0)} trend={percentTrend(a.bookings.changePercent, against)} supporting={`${formatNumber(a.bookings.averagePerDay)} a day`} />
        <StatCard icon={ChartBar} label="Utilization" value={`${Math.round(a.utilization.overall)}%`} valueA11y={`${Math.round(a.utilization.overall)} percent`} supporting="Booked share of open hours" />
        <StatCard icon={Receipt} label="Average booking" value={f.tileMoney(a.bookings.averageValue)} valueA11y={f.moneyA11y(a.bookings.averageValue)} />
      </StatGrid>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <Card padded={false} as="section" className="xl:col-span-2">
          <CardHeader title="Revenue over time" />
          <div className="p-5">
            <ColumnChart data={byDay} height={220} summary={{ label: span === 1 ? 'Total for the day' : `Total for ${span} days · hover or select a bar for one ${series.bucket}`, value: f.money(a.revenue.total) }} />
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

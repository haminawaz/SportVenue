'use client';

import { useState } from 'react';
import { ClockCounterClockwise, CourtBasketball, Percent, Plus, Tag } from '@phosphor-icons/react';

import { COURT_STATUS } from '@/domain/labels';
import type { Discount } from '@/domain/types';
import { useCourts } from '@/features/courts/api';
import { formatClock, formatWeekdays, useFormat } from '@/lib/format';
import { useQueryParams } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { DataTable } from '@/ui/DataTable';
import { EmptyState } from '@/ui/EmptyState';
import { FilterSelect } from '@/ui/Menu';
import { Page, PageHeader } from '@/ui/Page';
import { ListSkeleton } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useDiscounts, usePricingRules } from '../api';

export function discountValueLabel(d: Pick<Discount, 'kind' | 'value'>, money: (n: number) => string) {
  return d.kind === 'PERCENT' ? `${d.value}% off` : `${money(d.value)} off`;
}

export function PricingScreen() {
  const params = useQueryParams('courtId');
  const router = useAppRouter();
  const f = useFormat();
  const [courtId, setCourtId] = useState<string>(params.courtId ?? '');
  const courts = useCourts();
  const rules = usePricingRules(courtId || undefined);
  const discounts = useDiscounts();

  const courtList = (courts.data ?? []).filter((c) => !courtId || c.id === courtId);
  const shownDiscounts = (discounts.data ?? []).filter((d) => !courtId || d.courtIds.length === 0 || d.courtIds.includes(courtId));
  const selectedCourt = courts.data?.find((c) => c.id === courtId);
  // Rates and discounts apply to courts, so a new facility sees only the first step: add a court.
  const noCourts = courts.isSuccess && courts.data.length === 0;
  const courtParam = courtId || undefined;

  return (
    <Page onRefresh={() => Promise.all([courts.refetch(), rules.refetch(), discounts.refetch()])}>
      <PageHeader
        title={selectedCourt ? `${selectedCourt.name} pricing` : 'Pricing'}
        description="Customers pay the base rate unless a time-based rate applies. Discounts come off the result."
        actions={
          <>
            <FilterSelect label="Court" value={courtId} options={[{ value: '', label: 'All courts' }, ...(courts.data ?? []).map((c) => ({ value: c.id, label: c.name }))]} onChange={setCourtId} active={!!courtId} />
            <Button label="History" icon={ClockCounterClockwise} variant="secondary" onPress={() => router.push(routes.pricingHistory)} />
          </>
        }
      />

      <Card padded={false} as="section">
        <CardHeader title="Base rates" description="The hourly price of each court." />
        {courts.isPending ? (
          <ListSkeleton rows={3} />
        ) : courtList.length === 0 ? (
          <EmptyState
            compact
            icon={CourtBasketball}
            title="No courts yet"
            message="Each court has a base rate. Add a court to set its price."
            action={<Button size="sm" variant="secondary" label="Add court" icon={Plus} onPress={() => router.push(routes.courtNew)} />}
          />
        ) : (
          <DataTable
            caption="Base rates"
            rows={courtList}
            rowKey={(c) => c.id}
            rowHref={(c) => routes.courtEdit(c.id)}
            rowLabel={(c) => `${c.name}, ${c.sport}, base rate ${f.moneyA11y(c.hourlyRate)} per hour${c.status === 'ACTIVE' ? '' : `, ${COURT_STATUS[c.status].label}`}. Edit`}
            columns={[
              { key: 'name', header: 'Court', primary: true, cell: (c) => <AppText variant="text-strong">{c.name}</AppText> },
              { key: 'sport', header: 'Sport', hideBelow: 'sm', cell: (c) => <span className="text-text-muted">{c.sport}</span> },
              { key: 'status', header: 'Status', hideBelow: 'md', cell: (c) => <StatusBadge label={COURT_STATUS[c.status].label} tone={COURT_STATUS[c.status].tone} /> },
              { key: 'rate', header: 'Per hour', align: 'right', cell: (c) => <span className="t-text-strong">{f.money(c.hourlyRate)}</span> },
            ]}
          />
        )}
      </Card>

      {noCourts ? null : (
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <Card padded={false} as="section">
            <CardHeader title="Time-based rates" count={rules.data?.length} description="Charge more at peak times or less when courts are quiet." actions={<Button label="Add a rate" icon={Plus} size="sm" variant="secondary" onPress={() => router.push(routes.pricingRuleNew({ courtId: courtParam }))} />} />
            {rules.isPending ? (
              <ListSkeleton rows={3} />
            ) : (rules.data ?? []).length === 0 ? (
              <EmptyState compact icon={Tag} title="No time-based rates" message="Charge more at peak times or less when courts are quiet." />
            ) : (
              <DataTable
                caption="Time-based rates"
                rows={rules.data ?? []}
                rowKey={(r) => r.id}
                rowHref={(r) => routes.pricingRule(r.id)}
                rowLabel={(r) => [r.name, r.courtName ?? 'All courts', formatWeekdays(r.weekdays), `${formatClock(r.startTime)} to ${formatClock(r.endTime)}`, `${f.moneyA11y(r.hourlyRate)} per hour`, r.active ? undefined : 'off'].filter(Boolean).join(', ')}
                columns={[
                  {
                    key: 'name',
                    header: 'Rate',
                    primary: true,
                    cell: (r) => (
                      <span className="flex flex-col">
                        <AppText variant="text-strong">{r.name}</AppText>
                        <AppText variant="small" tone="muted">{`${formatWeekdays(r.weekdays)}, ${formatClock(r.startTime)} - ${formatClock(r.endTime)}`}</AppText>
                      </span>
                    ),
                  },
                  { key: 'court', header: 'Court', hideBelow: 'sm', cell: (r) => <span className="text-text-muted">{r.courtName ?? 'All courts'}</span> },
                  { key: 'status', header: 'Status', hideBelow: 'md', cell: (r) => (r.active ? <StatusBadge label="Active" tone="positive" /> : <StatusBadge label="Off" tone="neutral" />) },
                  { key: 'rate', header: 'Per hour', align: 'right', cell: (r) => <span className="t-text-strong">{f.money(r.hourlyRate)}</span> },
                ]}
              />
            )}
          </Card>

          <Card padded={false} as="section">
            <CardHeader title="Discounts" count={shownDiscounts.length} description="A percentage or fixed amount off, with or without a code." actions={<Button label="Create a discount" icon={Plus} size="sm" variant="secondary" onPress={() => router.push(routes.discountNew({ courtId: courtParam }))} />} />
            {discounts.isPending ? (
              <ListSkeleton rows={3} />
            ) : shownDiscounts.length === 0 ? (
              <EmptyState compact icon={Percent} title="No discounts" message="Offer a percentage or fixed amount off, with or without a code." />
            ) : (
              <DataTable
                caption="Discounts"
                rows={shownDiscounts}
                rowKey={(d) => d.id}
                rowHref={(d) => routes.discount(d.id)}
                rowLabel={(d) => [d.name, discountValueLabel(d, f.money), d.code ? `code ${d.code}` : 'no code', `used ${d.usageCount} times`, d.active ? 'active' : 'off'].join(', ')}
                columns={[
                  {
                    key: 'name',
                    header: 'Discount',
                    primary: true,
                    cell: (d) => (
                      <span className="flex flex-col">
                        <AppText variant="text-strong">{d.name}</AppText>
                        <AppText variant="small" tone="muted">
                          {discountValueLabel(d, f.money)}
                        </AppText>
                      </span>
                    ),
                  },
                  { key: 'code', header: 'Code', hideBelow: 'sm', cell: (d) => (d.code ? <code className="t-mini rounded-[4px] bg-surface-muted px-1.5 py-0.5 font-semibold">{d.code}</code> : <span className="text-text-subtle">-</span>) },
                  { key: 'uses', header: 'Used', align: 'right', hideBelow: 'md', cell: (d) => (d.maxUses ? `${d.usageCount} / ${d.maxUses}` : d.usageCount) },
                  { key: 'status', header: 'Status', align: 'right', cell: (d) => <StatusBadge label={d.active ? 'Active' : 'Off'} tone={d.active ? 'positive' : 'neutral'} /> },
                ]}
              />
            )}
          </Card>
        </div>
      )}
    </Page>
  );
}

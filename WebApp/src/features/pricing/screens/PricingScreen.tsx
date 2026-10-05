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
import { Chip, ChipRow } from '@/ui/Chips';
import { EmptyState } from '@/ui/EmptyState';
import { ListGroup, ListRow, SummaryRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { StackHeader } from '@/ui/StackHeader';
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
  const [courtId, setCourtId] = useState<string | undefined>(params.courtId);
  const courts = useCourts();
  const rules = usePricingRules(courtId);
  const discounts = useDiscounts();

  const courtList = (courts.data ?? []).filter((c) => !courtId || c.id === courtId);
  const shownDiscounts = (discounts.data ?? []).filter((d) => !courtId || d.courtIds.length === 0 || d.courtIds.includes(courtId));
  const addButton = (label: string, onPress: () => void) => <ListRow title={label} icon={Plus} onPress={onPress} />;
  const selectedCourt = courts.data?.find((c) => c.id === courtId);
  // Rates and discounts apply to courts, so a new facility sees only the first step: add a court.
  const noCourts = courts.isSuccess && courts.data.length === 0;

  return (
    <>
      <StackHeader title={selectedCourt ? `${selectedCourt.name} pricing` : 'Pricing'} />
      <Screen onRefresh={() => Promise.all([courts.refetch(), rules.refetch(), discounts.refetch()])}>
        <AppText as="p" tone="muted">
          Customers pay the base rate unless a time-based rate applies. Discounts come off the result.
        </AppText>

        <ChipRow>
          <Chip label="All courts" selected={!courtId} onPress={() => setCourtId(undefined)} />
          {(courts.data ?? []).map((c) => (
            <Chip key={c.id} label={c.name} selected={courtId === c.id} onPress={() => setCourtId(c.id)} />
          ))}
        </ChipRow>

        <section>
          <SectionHeader title="Base rates" />
          {courts.isPending ? (
            <ListSkeleton rows={3} withAvatar={false} />
          ) : courtList.length === 0 ? (
            <EmptyState
              compact
              icon={CourtBasketball}
              title="No courts yet"
              message="Each court has a base rate. Add a court to set its price."
              action={<Button size="sm" variant="secondary" label="Add court" icon={Plus} onPress={() => router.push(routes.courtNew)} />}
            />
          ) : (
            <ListGroup>
              {courtList.map((c) => (
                <SummaryRow
                  key={c.id}
                  title={c.name}
                  value={`${f.money(c.hourlyRate)} / h`}
                  meta={c.sport}
                  tag={c.status !== 'ACTIVE' ? <StatusBadge label={COURT_STATUS[c.status].label} tone={COURT_STATUS[c.status].tone} /> : undefined}
                  label={`${c.name}, ${c.sport}, base rate ${f.moneyA11y(c.hourlyRate)} per hour${c.status === 'ACTIVE' ? '' : `, ${COURT_STATUS[c.status].label}`}`}
                  hint="Opens the court to change its base rate"
                  onPress={() => router.push(routes.courtEdit(c.id))}
                />
              ))}
            </ListGroup>
          )}
        </section>

        {noCourts ? null : (
          <>
            <section>
              <SectionHeader title="Time-based rates" count={rules.data?.length} />
              {rules.isPending ? (
                <ListSkeleton rows={3} withAvatar={false} />
              ) : (rules.data ?? []).length === 0 ? (
                <EmptyState
                  compact
                  icon={Tag}
                  title="No time-based rates"
                  message="Charge more at peak times or less when courts are quiet."
                  action={<Button size="sm" variant="secondary" label="Add a rate" icon={Plus} onPress={() => router.push(routes.pricingRuleNew({ courtId }))} />}
                />
              ) : (
                <ListGroup>
                  {(rules.data ?? []).map((r) => (
                    <SummaryRow
                      key={r.id}
                      title={r.name}
                      value={`${f.money(r.hourlyRate)} / h`}
                      meta={`${formatWeekdays(r.weekdays)}, ${formatClock(r.startTime)} - ${formatClock(r.endTime)}`}
                      tag={!r.active ? <StatusBadge label="Off" tone="neutral" /> : !courtId ? <StatusBadge label={r.courtName ?? 'All courts'} tone="neutral" /> : undefined}
                      label={[r.name, r.courtName ?? 'All courts', formatWeekdays(r.weekdays), `${formatClock(r.startTime)} to ${formatClock(r.endTime)}`, `${f.moneyA11y(r.hourlyRate)} per hour`, r.active ? undefined : 'off']
                        .filter(Boolean)
                        .join(', ')}
                      hint="Opens this rate"
                      onPress={() => router.push(routes.pricingRule(r.id))}
                    />
                  ))}
                  {addButton('Add a rate', () => router.push(routes.pricingRuleNew({ courtId })))}
                </ListGroup>
              )}
            </section>

            <section>
              <SectionHeader title="Discounts" count={shownDiscounts.length} />
              {discounts.isPending ? (
                <ListSkeleton rows={3} withAvatar={false} />
              ) : shownDiscounts.length === 0 ? (
                <EmptyState
                  compact
                  icon={Percent}
                  title="No discounts"
                  message="Offer a percentage or fixed amount off, with or without a code."
                  action={<Button size="sm" variant="secondary" label="Create a discount" icon={Plus} onPress={() => router.push(routes.discountNew({ courtId }))} />}
                />
              ) : (
                <ListGroup>
                  {shownDiscounts.map((d) => (
                    <ListRow
                      key={d.id}
                      icon={Percent}
                      title={d.name}
                      subtitle={d.code ? `${discountValueLabel(d, f.money)} · Code ${d.code}` : discountValueLabel(d, f.money)}
                      label={[d.name, discountValueLabel(d, f.money), d.code ? `code ${d.code}` : 'no code', `used ${d.usageCount} times`, d.active ? 'active' : 'off'].join(', ')}
                      trailing={<StatusBadge label={d.active ? 'Active' : 'Off'} tone={d.active ? 'positive' : 'neutral'} />}
                      onPress={() => router.push(routes.discount(d.id))}
                    />
                  ))}
                  {addButton('Create a discount', () => router.push(routes.discountNew({ courtId })))}
                </ListGroup>
              )}
            </section>
          </>
        )}

        <ListGroup>
          <ListRow icon={ClockCounterClockwise} title="Pricing history" subtitle="Every rate and discount change" onPress={() => router.push(routes.pricingHistory)} />
        </ListGroup>
      </Screen>
    </>
  );
}

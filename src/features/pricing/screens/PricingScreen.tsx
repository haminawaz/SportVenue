import { useState } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ClockCounterClockwise, CourtBasketball, Percent, Plus, Tag } from 'phosphor-react-native';

import type { Discount } from '@/domain/types';
import { useCourts } from '@/features/courts/api';
import { formatClock, formatWeekdays, useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Chip, ChipRow } from '@/ui/Chips';
import { EmptyState } from '@/ui/EmptyState';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { ListSkeleton } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useDiscounts, usePricingRules } from '../api';

export function discountValueLabel(d: Pick<Discount, 'kind' | 'value'>, money: (n: number) => string) {
  return d.kind === 'PERCENT' ? `${d.value}% off` : `${money(d.value)} off`;
}

export function PricingScreen() {
  const params = useLocalSearchParams<{ courtId?: string }>();
  const router = useRouter();
  const f = useFormat();
  const [courtId, setCourtId] = useState<string | undefined>(params.courtId);
  const courts = useCourts();
  const rules = usePricingRules(courtId);
  const discounts = useDiscounts();
  const [refreshing, setRefreshing] = useState(false);

  const courtList = (courts.data ?? []).filter((c) => !courtId || c.id === courtId);
  const shownDiscounts = (discounts.data ?? []).filter((d) => !courtId || d.courtIds.length === 0 || d.courtIds.includes(courtId));
  const addButton = (label: string, onPress: () => void) => <ListRow title={label} icon={Plus} onPress={onPress} />;

  return (
    <>
      <Stack.Screen options={{ title: 'Pricing' }} />
      <Screen
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await Promise.all([courts.refetch(), rules.refetch(), discounts.refetch()]);
          setRefreshing(false);
        }}
      >
        <AppText tone="muted">Customers pay the base rate unless a time-based rate applies. Discounts come off the result.</AppText>

        <ChipRow>
          <Chip label="All courts" selected={!courtId} onPress={() => setCourtId(undefined)} />
          {(courts.data ?? []).map((c) => (
            <Chip key={c.id} label={c.name} selected={courtId === c.id} onPress={() => setCourtId(c.id)} />
          ))}
        </ChipRow>

        <View>
          <SectionHeader title="Base rates" />
          {courts.isPending ? (
            <ListSkeleton rows={3} withAvatar={false} />
          ) : (
            <ListGroup>
              {courtList.map((c) => (
                <ListRow
                  key={c.id}
                  icon={CourtBasketball}
                  title={c.name}
                  subtitle={c.status === 'ACTIVE' ? c.sport : `${c.sport} · not taking bookings`}
                  value={`${f.money(c.hourlyRate)} / h`}
                  onPress={() => router.push(routes.courtEdit(c.id))}
                />
              ))}
            </ListGroup>
          )}
        </View>

        <View>
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
                <ListRow
                  key={r.id}
                  icon={Tag}
                  title={r.name}
                  subtitle={`${r.courtName} · ${formatWeekdays(r.weekdays)}, ${formatClock(r.startTime)} - ${formatClock(r.endTime)}`}
                  value={`${f.money(r.hourlyRate)} / h`}
                  trailing={!r.active ? <StatusBadge label="Off" tone="neutral" /> : undefined}
                  onPress={() => router.push(routes.pricingRule(r.id))}
                />
              ))}
              {addButton('Add a rate', () => router.push(routes.pricingRuleNew({ courtId })))}
            </ListGroup>
          )}
        </View>

        <View>
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
                  subtitle={[discountValueLabel(d, f.money), d.code ? `Code ${d.code}` : 'No code', `Used ${d.usageCount}×`].join(' · ')}
                  trailing={<StatusBadge label={d.active ? 'Active' : 'Off'} tone={d.active ? 'positive' : 'neutral'} />}
                  onPress={() => router.push(routes.discount(d.id))}
                />
              ))}
              {addButton('Create a discount', () => router.push(routes.discountNew({ courtId })))}
            </ListGroup>
          )}
        </View>

        <ListGroup>
          <ListRow icon={ClockCounterClockwise} title="Pricing history" subtitle="Every rate and discount change" onPress={() => router.push(routes.pricingHistory)} />
        </ListGroup>
      </Screen>
    </>
  );
}

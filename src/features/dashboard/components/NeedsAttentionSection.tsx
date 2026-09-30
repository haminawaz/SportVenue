import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SealCheck } from 'phosphor-react-native';

import type { CalendarDate } from '@/lib/datetime';
import { spacing } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { SectionHeader } from '@/ui/SectionHeader';

import type { Opportunity, OutstandingPayment } from '../types/facilityDashboard.types';

import { OutstandingPaymentCard } from './OutstandingPaymentCard';
import { RevenueOpportunityCard, type OpportunityHandlers } from './RevenueOpportunityCard';

const INITIAL_VISIBLE = 3;

type NeedsAttentionSectionProps = {
  payments: OutstandingPayment[];
  opportunities: Opportunity[];
  currency: string;
  timeZone: string;
  today: CalendarDate;
  fallbackDate: CalendarDate;
  /** The facility's plan includes payment reminders. */
  canRemind: boolean;
  remindingBookingId: string | null;
  handlers: OpportunityHandlers;
  onRecord: (bookingId: string) => void;
  onSeeAll?: () => void;
};

type Item = { kind: 'payment'; key: string; payment: OutstandingPayment } | { kind: 'opportunity'; key: string; opportunity: Opportunity };

/**
 * One list of things the owner should act on: unpaid balances first (money
 * already earned), then the opportunities the backend found. Three show by
 * default so Home stays short.
 */
export function NeedsAttentionSection({ payments, opportunities, currency, timeZone, today, fallbackDate, canRemind, remindingBookingId, handlers, onRecord, onSeeAll }: NeedsAttentionSectionProps) {
  const [expanded, setExpanded] = useState(false);
  // Unknown opportunity types still render generically, but only if they carry a title to show.
  const renderable = opportunities.filter((o) => typeof o.title === 'string' && o.title.length > 0);
  const items: Item[] = [
    ...payments.map((p) => ({ kind: 'payment' as const, key: `pay_${p.bookingId}`, payment: p })),
    ...renderable.map((o) => ({ kind: 'opportunity' as const, key: `opp_${o.id}`, opportunity: o })),
  ];
  const visible = expanded ? items : items.slice(0, INITIAL_VISIBLE);
  const hidden = items.length - visible.length;

  return (
    <View>
      <SectionHeader title="Needs attention" count={items.length} onLink={onSeeAll} />
      {items.length === 0 ? (
        <EmptyState compact icon={SealCheck} title="You're all caught up" message="No unpaid balances or revenue opportunities for this period." />
      ) : (
        <View style={styles.list}>
          {visible.map((item) =>
            item.kind === 'payment' ? (
              <OutstandingPaymentCard
                key={item.key}
                payment={item.payment}
                timeZone={timeZone}
                today={today}
                canRemind={canRemind}
                reminding={remindingBookingId === item.payment.bookingId}
                remindDisabled={remindingBookingId !== null && remindingBookingId !== item.payment.bookingId}
                onViewBooking={handlers.onViewBooking}
                onRecord={onRecord}
                onRemind={handlers.onRemind}
              />
            ) : (
              <RevenueOpportunityCard
                key={item.key}
                opportunity={item.opportunity}
                currency={currency}
                timeZone={timeZone}
                today={today}
                fallbackDate={fallbackDate}
                canRemind={canRemind}
                reminding={!!item.opportunity.bookingId && remindingBookingId === item.opportunity.bookingId}
                handlers={handlers}
              />
            ),
          )}
          {hidden > 0 && <Button variant="ghost" block label={`Show ${hidden} more`} onPress={() => setExpanded(true)} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});

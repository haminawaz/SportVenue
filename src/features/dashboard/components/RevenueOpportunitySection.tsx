import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SealCheck } from 'phosphor-react-native';

import type { CalendarDate } from '@/lib/datetime';
import { spacing } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { SectionHeader } from '@/ui/SectionHeader';

import type { Opportunity } from '../types/facilityDashboard.types';

import { RevenueOpportunityCard, type OpportunityHandlers } from './RevenueOpportunityCard';

const INITIAL_VISIBLE = 3;

type RevenueOpportunitySectionProps = {
  opportunities: Opportunity[];
  currency: string;
  timeZone: string;
  today: CalendarDate;
  fallbackDate: CalendarDate;
  canViewBooking: boolean;
  canRemind: boolean;
  remindingBookingId: string | null;
  handlers: OpportunityHandlers;
  onSeeAll?: () => void;
};

export function RevenueOpportunitySection({ opportunities, onSeeAll, ...cardProps }: RevenueOpportunitySectionProps) {
  const [expanded, setExpanded] = useState(false);
  // Unknown types still render generically, but only if they carry a title to show.
  const renderable = opportunities.filter((o) => typeof o.title === 'string' && o.title.length > 0);
  const visible = expanded ? renderable : renderable.slice(0, INITIAL_VISIBLE);
  const hidden = renderable.length - visible.length;

  return (
    <View>
      <SectionHeader title="Revenue opportunities" count={renderable.length} onLink={onSeeAll} />
      {renderable.length === 0 ? (
        <EmptyState compact icon={SealCheck} title="You're all caught up" message="No revenue opportunities were found for this period." />
      ) : (
        <View style={styles.list}>
          {visible.map((o) => (
            <RevenueOpportunityCard
              key={o.id}
              opportunity={o}
              {...cardProps}
              reminding={!!o.bookingId && cardProps.remindingBookingId === o.bookingId}
            />
          ))}
          {hidden > 0 && <Button variant="ghost" label={`Show ${hidden} more`} onPress={() => setExpanded(true)} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm + 2 },
});

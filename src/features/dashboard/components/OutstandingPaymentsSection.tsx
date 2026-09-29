import { StyleSheet, View } from 'react-native';
import { CheckCircle } from 'phosphor-react-native';

import type { CalendarDate } from '@/lib/datetime';
import { spacing } from '@/theme/tokens';
import { EmptyState } from '@/ui/EmptyState';
import { SectionHeader } from '@/ui/SectionHeader';

import type { OutstandingPayment } from '../types/facilityDashboard.types';

import { OutstandingPaymentCard } from './OutstandingPaymentCard';

const VISIBLE = 3;

type OutstandingPaymentsSectionProps = {
  payments: OutstandingPayment[];
  timeZone: string;
  today: CalendarDate;
  canViewBooking: boolean;
  canRecord: boolean;
  canRemind: boolean;
  remindingBookingId: string | null;
  onViewBooking: (bookingId: string) => void;
  onRecord: (bookingId: string) => void;
  onRemind: (bookingId: string) => void;
  onSeeAll?: () => void;
};

export function OutstandingPaymentsSection({ payments, remindingBookingId, onSeeAll, ...rest }: OutstandingPaymentsSectionProps) {
  return (
    <View>
      <SectionHeader title="Outstanding payments" count={payments.length} onLink={onSeeAll} />
      {payments.length === 0 ? (
        <EmptyState compact icon={CheckCircle} title="No outstanding payments" message="Every booking so far has been paid." />
      ) : (
        <View style={styles.list}>
          {payments.slice(0, VISIBLE).map((p) => (
            <OutstandingPaymentCard
              key={p.bookingId}
              payment={p}
              {...rest}
              reminding={remindingBookingId === p.bookingId}
              remindDisabled={remindingBookingId !== null && remindingBookingId !== p.bookingId}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm + 2 },
});

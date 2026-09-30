import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { CalendarBlank, Plus } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { SectionHeader } from '@/ui/SectionHeader';
import { useSurface } from '@/ui/surface';

import type { RecentBooking } from '../types/facilityDashboard.types';

import { BookingSummaryRow } from './BookingSummaryRow';

type RecentBookingsSectionProps = {
  bookings: RecentBooking[];
  currency: string;
  timeZone: string;
  onBookingPress?: (bookingId: string) => void;
  onNewBooking?: () => void;
  onSeeAll?: () => void;
};

export function RecentBookingsSection({ bookings, currency, timeZone, onBookingPress, onNewBooking, onSeeAll }: RecentBookingsSectionProps) {
  const { colors } = useTheme();
  const surface = useSurface();

  return (
    <View>
      <SectionHeader title="Recent bookings" onLink={onSeeAll} />
      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarBlank}
          title="No bookings for this period"
          message="Your facility has no bookings yet for the selected period."
          action={onNewBooking && <Button label="New booking" icon={Plus} onPress={onNewBooking} />}
        />
      ) : (
        <View style={surface}>
          <View style={styles.group}>
            {bookings.map((b, i) => (
              <Fragment key={b.bookingId}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <BookingSummaryRow booking={b} currency={currency} timeZone={timeZone} onPress={onBookingPress} />
              </Fragment>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { overflow: 'hidden', borderRadius: radius.card },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.xl },
});

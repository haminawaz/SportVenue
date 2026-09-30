import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatTimeRange } from '@/lib/datetime';
import { formatMoney, formatMoneyForA11y } from '@/lib/money';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, touchTarget } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { StatusBadge } from '@/ui/StatusBadge';

import type { RecentBooking } from '../types/facilityDashboard.types';
import { bookingStatusMeta } from '../utils/dashboardFormatters';

type BookingSummaryRowProps = {
  booking: RecentBooking;
  currency: string;
  timeZone: string;
  onPress?: (bookingId: string) => void;
};

export const BookingSummaryRow = memo(function BookingSummaryRow({ booking: b, currency, timeZone, onPress }: BookingSummaryRowProps) {
  const { colors } = useTheme();
  const time = formatTimeRange(b.startAt, b.endAt, timeZone);
  const status = bookingStatusMeta(b.status);
  const cancelled = b.status === 'CANCELLED';
  const a11y = `${b.customerName}, ${b.courtName}, ${time}, ${formatMoneyForA11y(b.amount, currency)}, ${status.label}`;

  const content = (
    <>
      <View style={styles.left}>
        <AppText variant="body-strong" numberOfLines={1}>
          {b.customerName}
        </AppText>
        <AppText variant="body-sm" tone="muted" numberOfLines={1}>
          {b.courtName} · {time}
        </AppText>
      </View>
      <View style={styles.right}>
        <AppText variant="body-strong" numeric tone={cancelled ? 'subtle' : 'default'} style={cancelled && styles.struck}>
          {formatMoney(b.amount, currency)}
        </AppText>
        <StatusBadge label={status.label} tone={status.tone} />
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View accessible aria-label={a11y} style={styles.row}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      role="button"
      aria-label={a11y}
      accessibilityHint="Opens the booking"
      onPress={() => onPress(b.bookingId)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}
    >
      {content}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget + 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  left: { flex: 1, gap: spacing.xs + 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs + 2 },
  struck: { textDecorationLine: 'line-through' },
});

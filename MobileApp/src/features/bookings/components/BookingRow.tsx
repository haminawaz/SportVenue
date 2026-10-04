import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BOOKING_STATUS, PAYMENT_STATUS } from '@/domain/labels';
import type { Booking } from '@/domain/types';
import { facilityWallClock, formatMonthDay, formatTime } from '@/lib/datetime';
import { useFormat, WEEKDAY_SHORT } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { StatusBadge } from '@/ui/StatusBadge';

type BookingRowProps = { booking: Booking; onPress: (id: string) => void; showDate?: boolean; showCustomer?: boolean };

/**
 * Two lines and at most one status tag: who and how much, then when and where.
 * The tag shows only what needs attention (not confirmed, or not fully paid).
 */
export const BookingRow = memo(function BookingRow({ booking: b, onPress, showDate = true, showCustomer = true }: BookingRowProps) {
  const { colors } = useTheme();
  const f = useFormat();
  const clock = facilityWallClock(b.startAt, f.timeZone);
  const weekday = WEEKDAY_SHORT[new Date(`${clock.date}T00:00:00Z`).getUTCDay()];
  const status = BOOKING_STATUS[b.status];
  const pay = PAYMENT_STATUS[b.paymentStatus];
  const cancelled = b.status === 'CANCELLED';
  const time = `${formatTime(b.startAt, f.timeZone)} - ${formatTime(b.endAt, f.timeZone)}`;
  const showPay = !cancelled || b.paymentStatus === 'REFUNDED';

  // One tag at most: a booking-status problem wins, then an unpaid balance.
  const tag = b.status !== 'CONFIRMED' && b.status !== 'COMPLETED' ? status : showPay && b.paymentStatus !== 'PAID' ? pay : null;

  const a11y = [
    showCustomer ? b.customerName : undefined,
    b.courtName,
    showDate ? `${weekday} ${formatMonthDay(clock.date)}` : undefined,
    time,
    status.label,
    showPay ? pay.label : undefined,
    f.moneyA11y(b.total),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable role="button" aria-label={a11y} onPress={() => onPress(b.id)} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}>
      {showDate && (
        <View style={[styles.date, { backgroundColor: cancelled ? colors.surfaceMuted : colors.background }]}>
          <AppText variant="caption-uppercase" style={{ color: colors.textMuted }}>
            {weekday}
          </AppText>
          <AppText numeric style={[styles.day, { color: cancelled ? colors.textMuted : colors.text }]}>
            {clock.date.slice(8, 10)}
          </AppText>
        </View>
      )}
      <View style={styles.main}>
        <View style={styles.line}>
          <AppText variant="body-strong" numberOfLines={1} style={[styles.flex, cancelled && { color: colors.textMuted }]}>
            {showCustomer ? b.customerName : time}
          </AppText>
          <AppText variant="body-strong" numeric tone={cancelled ? 'subtle' : 'default'} style={cancelled && styles.struck}>
            {f.money(b.total)}
          </AppText>
        </View>
        <View style={styles.line}>
          <AppText variant="body-sm" tone="muted" numeric numberOfLines={1} style={styles.flex}>
            {showCustomer ? `${time} · ${b.courtName}` : b.courtName}
          </AppText>
          {tag && <StatusBadge label={tag.label} tone={tag.tone} />}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, minHeight: 80 },
  date: { width: 54, height: 58, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  day: typography['display-sm'],
  main: { flex: 1, gap: spacing.xs + 2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  struck: { textDecorationLine: 'line-through' },
});

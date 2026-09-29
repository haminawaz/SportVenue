import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BOOKING_STATUS, PAYMENT_STATUS } from '@/domain/labels';
import type { Booking } from '@/domain/types';
import { facilityWallClock, formatMonthDay, formatTime } from '@/lib/datetime';
import { useFormat, WEEKDAY_SHORT } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { StatusBadge } from '@/ui/StatusBadge';

type BookingRowProps = { booking: Booking; onPress: (id: string) => void; showDate?: boolean; showCustomer?: boolean };

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
        <View style={[styles.date, { backgroundColor: cancelled ? colors.surfaceMuted : colors.accentSoft }]}>
          <AppText variant="badge" style={{ color: cancelled ? colors.textMuted : colors.accent }}>
            {weekday.toUpperCase()}
          </AppText>
          <AppText variant="heading" numeric style={{ color: cancelled ? colors.textMuted : colors.accent }}>
            {clock.date.slice(8, 10)}
          </AppText>
        </View>
      )}
      <View style={styles.main}>
        <View style={styles.top}>
          <AppText variant="bodyStrong" numberOfLines={1} style={[styles.flex, cancelled && { color: colors.textMuted }]}>
            {showCustomer ? b.customerName : time}
          </AppText>
          <AppText variant="bodyStrong" numeric tone={cancelled ? 'subtle' : 'default'} style={cancelled && styles.struck}>
            {f.money(b.total)}
          </AppText>
        </View>
        {showCustomer && (
          <AppText variant="caption" tone="muted" numeric>
            {time}
          </AppText>
        )}
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {b.courtName}
        </AppText>
        <View style={styles.badges}>
          {b.status !== 'CONFIRMED' && <StatusBadge label={status.label} tone={status.tone} />}
          {showPay && <StatusBadge label={pay.label} tone={pay.tone} />}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  date: { width: 56, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
  main: { flex: 1, gap: spacing.xxs },
  top: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md },
  flex: { flex: 1 },
  badges: { flexDirection: 'row', gap: spacing.xs + 2, marginTop: spacing.xs, flexWrap: 'wrap' },
  struck: { textDecorationLine: 'line-through' },
});

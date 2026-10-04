import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Bell, Receipt, Wallet } from 'phosphor-react-native';

import { formatDayAndTime, type CalendarDate } from '@/lib/datetime';
import { formatMoney, formatMoneyForA11y } from '@/lib/money';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { StatusBadge } from '@/ui/StatusBadge';

import type { OutstandingPayment } from '../types/facilityDashboard.types';
import { bookingStatusMeta } from '../utils/dashboardFormatters';

type OutstandingPaymentCardProps = {
  payment: OutstandingPayment;
  timeZone: string;
  today: CalendarDate;
  /** The facility's plan includes payment reminders. */
  canRemind: boolean;
  reminding: boolean;
  remindDisabled: boolean;
  onViewBooking: (bookingId: string) => void;
  onRecord: (bookingId: string) => void;
  onRemind: (bookingId: string) => void;
};

export const OutstandingPaymentCard = memo(function OutstandingPaymentCard({
  payment: p,
  timeZone,
  today,
  canRemind,
  reminding,
  remindDisabled,
  onViewBooking,
  onRecord,
  onRemind,
}: OutstandingPaymentCardProps) {
  const { colors } = useTheme();
  const when = formatDayAndTime(p.startAt, timeZone, today);
  const status = bookingStatusMeta(p.status);
  const a11y = `Outstanding payment from ${p.customerName}, ${formatMoneyForA11y(p.outstandingAmount, p.currency)}, ${p.courtName}, ${when}, ${status.label}`;

  return (
    <Card>
      <Pressable
        accessible
        role="button"
        aria-label={a11y}
        accessibilityHint="Opens the booking"
        onPress={() => onViewBooking(p.bookingId)}
        style={({ pressed }) => [styles.info, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: colors.warningSoft }]}>
            <Wallet size={22} color={colors.warning} weight="bold" />
          </View>
          <View style={styles.flex}>
            <AppText variant="body-strong" numberOfLines={2}>
              {p.customerName}
            </AppText>
            <AppText variant="body-sm" tone="muted">
              {p.courtName} · {when}
            </AppText>
          </View>
        </View>
        <View style={styles.amountRow}>
          <AppText variant="title-md" tone="warning" numeric>
            {formatMoney(p.outstandingAmount, p.currency)}
          </AppText>
          <StatusBadge label={status.label} tone={status.tone} />
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Button size="sm" block variant="secondary" label="Record payment" icon={Receipt} aria-label={`Record payment from ${p.customerName}`} onPress={() => onRecord(p.bookingId)} />
        {canRemind && (
          <Button
            size="sm"
            block
            variant="ghost"
            label="Remind"
            icon={Bell}
            loading={reminding}
            disabled={remindDisabled}
            aria-label={`Remind ${p.customerName} to pay`}
            onPress={() => onRemind(p.bookingId)}
          />
        )}
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  info: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  icon: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: spacing.xs },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  // One line: the two actions share the card width.
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
});

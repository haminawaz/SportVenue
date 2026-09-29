import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Bell, Receipt } from 'phosphor-react-native';

import { formatDayAndTime, type CalendarDate } from '@/lib/datetime';
import { formatMoney, formatMoneyForA11y } from '@/lib/money';
import { spacing } from '@/theme/tokens';
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
  canViewBooking: boolean;
  canRecord: boolean;
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
  canViewBooking,
  canRecord,
  canRemind,
  reminding,
  remindDisabled,
  onViewBooking,
  onRecord,
  onRemind,
}: OutstandingPaymentCardProps) {
  const when = formatDayAndTime(p.startAt, timeZone, today);
  const status = bookingStatusMeta(p.status);
  const a11y = `Outstanding payment from ${p.customerName}, ${formatMoneyForA11y(p.outstandingAmount, p.currency)}, ${p.courtName}, ${when}, ${status.label}`;

  return (
    <Card>
      <Pressable
        accessible
        role={canViewBooking ? 'button' : undefined}
        aria-label={a11y}
        accessibilityHint={canViewBooking ? 'Opens the booking' : undefined}
        disabled={!canViewBooking}
        onPress={() => onViewBooking(p.bookingId)}
        style={({ pressed }) => [styles.info, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.row}>
          <AppText variant="bodyStrong" numberOfLines={2} style={styles.flex}>
            {p.customerName}
          </AppText>
          <StatusBadge label={status.label} tone={status.tone} />
        </View>
        <AppText variant="caption" tone="muted">
          {p.courtName} · {when}
        </AppText>
        <View style={styles.amountRow}>
          <AppText variant="heading" tone="warning" numeric>
            {formatMoney(p.outstandingAmount, p.currency)}
          </AppText>
          <AppText variant="caption" tone="muted">
            outstanding
          </AppText>
        </View>
      </Pressable>
      {(canRecord || canRemind) && (
        <View style={styles.actions}>
          {canRecord && <Button size="sm" label="Record payment" icon={Receipt} onPress={() => onRecord(p.bookingId)} />}
          {canRemind && (
            <Button
              size="sm"
              variant="secondary"
              label="Remind"
              icon={Bell}
              loading={reminding}
              disabled={remindDisabled}
              aria-label={`Remind ${p.customerName} to pay`}
              onPress={() => onRemind(p.bookingId)}
            />
          )}
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  info: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs + 2, marginTop: spacing.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
});

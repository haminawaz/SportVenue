import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  ArrowsClockwise,
  Bell,
  CalendarCheck,
  CalendarX,
  ChartLineDown,
  Info,
  Lightbulb,
  Tag,
  Wallet,
  type IconProps,
} from 'phosphor-react-native';

import { facilityWallClock, formatDayAndTime, formatTime, type CalendarDate } from '@/lib/datetime';
import { formatMoney } from '@/lib/money';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';

import type { KnownOpportunityType, Opportunity } from '../types/facilityDashboard.types';
import { recommendationText } from '../utils/dashboardFormatters';

const TYPE_ICON: Record<KnownOpportunityType, ComponentType<IconProps>> = {
  LOW_UTILIZATION: ChartLineDown,
  OUTSTANDING_PAYMENT: Wallet,
  CANCELLATION_RISK: CalendarX,
  REPEAT_CUSTOMER: ArrowsClockwise,
  PRICE_OPPORTUNITY: Tag,
  FULLY_BOOKED_PERIOD: CalendarCheck,
};

export type OpportunityHandlers = {
  onViewSlot: (courtId: string, date: CalendarDate) => void;
  onViewBooking: (bookingId: string) => void;
  onViewCustomer: (customerId: string) => void;
  onRemind: (bookingId: string) => void;
  onOpen?: (opportunityId: string) => void;
};

type RevenueOpportunityCardProps = {
  opportunity: Opportunity;
  currency: string;
  timeZone: string;
  today: CalendarDate;
  /** Used for "View court" when the opportunity has a court but no time. */
  fallbackDate: CalendarDate;
  /** The facility's plan includes payment reminders. */
  canRemind: boolean;
  reminding: boolean;
  handlers: OpportunityHandlers;
};

type Action = { key: string; label: string; icon?: ComponentType<IconProps>; onPress: () => void; loading?: boolean };

/**
 * Renders an opportunity the backend identified. It never adds its own
 * conclusions: the suggestion line appears only when the backend sends a
 * recommendedAction, and actions appear only when the needed IDs exist.
 */
export function RevenueOpportunityCard({
  opportunity: o,
  currency,
  timeZone,
  today,
  fallbackDate,
  canRemind,
  reminding,
  handlers,
}: RevenueOpportunityCardProps) {
  const { colors } = useTheme();
  const Icon = TYPE_ICON[o.type as KnownOpportunityType] ?? Info;

  const when = o.startAt
    ? o.endAt
      ? `${formatDayAndTime(o.startAt, timeZone, today)} - ${formatTime(o.endAt, timeZone)}`
      : formatDayAndTime(o.startAt, timeZone, today)
    : null;
  const meta = [o.courtName, when].filter(Boolean).join(' · ');
  const suggestion = recommendationText(o.recommendedAction, (amount) => formatMoney(amount, currency));

  const actions: Action[] = [];
  if (o.courtId) {
    const courtId = o.courtId;
    const date = o.startAt ? facilityWallClock(o.startAt, timeZone).date : fallbackDate;
    actions.push({ key: 'slot', label: o.startAt ? 'View slot' : 'View court', onPress: () => handlers.onViewSlot(courtId, date) });
  }
  if (o.bookingId) {
    const bookingId = o.bookingId;
    actions.push({ key: 'booking', label: 'View booking', onPress: () => handlers.onViewBooking(bookingId) });
  }
  if (o.type === 'OUTSTANDING_PAYMENT' && o.bookingId && canRemind) {
    const bookingId = o.bookingId;
    actions.push({ key: 'remind', label: 'Remind', icon: Bell, onPress: () => handlers.onRemind(bookingId), loading: reminding });
  }
  if (o.customerId) {
    const customerId = o.customerId;
    actions.push({ key: 'customer', label: 'View customer', onPress: () => handlers.onViewCustomer(customerId) });
  }

  return (
    <Card>
      <Pressable
        role={handlers.onOpen ? 'button' : undefined}
        accessible
        aria-label={[o.title, meta, o.description, suggestion].filter(Boolean).join('. ')}
        accessibilityHint={handlers.onOpen ? 'Opens opportunity details' : undefined}
        disabled={!handlers.onOpen}
        onPress={() => handlers.onOpen?.(o.id)}
        style={({ pressed }) => [styles.body, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.head}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
            <Icon size={22} color={colors.accent} weight="bold" />
          </View>
          <View style={styles.headText}>
            <AppText variant="body-strong">{o.title}</AppText>
            {meta ? (
              <AppText variant="body-sm" tone="muted">
                {meta}
              </AppText>
            ) : null}
          </View>
        </View>
        {o.description ? <AppText tone="muted">{o.description}</AppText> : null}
        {suggestion && (
          <View style={[styles.suggestion, { backgroundColor: colors.surfaceMuted }]}>
            <Lightbulb size={18} color={colors.accent} weight="fill" />
            <AppText variant="body-strong" style={styles.flex}>
              {suggestion}
            </AppText>
          </View>
        )}
      </Pressable>
      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.slice(0, 2).map((a, i) => (
            <Button key={a.key} size="sm" block variant={i === 0 ? 'secondary' : 'ghost'} label={a.label} icon={a.icon} onPress={a.onPress} loading={a.loading} />
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  head: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  iconWrap: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  headText: { flex: 1, gap: spacing.xs },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
});

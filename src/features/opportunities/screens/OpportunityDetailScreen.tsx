import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowCounterClockwise, Bell, CalendarBlank, CheckCircle, CourtBasketball, Lightbulb, PlayCircle, Tag, User, XCircle } from 'phosphor-react-native';

import { OPPORTUNITY_STATUS, opportunityTypeMeta } from '@/domain/labels';
import type { Opportunity } from '@/domain/types';
import { useSendReminder } from '@/features/bookings/api';
import { recommendationText } from '@/features/dashboard/utils/dashboardFormatters';
import { facilityWallClock, formatDayAndTime, formatTime } from '@/lib/datetime';
import { formatClock, useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ConfirmDialog } from '@/ui/Dialogs';
import { TextField } from '@/ui/Fields';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useOpportunity, useOpportunityTransition } from '../api';

export function OpportunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useOpportunity(id);
  const [refreshing, setRefreshing] = useState(false);
  return (
    <>
      <Stack.Screen options={{ title: 'Opportunity' }} />
      <Screen
        keyboard
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await query.refetch();
          setRefreshing(false);
        }}
      >
        <QueryView query={query} errorTitle="Couldn't load opportunity">
          {(o) => <Body opportunity={o} />}
        </QueryView>
      </Screen>
    </>
  );
}

function Body({ opportunity: o }: { opportunity: Opportunity }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { can } = useSession();
  const f = useFormat();
  const transition = useOpportunityTransition(o.id);
  const remind = useSendReminder();
  const [dialog, setDialog] = useState<'resolve' | 'dismiss' | null>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string>();

  const type = opportunityTypeMeta(o.type);
  const Icon = type.icon;
  const status = OPPORTUNITY_STATUS[o.status];
  const closed = o.status === 'RESOLVED' || o.status === 'DISMISSED';
  const canManage = can('opportunity.manage');
  const suggestion = recommendationText(o.recommendedAction, (n) => f.money(n));
  const action = o.recommendedAction;

  const apply = (() => {
    if (!action || closed) return null;
    const window = action.window;
    switch (action.type) {
      case 'DISCOUNT':
        return can('pricing.manage')
          ? {
              label: 'Create this discount',
              icon: Tag,
              run: () =>
                router.push(
                  routes.discountNew({
                    courtId: o.courtId,
                    value: action.value !== undefined ? String(action.value) : undefined,
                    kind: action.unit === 'AMOUNT' ? 'AMOUNT' : 'PERCENT',
                    weekdays: window?.weekdays.join(','),
                    startTime: window?.startTime,
                    endTime: window?.endTime,
                    name: o.courtName ? `${o.courtName} off-peak` : 'Off-peak offer',
                    opportunityId: o.id,
                  }),
                ),
            }
          : null;
      case 'PRICE_INCREASE':
        return can('pricing.manage')
          ? {
              label: 'Add a peak rate',
              icon: Tag,
              run: () =>
                router.push(
                  routes.pricingRuleNew({
                    courtId: o.courtId,
                    weekdays: window?.weekdays.join(','),
                    startTime: window?.startTime,
                    endTime: window?.endTime,
                    name: 'Peak demand',
                    opportunityId: o.id,
                  }),
                ),
            }
          : null;
      case 'REMIND':
        return o.bookingId && can('payment.remind') ? { label: 'Send reminder', icon: Bell, run: () => remind.mutate(o.bookingId!) } : null;
      case 'CONTACT':
        return o.customerId && can('customer.view') ? { label: `Open ${o.customerName?.split(' ')[0] ?? 'customer'}'s profile`, icon: User, run: () => router.push(routes.customer(o.customerId!)) } : null;
      default:
        return null;
    }
  })();

  const window = o.startAt
    ? `${formatDayAndTime(o.startAt, f.timeZone, f.today())}${o.endAt ? ` - ${formatTime(o.endAt, f.timeZone)}` : ''}`
    : undefined;

  return (
    <>
      <Card>
        <View style={styles.head}>
          <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
            <Icon size={22} color={colors.accent} />
          </View>
          <AppText variant="label" tone="muted" style={styles.flex}>
            {type.label}
          </AppText>
          <StatusBadge label={status.label} tone={status.tone} />
        </View>
        <AppText variant="title" style={styles.title}>
          {o.title}
        </AppText>
        {o.description && <AppText tone="muted">{o.description}</AppText>}
        <AppText variant="caption" tone="subtle" style={styles.found}>
          Found {formatDayAndTime(o.createdAt, f.timeZone, f.today())}
        </AppText>
      </Card>

      {o.potentialRevenue ? (
        <Card tint="accent">
          <AppText variant="label" tone="muted">
            Revenue at stake
          </AppText>
          <AppText variant="title" numeric aria-label={f.moneyA11y(o.potentialRevenue)}>
            {f.money(o.potentialRevenue)}
          </AppText>
          <AppText variant="caption" tone="muted">
            CoyoteOS’s estimate for the next 4 weeks if acted on.
          </AppText>
        </Card>
      ) : null}

      {suggestion && (
        <View style={[styles.suggest, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.suggestHead}>
            <Lightbulb size={18} color={colors.accent} weight="fill" />
            <AppText variant="bodyStrong" style={styles.flex}>
              Recommended action
            </AppText>
          </View>
          <AppText>{suggestion.replace(/^Suggested: /, '').replace(/^./, (c) => c.toUpperCase())}.</AppText>
          {action?.window && (
            <AppText variant="caption" tone="muted">
              Applies {action.window.weekdays.length === 5 ? 'on weekdays' : 'on selected days'}, {formatClock(action.window.startTime)} - {formatClock(action.window.endTime)}.
            </AppText>
          )}
          {apply && (
            <View style={styles.applyRow}>
              <Button label={apply.label} icon={apply.icon} onPress={apply.run} loading={action?.type === 'REMIND' && remind.isPending} />
            </View>
          )}
        </View>
      )}

      {(o.courtId || o.bookingId || o.customerId) && (
        <ListGroup title="Related">
          {o.courtId && <ListRow icon={CourtBasketball} title={o.courtName ?? 'Court'} subtitle="Court details" onPress={() => router.push(routes.court(o.courtId!))} />}
          {o.courtId && window && o.startAt && (
            <ListRow icon={CalendarBlank} title={window} subtitle="Open this day in the calendar" onPress={() => router.push(routes.courtCalendar(o.courtId!, facilityWallClock(o.startAt!, f.timeZone).date))} />
          )}
          {o.bookingId && can('booking.view') && <ListRow icon={CalendarBlank} title={`Booking ${o.bookingReference ?? ''}`.trim()} subtitle="Booking details" onPress={() => router.push(routes.booking(o.bookingId!))} />}
          {o.customerId && can('customer.view') && <ListRow icon={User} title={o.customerName ?? 'Customer'} subtitle="Customer profile" onPress={() => router.push(routes.customer(o.customerId!))} />}
        </ListGroup>
      )}

      {o.resolution && (
        <Notice
          tone="info"
          icon={o.resolution.outcome === 'ACTIONED' ? CheckCircle : XCircle}
          title={o.resolution.outcome === 'ACTIONED' ? 'Resolved' : 'Dismissed'}
          message={`${o.resolution.note ? `${o.resolution.note} ` : ''}By ${o.resolution.by}, ${formatDayAndTime(o.resolution.at, f.timeZone, f.today())}.`}
        />
      )}

      {canManage && (
        <ListGroup title="Status">
          {o.status === 'OPEN' && <ListRow icon={PlayCircle} title="Start working on it" subtitle="Shows the team someone is on it" onPress={() => transition.mutate({ action: 'start' })} />}
          {!closed && <ListRow icon={CheckCircle} title="Mark as resolved" onPress={() => setDialog('resolve')} />}
          {!closed && <ListRow icon={XCircle} title="Dismiss" subtitle="Not relevant or not worth doing" onPress={() => setDialog('dismiss')} />}
          {closed && <ListRow icon={ArrowCounterClockwise} title="Reopen" onPress={() => transition.mutate({ action: 'reopen' })} />}
        </ListGroup>
      )}

      <ConfirmDialog
        visible={dialog !== null}
        title={dialog === 'resolve' ? 'Mark as resolved?' : 'Dismiss this opportunity?'}
        message={dialog === 'resolve' ? 'Add what you did so the team can see it later.' : "Say why, so it isn't raised again for the same reason."}
        confirmLabel={dialog === 'resolve' ? 'Resolve' : 'Dismiss'}
        cancelLabel="Back"
        loading={transition.isPending}
        onCancel={() => {
          setDialog(null);
          setNoteError(undefined);
        }}
        onConfirm={() => {
          if (dialog === 'dismiss' && !note.trim()) {
            setNoteError('Add a short reason.');
            return;
          }
          transition.mutate(
            { action: dialog === 'resolve' ? 'resolve' : 'dismiss', note: note.trim() || undefined },
            {
              onSuccess: () => {
                setDialog(null);
                setNote('');
              },
            },
          );
        }}
      >
        <TextField
          label={dialog === 'resolve' ? 'What did you do?' : 'Reason'}
          optional={dialog === 'resolve'}
          multiline
          value={note}
          onChangeText={(t) => {
            setNote(t);
            setNoteError(undefined);
          }}
          error={noteError}
          maxLength={300}
        />
      </ConfirmDialog>
    </>
  );
}


const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 40, height: 40, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  title: { marginTop: spacing.lg, marginBottom: spacing.sm },
  found: { marginTop: spacing.md },
  suggest: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg, gap: spacing.sm },
  suggestHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  applyRow: { marginTop: spacing.sm },
});

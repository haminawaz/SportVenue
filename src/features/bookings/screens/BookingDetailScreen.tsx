import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowsLeftRight,
  Bell,
  CalendarX,
  CheckCircle,
  Clock,
  CourtBasketball,
  NotePencil,
  Phone,
  Receipt,
  UserMinus,
} from 'phosphor-react-native';

import { BOOKING_STATUS, CANCEL_REASONS, PAYMENT_METHOD, PAYMENT_STATUS } from '@/domain/labels';
import type { BookingDetail, PaymentMethod } from '@/domain/types';
import { facilityWallClock, formatCalendarDate, formatDayAndTime, formatTime, minutesBetweenLocal, nowLocalIn } from '@/lib/datetime';
import { formatDuration, useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { useRecordPayment } from '@/features/payments/api';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ConfirmDialog } from '@/ui/Dialogs';
import { SwitchRow } from '@/ui/Fields';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { SelectField } from '@/ui/Select';
import { Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';
import { Timeline } from '@/ui/Timeline';

import { useBooking, useCancelBooking, useSendReminder, useSetBookingStatus } from '../api';

export function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useBooking(id);
  const [refreshing, setRefreshing] = useState(false);

  return (
    <>
      <Stack.Screen options={{ title: query.data?.reference ?? 'Booking' }} />
      <Screen
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await query.refetch();
          setRefreshing(false);
        }}
      >
        <QueryView query={query} errorTitle="Couldn't load booking">
          {(b) => <BookingBody booking={b} />}
        </QueryView>
      </Screen>
    </>
  );
}

function BookingBody({ booking: b }: { booking: BookingDetail }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { can } = useSession();
  const f = useFormat();
  const tz = f.timeZone;

  const [dialog, setDialog] = useState<'cancel' | 'paid' | 'noShow' | null>(null);
  const [reason, setReason] = useState<string | undefined>();
  const [reasonError, setReasonError] = useState<string>();
  const [refund, setRefund] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('CASH');

  const cancel = useCancelBooking(b.id);
  const setStatus = useSetBookingStatus(b.id);
  const remind = useSendReminder();
  const record = useRecordPayment();

  const clock = facilityWallClock(b.startAt, tz);
  const duration = minutesBetweenLocal(b.startAt, b.endAt);
  const status = BOOKING_STATUS[b.status];
  const pay = PAYMENT_STATUS[b.paymentStatus];
  const open = b.status === 'CONFIRMED' || b.status === 'PENDING';
  const started = b.startAt.slice(0, 16) <= nowLocalIn(tz).slice(0, 16);
  const canManage = can('booking.manage');

  return (
    <>
      <Card>
        <View style={styles.badges}>
          <StatusBadge label={status.label} tone={status.tone} />
          {(b.status !== 'CANCELLED' || b.paymentStatus === 'REFUNDED') && <StatusBadge label={pay.label} tone={pay.tone} />}
        </View>
        <AppText variant="title" style={styles.when}>
          {formatCalendarDate(clock.date)}
        </AppText>
        <AppText variant="heading" tone="muted" numeric>
          {formatTime(b.startAt, tz)} - {formatTime(b.endAt, tz)}
        </AppText>
        <View style={styles.metaRow}>
          <Meta icon={CourtBasketball} text={b.courtName} />
          <Meta icon={Clock} text={formatDuration(duration)} />
        </View>
      </Card>

      {b.status === 'CANCELLED' && <Notice tone="warning" title="Cancelled" message={b.cancelReason ? `Reason: ${b.cancelReason}` : 'This booking was cancelled.'} />}
      {b.status === 'NO_SHOW' && <Notice tone="danger" title="No-show" message="The customer did not arrive for this booking." />}

      <ListGroup title="Customer">
        <ListRow
          title={b.customerName}
          subtitle={b.customerPhone}
          leading={<Avatar name={b.customerName} />}
          onPress={can('customer.view') ? () => router.push(routes.customer(b.customerId)) : undefined}
          hint="Opens customer profile"
        />
        {!!b.customerPhone && <ListRow title="Call" icon={Phone} onPress={() => Linking.openURL(`tel:${b.customerPhone.replace(/\s/g, '')}`)} label={`Call ${b.customerName}`} />}
      </ListGroup>

      <View>
        <SectionHeader title="Payment" />
        <Card>
          <Line label="Court price" value={f.money(b.price)} />
          {b.discountAmount > 0 && <Line label={b.discountName ?? 'Discount'} value={`-${f.money(b.discountAmount)}`} tone="accent" />}
          <Line label="Total" value={f.money(b.total)} strong />
          <Line label="Paid" value={f.money(b.paid)} />
          {b.status !== 'CANCELLED' && (
            <View style={[styles.due, { borderTopColor: colors.border }]}>
              <AppText variant="bodyStrong" style={styles.flex}>
                {b.outstanding > 0 ? 'Still to pay' : 'Nothing to pay'}
              </AppText>
              <AppText variant="heading" numeric tone={b.outstanding > 0 ? 'warning' : 'accent'} aria-label={f.moneyA11y(b.outstanding)}>
                {f.money(b.outstanding)}
              </AppText>
            </View>
          )}
          {b.outstanding > 0 && (can('payment.record') || can('payment.remind')) && (
            <View style={styles.actions}>
              {can('payment.record') && <Button size="sm" label="Record payment" icon={Receipt} onPress={() => router.push(routes.recordPayment(b.id))} />}
              {can('payment.record') && <Button size="sm" variant="secondary" label="Mark as paid" icon={CheckCircle} onPress={() => setDialog('paid')} />}
              {can('payment.remind') && (
                <Button size="sm" variant="secondary" label="Remind" icon={Bell} loading={remind.isPending} onPress={() => remind.mutate(b.id)} aria-label={`Remind ${b.customerName} to pay`} />
              )}
            </View>
          )}
        </Card>
      </View>

      {b.payments.length > 0 && (
        <ListGroup title="Payments received">
          {b.payments.map((p) => (
            <ListRow
              key={p.id}
              title={f.money(p.amount)}
              subtitle={`${PAYMENT_METHOD[p.method].label} · ${formatDayAndTime(p.receivedAt, tz, f.today())}`}
              icon={PAYMENT_METHOD[p.method].icon}
              onPress={() => router.push(routes.payment(p.id))}
            />
          ))}
        </ListGroup>
      )}

      {b.notes && (
        <ListGroup title="Notes">
          <ListRow title={b.notes} titleLines={20} />
        </ListGroup>
      )}

      {canManage && b.status !== 'CANCELLED' && (
        <ListGroup title="Manage">
          {open && <ListRow title="Edit details" subtitle="Customer and notes" icon={NotePencil} onPress={() => router.push(routes.bookingEdit(b.id))} />}
          {open && <ListRow title="Reschedule" subtitle="Change court, day or time" icon={ArrowsLeftRight} onPress={() => router.push(routes.bookingReschedule(b.id))} />}
          {open && started && <ListRow title="Mark as completed" icon={CheckCircle} onPress={() => setStatus.mutate('COMPLETED')} />}
          {open && started && <ListRow title="Mark as no-show" icon={UserMinus} onPress={() => setDialog('noShow')} />}
          {b.status === 'NO_SHOW' && <ListRow title="Undo no-show" icon={CheckCircle} onPress={() => setStatus.mutate('COMPLETED')} />}
          {open && <ListRow title="Cancel booking" icon={CalendarX} destructive onPress={() => setDialog('cancel')} />}
        </ListGroup>
      )}

      <View>
        <SectionHeader title="History" />
        <Timeline items={b.history.map((h) => ({ id: h.id, title: h.description, meta: `${formatDayAndTime(h.at, tz, f.today())} · ${h.actor}` }))} />
      </View>

      <ConfirmDialog
        visible={dialog === 'cancel'}
        title="Cancel this booking?"
        message={`${b.customerName}, ${b.courtName}, ${formatCalendarDate(clock.date)} at ${formatTime(b.startAt, tz)}. The slot opens up for others.`}
        confirmLabel="Cancel booking"
        destructive
        loading={cancel.isPending}
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          if (!reason) {
            setReasonError('Choose a reason.');
            return;
          }
          cancel.mutate({ reason, refund }, { onSuccess: () => setDialog(null) });
        }}
      >
        <SelectField
          label="Reason"
          value={reason}
          error={reasonError}
          options={CANCEL_REASONS.map((r) => ({ value: r, label: r }))}
          onChange={(r) => {
            setReason(r);
            setReasonError(undefined);
          }}
        />
        {b.paid > 0 && (
          <View style={[styles.refund, { borderColor: colors.border }]}>
            <SwitchRow label="Mark payment as refunded" description={`${f.money(b.paid)} was paid. Turn on once you've returned it.`} value={refund} onChange={setRefund} />
          </View>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        visible={dialog === 'paid'}
        title="Mark as paid?"
        message={`This records ${f.money(b.outstanding)} from ${b.customerName} and closes the balance.`}
        confirmLabel="Record payment"
        cancelLabel="Not now"
        loading={record.isPending}
        onCancel={() => setDialog(null)}
        onConfirm={() => record.mutate({ bookingId: b.id, amount: b.outstanding, method }, { onSuccess: () => setDialog(null) })}
      >
        <SelectField
          label="Paid by"
          value={method}
          options={(Object.keys(PAYMENT_METHOD) as PaymentMethod[]).map((m) => ({ value: m, label: PAYMENT_METHOD[m].label }))}
          onChange={setMethod}
        />
      </ConfirmDialog>

      <ConfirmDialog
        visible={dialog === 'noShow'}
        title="Mark as no-show?"
        message={`${b.customerName} will have a no-show on their record. Any unpaid balance stays open.`}
        confirmLabel="Mark no-show"
        destructive
        loading={setStatus.isPending}
        onCancel={() => setDialog(null)}
        onConfirm={() => setStatus.mutate('NO_SHOW', { onSuccess: () => setDialog(null) })}
      />
    </>
  );
}

function Meta({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.meta}>
      <Icon size={16} color={colors.textMuted} />
      <AppText variant="label" tone="muted">
        {text}
      </AppText>
    </View>
  );
}

function Line({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'accent' }) {
  return (
    <View style={styles.line}>
      <AppText variant={strong ? 'bodyStrong' : 'body'} tone={strong ? 'default' : 'muted'} style={styles.flex}>
        {label}
      </AppText>
      <AppText variant={strong ? 'bodyStrong' : 'body'} numeric tone={tone}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', gap: spacing.xs + 2, flexWrap: 'wrap' },
  when: { marginTop: spacing.md },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  due: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.sm, paddingTop: spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  refund: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.control, marginTop: spacing.xs },
  flex: { flex: 1 },
});

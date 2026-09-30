import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarBlank, Receipt, User } from 'phosphor-react-native';

import { PAYMENT_METHOD, PAYMENT_STATUS } from '@/domain/labels';
import { useBooking } from '@/features/bookings/api';
import { formatDayAndTime } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { usePayment } from '../api';

export function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = usePayment(id);
  return (
    <>
      <Stack.Screen options={{ title: 'Payment' }} />
      <Screen>
        <QueryView query={query} errorTitle="Couldn't load payment">
          {(p) => <PaymentBody paymentId={p.id} />}
        </QueryView>
      </Screen>
    </>
  );
}

function PaymentBody({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const f = useFormat();
  const p = usePayment(paymentId).data!;
  const booking = useBooking(p.bookingId);
  const method = PAYMENT_METHOD[p.method];
  const Icon = method.icon;
  const b = booking.data;

  return (
    <>
      <Card>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <Icon size={24} color={colors.accent} />
        </View>
        <AppText variant="nav-link" tone="muted" style={styles.gapTop}>
          Received from {p.customerName}
        </AppText>
        <AppText variant="display-xl" numeric aria-label={f.moneyA11y(p.amount)} style={styles.amount}>
          {f.money(p.amount)}
        </AppText>
        <AppText tone="muted">{formatDayAndTime(p.receivedAt, f.timeZone, f.today())}</AppText>
      </Card>

      <ListGroup title="Details">
        <ListRow title="Method" value={method.label} />
        <ListRow title="Recorded by" value={p.recordedBy} />
        <ListRow title="Reference" value={p.id.toUpperCase()} />
        {p.note && <ListRow title="Note" subtitle={p.note} />}
      </ListGroup>

      <ListGroup title="Related">
        <ListRow
          icon={CalendarBlank}
          title={`Booking ${p.bookingReference}`}
          subtitle={b ? `${b.courtName} · ${formatDayAndTime(b.startAt, f.timeZone, f.today())}` : undefined}
          trailing={b ? <StatusBadge label={PAYMENT_STATUS[b.paymentStatus].label} tone={PAYMENT_STATUS[b.paymentStatus].tone} /> : undefined}
          onPress={() => router.push(routes.booking(p.bookingId))}
        />
        <ListRow icon={User} title={p.customerName} subtitle="Customer profile" onPress={() => router.push(routes.customer(p.customerId))} />
        <ListRow icon={Receipt} title="All payments from this customer" onPress={() => router.push(routes.customerPayments(p.customerId))} />
      </ListGroup>

      {b && b.outstanding > 0 && (
        <AppText variant="body-sm" tone="muted" style={styles.note}>
          {f.money(b.outstanding)} is still due on this booking.
        </AppText>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  icon: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  gapTop: { marginTop: spacing.lg },
  amount: { marginVertical: spacing.xs },
  note: { paddingHorizontal: spacing.xs },
});

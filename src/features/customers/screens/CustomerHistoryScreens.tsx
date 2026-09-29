import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { CalendarBlank, CurrencyCircleDollar, Receipt } from 'phosphor-react-native';

import { useBookings } from '@/features/bookings/api';
import { BookingRow } from '@/features/bookings/components/BookingRow';
import { usePayments } from '@/features/payments/api';
import { PaymentRow } from '@/features/payments/components/PaymentRow';
import { useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { spacing } from '@/theme/tokens';
import { EmptyState } from '@/ui/EmptyState';
import { InfiniteList } from '@/ui/InfiniteList';
import { MetricCard } from '@/ui/MetricCard';
import { useTileWidth } from '@/ui/surface';

import { useCustomer } from '../api';

/** Every booking a customer has made, newest first. */
export function CustomerBookingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const customer = useCustomer(id);
  const query = useBookings({ customerId: id, order: 'desc' });
  return (
    <>
      <Stack.Screen options={{ title: customer.data ? `${customer.data.name.split(' ')[0]}'s bookings` : 'Bookings' }} />
      <InfiniteList
        query={query}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <BookingRow booking={item} showCustomer={false} onPress={(bid) => router.push(routes.booking(bid))} />}
        empty={<EmptyState icon={CalendarBlank} title="No bookings yet" message="Bookings for this customer will show here." />}
      />
    </>
  );
}

/** Customer payment history with lifetime totals. */
export function CustomerPaymentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const f = useFormat();
  const customer = useCustomer(id);
  const query = usePayments({ customerId: id });
  const { half: tile } = useTileWidth();
  const c = customer.data;

  return (
    <>
      <Stack.Screen options={{ title: c ? `${c.name.split(' ')[0]}'s payments` : 'Payments' }} />
      <InfiniteList
        query={query}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PaymentRow payment={item} showCustomer={false} onPress={(pid) => router.push(routes.payment(pid))} />}
        header={
          c ? (
            <View style={styles.tiles}>
              <MetricCard width={tile} icon={CurrencyCircleDollar} label="Total paid" value={f.tileMoney(c.totalSpent)} valueA11y={f.moneyA11y(c.totalSpent)} tint="accent" />
              <MetricCard width={tile} icon={Receipt} label="Still owed" value={f.tileMoney(c.outstanding)} valueA11y={f.moneyA11y(c.outstanding)} tint={c.outstanding > 0 ? 'warning' : 'surface'} />
            </View>
          ) : undefined
        }
        empty={<EmptyState icon={Receipt} title="No payments yet" message="Payments recorded against this customer's bookings appear here." />}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: 12, marginBottom: spacing.xs },
});

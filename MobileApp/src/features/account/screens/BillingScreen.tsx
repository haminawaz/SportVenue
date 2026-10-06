import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { CreditCard, Receipt } from 'phosphor-react-native';

import type { Subscription } from '@/domain/types';
import { BarList } from '@/features/dashboard/components/Charts';
import { formatCalendarDate } from '@/lib/datetime';
import { formatMoney } from '@/lib/money';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useSubscription } from '../api';

const STATUS: Record<Subscription['status'], { label: string; tone: 'positive' | 'warning' | 'danger' | 'neutral' }> = {
  ACTIVE: { label: 'Active', tone: 'positive' },
  TRIALING: { label: 'Trial', tone: 'positive' },
  PAST_DUE: { label: 'Payment due', tone: 'danger' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

export function BillingScreen() {
  const query = useSubscription();
  return (
    <>
      <Stack.Screen options={{ title: 'Subscription' }} />
      <Screen>
        <QueryView query={query} errorTitle="Couldn't load your subscription">
          {(s) => {
            const status = STATUS[s.status];
            const money = (n: number) => formatMoney(n, s.currency);
            return (
              <>
                <Card tint="accent">
                  <View style={styles.head}>
                    <AppText variant="nav-link" tone="muted" style={styles.flex}>
                      Current plan
                    </AppText>
                    <StatusBadge label={status.label} tone={status.tone} />
                  </View>
                  <AppText variant="display-lg">{s.plan}</AppText>
                  <AppText numeric>
                    {money(s.price)} per {s.interval === 'MONTH' ? 'month' : 'year'} · renews {formatCalendarDate(s.renewsOn)}
                  </AppText>
                </Card>
                {s.status === 'PAST_DUE' && <Notice tone="danger" title="Payment failed" message="Update your card to keep bookings running." />}

                <Card>
                  <AppText variant="nav-link" tone="muted" style={styles.gap}>
                    Usage
                  </AppText>
                  <BarList
                    max={1}
                    data={[
                      { key: 'courts', label: 'Courts', value: s.courtsUsed / s.courtsLimit, valueLabel: `${s.courtsUsed} of ${s.courtsLimit}` },
                    ]}
                  />
                </Card>

                <ListGroup title="Payment method">
                  {s.paymentMethod ? (
                    <ListRow icon={CreditCard} title={`${s.paymentMethod.brand} ending ${s.paymentMethod.last4}`} subtitle={`Expires ${s.paymentMethod.expires}`} />
                  ) : (
                    <ListRow icon={CreditCard} title="No card on file" />
                  )}
                </ListGroup>

                <ListGroup title="Invoices">
                  {s.invoices.map((inv) => (
                    <ListRow
                      key={inv.id}
                      icon={Receipt}
                      title={formatCalendarDate(inv.date)}
                      value={money(inv.amount)}
                      valueTone="default"
                      trailing={<StatusBadge label={inv.status === 'PAID' ? 'Paid' : inv.status === 'OPEN' ? 'Open' : 'Failed'} tone={inv.status === 'PAID' ? 'positive' : inv.status === 'OPEN' ? 'warning' : 'danger'} />}
                    />
                  ))}
                </ListGroup>

                <Notice message="Plan changes and card updates are made in the SportVenue web dashboard." />
              </>
            );
          }}
        </QueryView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  flex: { flex: 1 },
  gap: { marginBottom: spacing.md },
});

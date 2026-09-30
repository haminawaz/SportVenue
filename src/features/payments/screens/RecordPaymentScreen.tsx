import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle } from 'phosphor-react-native';

import { PAYMENT_METHOD } from '@/domain/labels';
import type { BookingDetail, PaymentMethod } from '@/domain/types';
import { useBooking } from '@/features/bookings/api';
import { formatDayAndTime } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { parseMoney, rules, useForm } from '@/lib/useForm';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip, ChipRow, SegmentedControl } from '@/ui/Chips';
import { EmptyState } from '@/ui/EmptyState';
import { FieldShell, TextField } from '@/ui/Fields';
import { Screen } from '@/ui/Screen';
import { QueryView } from '@/ui/States';

import { useRecordPayment } from '../api';

export function RecordPaymentScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const query = useBooking(bookingId);
  return (
    <>
      <Stack.Screen options={{ title: 'Record payment' }} />
      <QueryView query={query} errorTitle="Couldn't load booking">
        {(b) => <RecordForm booking={b} />}
      </QueryView>
    </>
  );
}

type Values = { mode: 'full' | 'partial'; amount: string; method?: PaymentMethod; note: string };

function RecordForm({ booking: b }: { booking: BookingDetail }) {
  const router = useRouter();
  const f = useFormat();
  const record = useRecordPayment();
  const [saving, setSaving] = useState(false);
  const due = b.outstanding;

  const form = useForm<Values>(
    { mode: 'full', amount: String(due), method: 'CASH', note: '' },
    useCallback(
      (v: Values) => {
        const amount = parseMoney(v.amount);
        return {
          amount: rules.money(v.amount) ?? (amount > due ? `The balance is ${f.money(due)}. Enter that amount or less.` : undefined),
          method: v.method ? undefined : 'Choose how they paid.',
        };
      },
      [due, f],
    ),
  );

  if (due <= 0 || b.status === 'CANCELLED') {
    return (
      <Screen>
        <EmptyState icon={CheckCircle} title={b.status === 'CANCELLED' ? 'Booking cancelled' : 'Already paid'} message={b.status === 'CANCELLED' ? 'Payments cannot be recorded on a cancelled booking.' : `${b.customerName} has paid this booking in full.`} action={<Button label="Back to booking" variant="secondary" onPress={() => router.back()} />} />
      </Screen>
    );
  }

  const amount = parseMoney(form.values.amount);
  const remaining = Number.isNaN(amount) ? due : Math.max(0, Math.round((due - amount) * 100) / 100);

  const save = async () => {
    setSaving(true);
    const ok = await form.submit((v) => record.mutateAsync({ bookingId: b.id, amount: parseMoney(v.amount), method: v.method!, note: v.note.trim() || undefined }));
    setSaving(false);
    if (ok) router.back();
  };

  return (
    <Screen keyboard footer={<Button label={form.values.mode === 'full' ? 'Record full payment' : 'Record payment'} block onPress={save} loading={saving} />}>
      <Card>
        <View style={styles.who}>
          <Avatar name={b.customerName} />
          <View style={styles.flex}>
            <AppText variant="body-strong">{b.customerName}</AppText>
            <AppText variant="body-sm" tone="muted">
              {b.reference} · {b.courtName} · {formatDayAndTime(b.startAt, f.timeZone, f.today())}
            </AppText>
          </View>
        </View>
        <View style={styles.sums}>
          <Sum label="Total" value={f.money(b.total)} />
          <Sum label="Paid" value={f.money(b.paid)} />
          <Sum label="Due" value={f.money(due)} strong />
        </View>
      </Card>

      <FieldShell label="Payment">
        <SegmentedControl
          label="Payment type"
          value={form.values.mode}
          onChange={(mode) => form.patch({ mode, amount: mode === 'full' ? String(due) : '' })}
          options={[
            { value: 'full', label: 'Full balance' },
            { value: 'partial', label: 'Part payment' },
          ]}
        />
      </FieldShell>

      <TextField
        label="Amount received"
        value={form.values.amount}
        onChangeText={(t) => form.patch({ amount: t, mode: parseMoney(t) === due ? 'full' : 'partial' })}
        error={form.errors.amount}
        keyboardType="decimal-pad"
        prefix={f.currency}
        helper={!Number.isNaN(amount) && amount > 0 && amount <= due ? (remaining > 0 ? `${f.money(remaining)} will still be due.` : 'This settles the booking.') : undefined}
      />

      <FieldShell label="Paid by" error={form.errors.method}>
        <ChipRow bleed={false}>
          {(Object.keys(PAYMENT_METHOD) as PaymentMethod[]).map((m) => (
            <Chip key={m} label={PAYMENT_METHOD[m].label} icon={PAYMENT_METHOD[m].icon} selected={form.values.method === m} onPress={() => form.set('method', m)} />
          ))}
        </ChipRow>
      </FieldShell>

      <TextField label="Note" optional multiline value={form.values.note} onChangeText={(t) => form.set('note', t)} placeholder="For example: transfer reference" maxLength={300} />
    </Screen>
  );
}

function Sum({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.sum}>
      <AppText variant="body-sm" tone="muted">
        {label}
      </AppText>
      <AppText variant={strong ? 'body-strong' : 'body-md'} tone={strong ? 'warning' : 'default'} numeric numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  who: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  sums: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  sum: { flex: 1, gap: spacing.xxs },
});

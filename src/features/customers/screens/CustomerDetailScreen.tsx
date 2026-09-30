import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowCounterClockwise, CalendarPlus, CalendarCheck, CurrencyCircleDollar, Envelope, PencilSimple, Phone, Prohibit, Receipt, Repeat, Trash } from 'phosphor-react-native';

import type { CustomerDetail } from '@/domain/types';
import { BookingRow } from '@/features/bookings/components/BookingRow';
import { useBookings } from '@/features/bookings/api';
import { PaymentRow } from '@/features/payments/components/PaymentRow';
import { usePayments } from '@/features/payments/api';
import { formatDayAndTime } from '@/lib/datetime';
import { formatClock, formatDuration, useFormat, WEEKDAY_LONG } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ConfirmDialog } from '@/ui/Dialogs';
import { TextField } from '@/ui/Fields';
import { IconButton } from '@/ui/IconButton';
import { ListGroup, ListRow } from '@/ui/List';
import { MetricCard } from '@/ui/MetricCard';
import { Screen } from '@/ui/Screen';
import { useTileWidth } from '@/ui/surface';
import { SectionHeader } from '@/ui/SectionHeader';
import { ListSkeleton, Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useAddNote, useCustomer, useDeleteCustomer, useDeleteNote, useSetCustomerStatus } from '../api';

export function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = useCustomer(id);
  const [refreshing, setRefreshing] = useState(false);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Customer',
          headerRight: () => <IconButton icon={PencilSimple} label="Edit customer" onPress={() => router.push(routes.customerEdit(id))} />,
        }}
      />
      <Screen
        keyboard
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await query.refetch();
          setRefreshing(false);
        }}
      >
        <QueryView query={query} errorTitle="Couldn't load customer">
          {(c) => <CustomerBody customer={c} />}
        </QueryView>
      </Screen>
    </>
  );
}

function CustomerBody({ customer: c }: { customer: CustomerDetail }) {
  const router = useRouter();
  const { colors } = useTheme();
  const f = useFormat();
  const { half: tile, full: fullTile } = useTileWidth();
  const bookings = useBookings({ customerId: c.id, order: 'desc' });
  const payments = usePayments({ customerId: c.id });
  const addNote = useAddNote(c.id);
  const deleteNote = useDeleteNote(c.id);
  const setStatus = useSetCustomerStatus(c.id);
  const remove = useDeleteCustomer();
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string>();
  const [dialog, setDialog] = useState<'deactivate' | 'delete' | { note: string } | null>(null);
  const recent = bookings.data?.pages[0]?.items.slice(0, 4) ?? [];
  const recentPayments = payments.data?.pages[0]?.items.slice(0, 4) ?? [];
  const inactive = c.status === 'INACTIVE';

  return (
    <>
      <Card>
        <View style={styles.profile}>
          <Avatar name={c.name} size={60} tone="accent" />
          <View style={styles.flex}>
            <AppText variant="display-lg">{c.name}</AppText>
            <View style={styles.badges}>
              {c.isRegular && <StatusBadge label="Regular" tone="positive" />}
              {inactive && <StatusBadge label="Inactive" tone="neutral" />}
              <AppText variant="body-sm" tone="muted">
                Customer since {c.createdAt.slice(0, 4)}
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <Button size="sm" variant="secondary" label="Call" icon={Phone} onPress={() => Linking.openURL(`tel:${c.phone.replace(/\s/g, '')}`)} aria-label={`Call ${c.name}`} />
          {!inactive && <Button size="sm" label="New booking" icon={CalendarPlus} onPress={() => router.push(routes.bookingNew({ customerId: c.id }))} />}
        </View>
      </Card>

      {inactive && <Notice tone="warning" title="Inactive customer" message="They can't be booked until reactivated. Their history is kept." />}

      <View style={styles.tiles}>
        <MetricCard width={tile} icon={CalendarCheck} label="Bookings" value={String(c.totalBookings)} supporting={c.cancellations || c.noShows ? `${c.cancellations} cancelled, ${c.noShows} no-show` : 'No cancellations'} />
        <MetricCard width={tile} icon={CurrencyCircleDollar} label="Total paid" value={f.tileMoney(c.totalSpent)} valueA11y={f.moneyA11y(c.totalSpent)} tint="accent" />
        <MetricCard
          width={fullTile}
          icon={Receipt}
          label="Outstanding balance"
          value={f.money(c.outstanding)}
          valueA11y={f.moneyA11y(c.outstanding)}
          tint={c.outstanding > 0 ? 'warning' : 'surface'}
          supporting={c.outstanding > 0 ? 'Across unpaid bookings. See payments below.' : 'All paid up'}
        />
      </View>

      <ListGroup title="Contact">
        <ListRow title={c.phone} icon={Phone} onPress={() => Linking.openURL(`tel:${c.phone.replace(/\s/g, '')}`)} label={`Phone ${c.phone}. Call`} />
        {c.email ? <ListRow title={c.email} icon={Envelope} onPress={() => Linking.openURL(`mailto:${c.email}`)} label={`Email ${c.email}`} /> : <ListRow title="No email on file" icon={Envelope} />}
      </ListGroup>

      {c.isRegular && (
        <ListGroup title="Regular booking" footer="Regular customers keep this slot each week. Book it from the calendar.">
          {c.regularSlot ? (
            <ListRow
              icon={Repeat}
              title={`Every ${WEEKDAY_LONG[c.regularSlot.weekday]}, ${formatClock(c.regularSlot.startTime)}`}
              subtitle={`${c.regularSlot.courtName} · ${formatDuration(c.regularSlot.durationMinutes)}`}
              onPress={() => router.push(routes.court(c.regularSlot!.courtId))}
            />
          ) : (
            <ListRow icon={Repeat} title="Regular, no fixed slot" subtitle="Add one from Edit." />
          )}
        </ListGroup>
      )}

      <View>
        <SectionHeader title="Notes" count={c.notes.length} />
        <View style={styles.notes}>
          <View style={styles.noteInput}>
            <TextField
              label="Add a note"
              multiline
              value={note}
              onChangeText={(t) => {
                setNote(t);
                setNoteError(undefined);
              }}
              placeholder="For example: prefers evening slots"
              error={noteError}
              maxLength={1000}
            />
            <Button
              size="sm"
              label="Save note"
              loading={addNote.isPending}
              onPress={() => {
                if (!note.trim()) {
                  setNoteError('Write a note first.');
                  return;
                }
                addNote.mutate(note.trim(), { onSuccess: () => setNote('') });
              }}
            />
          </View>
          {c.notes.length === 0 ? (
            <AppText tone="muted">No notes yet.</AppText>
          ) : (
            c.notes.map((n) => (
              <View key={n.id} style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <AppText>{n.body}</AppText>
                <View style={styles.noteMeta}>
                  <AppText variant="body-sm" tone="muted" style={styles.flex}>
                    {n.author} · {formatDayAndTime(n.createdAt, f.timeZone, f.today())}
                  </AppText>
                  <IconButton icon={Trash} label="Delete note" onPress={() => setDialog({ note: n.id })} />
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <View>
        <SectionHeader title="Bookings" onLink={() => router.push(routes.customerBookings(c.id))} />
        {bookings.isPending ? (
          <ListSkeleton rows={3} withAvatar={false} />
        ) : recent.length === 0 ? (
          <AppText tone="muted">No bookings yet.</AppText>
        ) : (
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {recent.map((b, i) => (
              <View key={b.id} style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
                <BookingRow booking={b} showCustomer={false} onPress={(id) => router.push(routes.booking(id))} />
              </View>
            ))}
          </View>
        )}
      </View>

      <View>
        <SectionHeader title="Payments" onLink={() => router.push(routes.customerPayments(c.id))} />
        {payments.isPending ? (
          <ListSkeleton rows={3} withAvatar={false} />
        ) : recentPayments.length === 0 ? (
          <AppText tone="muted">No payments recorded.</AppText>
        ) : (
          <ListGroup>
            {recentPayments.map((p) => (
              <PaymentRow key={p.id} payment={p} showCustomer={false} onPress={(id) => router.push(routes.payment(id))} />
            ))}
          </ListGroup>
        )}
      </View>

      <ListGroup title="Manage">
        {inactive ? (
          <ListRow title="Reactivate customer" icon={ArrowCounterClockwise} onPress={() => setStatus.mutate('ACTIVE')} />
        ) : (
          <ListRow title="Deactivate customer" subtitle="Stop new bookings, keep history" icon={Prohibit} onPress={() => setDialog('deactivate')} />
        )}
        <ListRow title="Delete customer" icon={Trash} destructive onPress={() => setDialog('delete')} />
      </ListGroup>

      <ConfirmDialog
        visible={dialog === 'deactivate'}
        title={`Deactivate ${c.name}?`}
        message={c.outstanding > 0 ? `They still owe ${f.money(c.outstanding)}. Balances stay open after deactivation.` : 'They will not appear when making new bookings. You can reactivate them any time.'}
        confirmLabel="Deactivate"
        destructive
        loading={setStatus.isPending}
        onCancel={() => setDialog(null)}
        onConfirm={() => setStatus.mutate('INACTIVE', { onSuccess: () => setDialog(null) })}
      />
      <ConfirmDialog
        visible={dialog === 'delete'}
        title={`Delete ${c.name}?`}
        message="This can't be undone. Customers with bookings on record can't be deleted; deactivate them instead."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onCancel={() => setDialog(null)}
        onConfirm={() => remove.mutate(c.id, { onSuccess: () => router.back(), onSettled: () => setDialog(null) })}
      />
      <ConfirmDialog
        visible={typeof dialog === 'object' && dialog !== null}
        title="Delete this note?"
        confirmLabel="Delete"
        destructive
        loading={deleteNote.isPending}
        onCancel={() => setDialog(null)}
        onConfirm={() => typeof dialog === 'object' && dialog && deleteNote.mutate(dialog.note, { onSettled: () => setDialog(null) })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  flex: { flex: 1 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs, flexWrap: 'wrap' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  notes: { gap: spacing.sm },
  noteInput: { gap: spacing.sm, alignItems: 'flex-start', marginBottom: spacing.sm },
  note: { borderRadius: radius.control, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, gap: spacing.xs },
  noteMeta: { flexDirection: 'row', alignItems: 'center', marginRight: -spacing.sm, marginBottom: -spacing.sm },
  group: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});

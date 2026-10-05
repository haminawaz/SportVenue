'use client';

import { useState } from 'react';
import { ArrowCounterClockwise, CalendarCheck, CalendarPlus, CurrencyCircleDollar, Envelope, PencilSimple, Phone, Prohibit, Receipt, Repeat, Trash } from '@phosphor-icons/react';

import type { CustomerDetail } from '@/domain/types';
import { useBookings } from '@/features/bookings/api';
import { BookingRow } from '@/features/bookings/components/BookingRow';
import { usePayments } from '@/features/payments/api';
import { PaymentRow } from '@/features/payments/components/PaymentRow';
import { formatDayAndTime } from '@/lib/datetime';
import { formatClock, formatDuration, useFormat, WEEKDAY_LONG } from '@/lib/format';
import { useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ConfirmDialog } from '@/ui/Dialogs';
import { TextField } from '@/ui/Fields';
import { IconButton } from '@/ui/IconButton';
import { ListGroup, ListRow } from '@/ui/List';
import { MetricCard, MetricGrid } from '@/ui/MetricCard';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { StackHeader } from '@/ui/StackHeader';
import { ListSkeleton, Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useAddNote, useCustomer, useDeleteCustomer, useDeleteNote, useSetCustomerStatus } from '../api';

export function CustomerDetailScreen() {
  const id = useRouteParam('id');
  const router = useAppRouter();
  const query = useCustomer(id);

  return (
    <>
      <StackHeader title="Customer" headerRight={<IconButton icon={PencilSimple} label="Edit customer" size="sm" onPress={() => router.push(routes.customerEdit(id))} />} />
      <Screen onRefresh={() => query.refetch()}>
        <QueryView query={query} errorTitle="Couldn't load customer">
          {(c) => <CustomerBody customer={c} />}
        </QueryView>
      </Screen>
    </>
  );
}

function CustomerBody({ customer: c }: { customer: CustomerDetail }) {
  const router = useAppRouter();
  const f = useFormat();
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
  const tel = `tel:${c.phone.replace(/\s/g, '')}`;

  return (
    <>
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={c.name} size={60} tone="accent" />
          <div className="flex min-w-0 flex-1 flex-col">
            <AppText as="h2" variant="display-lg">
              {c.name}
            </AppText>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {c.isRegular && <StatusBadge label="Regular" tone="positive" />}
              {inactive && <StatusBadge label="Inactive" tone="neutral" />}
              <AppText variant="body-sm" tone="muted">
                Customer since {c.createdAt.slice(0, 4)}
              </AppText>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={tel}
            aria-label={`Call ${c.name}`}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-control border-[1.5px] border-text bg-surface px-3 text-text transition-opacity hover:opacity-90 active:opacity-80"
          >
            <Phone size={16} weight="bold" aria-hidden />
            <AppText variant="nav-link" className="text-current">
              Call
            </AppText>
          </a>
          {!inactive && <Button size="sm" label="New booking" icon={CalendarPlus} onPress={() => router.push(routes.bookingNew({ customerId: c.id }))} />}
        </div>
      </Card>

      {inactive && <Notice tone="warning" title="Inactive customer" message="They can't be booked until reactivated. Their history is kept." />}

      <MetricGrid>
        <MetricCard icon={CalendarCheck} label="Bookings" value={String(c.totalBookings)} supporting={c.cancellations || c.noShows ? `${c.cancellations} cancelled, ${c.noShows} no-show` : 'No cancellations'} />
        <MetricCard icon={CurrencyCircleDollar} label="Total paid" value={f.tileMoney(c.totalSpent)} valueA11y={f.moneyA11y(c.totalSpent)} tint="accent" />
        <MetricCard
          span="full"
          icon={Receipt}
          label="Outstanding balance"
          value={f.money(c.outstanding)}
          valueA11y={f.moneyA11y(c.outstanding)}
          tint={c.outstanding > 0 ? 'warning' : 'surface'}
          supporting={c.outstanding > 0 ? 'Across unpaid bookings. See payments below.' : 'All paid up'}
        />
      </MetricGrid>

      <ListGroup title="Contact">
        <ListRow title={c.phone} icon={Phone} href={tel} label={`Phone ${c.phone}. Call`} />
        {c.email ? <ListRow title={c.email} icon={Envelope} href={`mailto:${c.email}`} label={`Email ${c.email}`} /> : <ListRow title="No email on file" icon={Envelope} />}
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

      <section>
        <SectionHeader title="Notes" count={c.notes.length} />
        <div className="flex flex-col gap-2">
          <div className="mb-2 flex flex-col items-start gap-2">
            <div className="w-full">
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
            </div>
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
          </div>
          {c.notes.length === 0 ? (
            <AppText tone="muted">No notes yet.</AppText>
          ) : (
            c.notes.map((n) => (
              <div key={n.id} className="flex flex-col gap-1 rounded-control border border-border bg-surface p-3">
                <AppText className="whitespace-pre-line">{n.body}</AppText>
                <div className="-mr-2 -mb-2 flex items-center">
                  <AppText variant="body-sm" tone="muted" className="flex-1">
                    {n.author} · {formatDayAndTime(n.createdAt, f.timeZone, f.today())}
                  </AppText>
                  <IconButton icon={Trash} label="Delete note" onPress={() => setDialog({ note: n.id })} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <SectionHeader title="Bookings" onLink={() => router.push(routes.customerBookings(c.id))} />
        {bookings.isPending ? (
          <ListSkeleton rows={3} withAvatar={false} />
        ) : recent.length === 0 ? (
          <AppText tone="muted">No bookings yet.</AppText>
        ) : (
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {recent.map((b, i) => (
              <div key={b.id} className={i > 0 ? 'border-t border-border' : undefined}>
                <BookingRow booking={b} showCustomer={false} onPress={(id) => router.push(routes.booking(id))} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
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
      </section>

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
        onConfirm={() => remove.mutate(c.id, { onSuccess: () => router.back(routes.customers), onSettled: () => setDialog(null) })}
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

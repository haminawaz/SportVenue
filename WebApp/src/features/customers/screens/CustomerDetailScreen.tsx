'use client';

import { useMemo, useState } from 'react';
import { ArrowCounterClockwise, CalendarCheck, CalendarPlus, CurrencyCircleDollar, Envelope, PencilSimple, Phone, Prohibit, Receipt, Repeat, Trash } from '@phosphor-icons/react';
import Link from 'next/link';

import { PAYMENT_METHOD } from '@/domain/labels';
import type { CustomerDetail } from '@/domain/types';
import { useBookings } from '@/features/bookings/api';
import { bookingColumns, bookingRowLabel } from '@/features/bookings/components/bookingColumns';
import { usePayments } from '@/features/payments/api';
import { formatDayAndTime } from '@/lib/datetime';
import { formatClock, formatDuration, useFormat, WEEKDAY_LONG } from '@/lib/format';
import { useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { DataTable } from '@/ui/DataTable';
import { ConfirmDialog } from '@/ui/Dialogs';
import { EmptyState } from '@/ui/EmptyState';
import { TextField } from '@/ui/Fields';
import { IconButton } from '@/ui/IconButton';
import { Menu } from '@/ui/Menu';
import { DetailLayout, Page, PageHeader } from '@/ui/Page';
import { StatCard, StatGrid } from '@/ui/StatCard';
import { ListSkeleton, Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useAddNote, useCustomer, useDeleteCustomer, useDeleteNote, useSetCustomerStatus } from '../api';

export function CustomerDetailScreen() {
  const id = useRouteParam('id');
  const query = useCustomer(id);
  return (
    <Page onRefresh={() => query.refetch()}>
      <QueryView query={query} errorTitle="Couldn't load customer">
        {(c) => <CustomerBody customer={c} />}
      </QueryView>
    </Page>
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
  const recent = bookings.data?.pages[0]?.items.slice(0, 5) ?? [];
  const recentPayments = payments.data?.pages[0]?.items.slice(0, 5) ?? [];
  const inactive = c.status === 'INACTIVE';
  const tel = `tel:${c.phone.replace(/\s/g, '')}`;
  const columns = useMemo(() => bookingColumns(f, { showCustomer: false }), [f]);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Customers', href: routes.customers }, { label: c.name }]}
        leading={<Avatar name={c.name} size={56} tone="accent" />}
        title={c.name}
        meta={
          <div className="flex gap-1.5">
            {c.isRegular && <StatusBadge label="Regular" tone="positive" />}
            {inactive && <StatusBadge label="Inactive" tone="neutral" />}
          </div>
        }
        description={`Customer since ${c.createdAt.slice(0, 4)} · ${c.phone}`}
        actions={
          <>
            <a href={tel} aria-label={`Call ${c.name}`} className="t-text-strong inline-flex h-9 items-center gap-2 rounded-control border border-border-strong bg-surface px-3.5 hover:bg-surface-muted">
              <Phone size={16} weight="bold" aria-hidden />
              Call
            </a>
            <Button label="Edit" icon={PencilSimple} variant="secondary" onPress={() => router.push(routes.customerEdit(c.id))} />
            {!inactive && <Button label="New booking" icon={CalendarPlus} onPress={() => router.push(routes.bookingNew({ customerId: c.id }))} />}
            <Menu
              label="More customer actions"
              actions={[
                inactive
                  ? { key: 'reactivate', label: 'Reactivate customer', icon: ArrowCounterClockwise, onSelect: () => setStatus.mutate('ACTIVE') }
                  : { key: 'deactivate', label: 'Deactivate customer', description: 'Stop new bookings, keep history', icon: Prohibit, onSelect: () => setDialog('deactivate') },
                { key: 'delete', label: 'Delete customer', icon: Trash, destructive: true, onSelect: () => setDialog('delete') },
              ]}
            />
          </>
        }
      />

      {inactive && <Notice tone="warning" title="Inactive customer" message="They can't be booked until reactivated. Their history is kept." />}

      <StatGrid columns={3}>
        <StatCard icon={CalendarCheck} label="Bookings" value={String(c.totalBookings)} supporting={c.cancellations || c.noShows ? `${c.cancellations} cancelled, ${c.noShows} no-show` : 'No cancellations'} />
        <StatCard icon={CurrencyCircleDollar} label="Total paid" value={f.tileMoney(c.totalSpent)} valueA11y={f.moneyA11y(c.totalSpent)} />
        <StatCard
          icon={Receipt}
          label="Outstanding balance"
          value={f.money(c.outstanding)}
          valueA11y={f.moneyA11y(c.outstanding)}
          tint={c.outstanding > 0 ? 'warning' : 'surface'}
          supporting={c.outstanding > 0 ? 'Across unpaid bookings' : 'All paid up'}
        />
      </StatGrid>

      <DetailLayout
        main={
          <>
            <Card padded={false}>
              <CardHeader title="Recent bookings" actions={<Button label="All bookings" variant="ghost" size="sm" onPress={() => router.push(routes.customerBookings(c.id))} />} />
              {bookings.isPending ? (
                <ListSkeleton rows={3} />
              ) : recent.length === 0 ? (
                <EmptyState compact icon={CalendarCheck} title="No bookings yet" />
              ) : (
                <DataTable caption={`Recent bookings for ${c.name}`} rows={recent} columns={columns} rowKey={(b) => b.id} rowHref={(b) => routes.booking(b.id)} rowLabel={(b) => bookingRowLabel(f, b)} muted={(b) => b.status === 'CANCELLED'} dense />
              )}
            </Card>
            <Card padded={false}>
              <CardHeader title="Recent payments" actions={<Button label="All payments" variant="ghost" size="sm" onPress={() => router.push(routes.customerPayments(c.id))} />} />
              {payments.isPending ? (
                <ListSkeleton rows={3} />
              ) : recentPayments.length === 0 ? (
                <EmptyState compact icon={Receipt} title="No payments recorded" />
              ) : (
                <DataTable
                  caption={`Recent payments from ${c.name}`}
                  rows={recentPayments}
                  rowKey={(p) => p.id}
                  rowHref={(p) => routes.payment(p.id)}
                  dense
                  columns={[
                    { key: 'when', header: 'Received', primary: true, cell: (p) => <span className="whitespace-nowrap">{formatDayAndTime(p.receivedAt, f.timeZone, f.today())}</span> },
                    { key: 'booking', header: 'Booking', hideBelow: 'sm', cell: (p) => <span className="text-text-muted">{p.bookingReference}</span> },
                    { key: 'method', header: 'Method', hideBelow: 'md', cell: (p) => PAYMENT_METHOD[p.method].label },
                    { key: 'amount', header: 'Amount', align: 'right', cell: (p) => <span className="t-text-strong">{f.money(p.amount)}</span> },
                  ]}
                />
              )}
            </Card>
          </>
        }
        side={
          <>
            <Card padded={false}>
              <CardHeader title="Contact" />
              <ul className="flex flex-col p-2">
                <li>
                  <a href={tel} aria-label={`Phone ${c.phone}. Call`} className="flex items-center gap-3 rounded-control px-3 py-2 hover:bg-surface-muted">
                    <Phone size={17} className="text-text-muted" aria-hidden />
                    <AppText variant="text" numeric>
                      {c.phone}
                    </AppText>
                  </a>
                </li>
                <li>
                  {c.email ? (
                    <a href={`mailto:${c.email}`} aria-label={`Email ${c.email}`} className="flex items-center gap-3 rounded-control px-3 py-2 hover:bg-surface-muted">
                      <Envelope size={17} className="text-text-muted" aria-hidden />
                      <AppText variant="text" lines={1}>
                        {c.email}
                      </AppText>
                    </a>
                  ) : (
                    <span className="flex items-center gap-3 px-3 py-2">
                      <Envelope size={17} className="text-text-subtle" aria-hidden />
                      <AppText variant="text" tone="subtle">
                        No email on file
                      </AppText>
                    </span>
                  )}
                </li>
              </ul>
            </Card>

            {c.isRegular && (
              <Card padded={false}>
                <CardHeader title="Regular booking" description="Regular customers keep this slot each week. Book it from the calendar." />
                <div className="p-5">
                  {c.regularSlot ? (
                    <Link href={routes.court(c.regularSlot.courtId)} className="group flex items-start gap-3">
                      <Repeat size={18} className="mt-0.5 text-accent" aria-hidden />
                      <span className="flex flex-col">
                        <AppText variant="text-strong" className="group-hover:underline">{`Every ${WEEKDAY_LONG[c.regularSlot.weekday]}, ${formatClock(c.regularSlot.startTime)}`}</AppText>
                        <AppText variant="small" tone="muted">{`${c.regularSlot.courtName} · ${formatDuration(c.regularSlot.durationMinutes)}`}</AppText>
                      </span>
                    </Link>
                  ) : (
                    <AppText variant="small" tone="muted">
                      Regular, no fixed slot. Add one from Edit.
                    </AppText>
                  )}
                </div>
              </Card>
            )}

            <Card padded={false}>
              <CardHeader title="Notes" count={c.notes.length} />
              <div className="flex flex-col gap-3 p-5">
                <TextField
                  label="Add a note"
                  multiline
                  rows={3}
                  value={note}
                  onChangeText={(t) => {
                    setNote(t);
                    setNoteError(undefined);
                  }}
                  placeholder="For example: prefers evening slots"
                  error={noteError}
                  maxLength={1000}
                />
                <div>
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
                  <AppText variant="small" tone="muted">
                    No notes yet.
                  </AppText>
                ) : (
                  <ul className="flex flex-col divide-y divide-border border-t border-border">
                    {c.notes.map((n) => (
                      <li key={n.id} className="flex items-start gap-2 py-3">
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <AppText variant="text" className="whitespace-pre-line">
                            {n.body}
                          </AppText>
                          <AppText variant="mini" tone="muted">
                            {n.author} · {formatDayAndTime(n.createdAt, f.timeZone, f.today())}
                          </AppText>
                        </div>
                        <IconButton icon={Trash} label="Delete note" size="sm" onPress={() => setDialog({ note: n.id })} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </>
        }
      />

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

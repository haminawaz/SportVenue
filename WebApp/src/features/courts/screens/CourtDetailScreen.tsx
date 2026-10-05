'use client';

import { useState } from 'react';
import { CalendarBlank, CalendarCheck, ChartBar, CurrencyCircleDollar, PauseCircle, PencilSimple, Percent, PlayCircle, Prohibit, Tag, Trash } from '@phosphor-icons/react';

import { COURT_STATUS } from '@/domain/labels';
import type { CourtStatus, CourtSummary } from '@/domain/types';
import { DayTimeline } from '@/features/bookings/components/DayTimeline';
import { usePricingRules } from '@/features/pricing/api';
import { formatClock, formatWeekdays, useFormat } from '@/lib/format';
import { useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { DataTable } from '@/ui/DataTable';
import { ConfirmDialog } from '@/ui/Dialogs';
import { Menu, type MenuAction } from '@/ui/Menu';
import { DetailLayout, Page, PageHeader } from '@/ui/Page';
import { StatCard, StatGrid } from '@/ui/StatCard';
import { DescriptionList, ListSkeleton, Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useAvailability, useCourt, useDeleteCourt, useUpdateCourt } from '../api';

export function CourtDetailScreen() {
  const id = useRouteParam('id');
  const query = useCourt(id);
  return (
    <Page onRefresh={() => query.refetch()}>
      <QueryView query={query} errorTitle="Couldn't load court">
        {(court) => <CourtBody court={court} />}
      </QueryView>
    </Page>
  );
}

function CourtBody({ court: c }: { court: CourtSummary }) {
  const router = useAppRouter();
  const f = useFormat();
  const today = f.today();
  const availability = useAvailability(c.id, today);
  const rules = usePricingRules(c.id);
  const update = useUpdateCourt(c.id, 'Court status updated');
  const remove = useDeleteCourt();
  const [dialog, setDialog] = useState<CourtStatus | 'delete' | null>(null);
  const status = COURT_STATUS[c.status];

  const upcomingSlots = (availability.data?.slots ?? []).filter((s) => s.status !== 'PAST').slice(0, 6);
  const courtRules = (rules.data ?? []).filter((r) => r.courtId === c.id || r.courtId === null);

  const statusCopy: Record<CourtStatus, { title: string; message: string; confirm: string }> = {
    ACTIVE: { title: `Reopen ${c.name}?`, message: 'You can take bookings on it again straight away.', confirm: 'Set active' },
    MAINTENANCE: {
      title: `Put ${c.name} into maintenance?`,
      message: `New bookings pause until you reopen it.${c.upcomingBookings ? ` ${c.upcomingBookings} upcoming bookings stay in place; move or cancel them if the court can't be used.` : ''}`,
      confirm: 'Start maintenance',
    },
    INACTIVE: {
      title: `Deactivate ${c.name}?`,
      message: `It disappears from booking but keeps its history.${c.upcomingBookings ? ` ${c.upcomingBookings} upcoming bookings stay in place; move or cancel them first.` : ''}`,
      confirm: 'Deactivate',
    },
  };

  const manage: MenuAction[] = [
    ...(c.status !== 'ACTIVE' ? [{ key: 'active', label: 'Set active', description: 'Open for bookings', icon: PlayCircle, onSelect: () => setDialog('ACTIVE') }] : []),
    ...(c.status !== 'MAINTENANCE' ? [{ key: 'maint', label: 'Start maintenance', description: 'Pause new bookings for now', icon: PauseCircle, onSelect: () => setDialog('MAINTENANCE') }] : []),
    ...(c.status !== 'INACTIVE' ? [{ key: 'off', label: 'Deactivate', description: 'Hide from booking, keep history', icon: Prohibit, onSelect: () => setDialog('INACTIVE') }] : []),
    { key: 'delete', label: 'Delete court', icon: Trash, destructive: true, onSelect: () => setDialog('delete') },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Courts', href: routes.courts }, { label: c.name }]}
        title={c.name}
        meta={<StatusBadge label={status.label} tone={status.tone} />}
        description={`${c.sport} · ${c.indoor ? 'Indoor' : 'Outdoor'}${c.surface ? ` · ${c.surface}` : ''}`}
        actions={
          <>
            <Button label="Calendar" icon={CalendarBlank} variant="secondary" onPress={() => router.push(routes.courtCalendar(c.id, today))} />
            <Button label="Edit court" icon={PencilSimple} variant="secondary" onPress={() => router.push(routes.courtEdit(c.id))} />
            <Menu label="Court status and more" triggerLabel="Manage" actions={manage} />
          </>
        }
      />

      {c.status !== 'ACTIVE' && <Notice tone="warning" title={status.description} message={c.notes ?? 'Set the court back to active to take bookings again.'} />}

      <StatGrid>
        <StatCard
          icon={ChartBar}
          label="Booked today"
          value={c.status === 'ACTIVE' ? `${Math.round(c.todayUtilization)}%` : 'Closed'}
          supporting={c.status === 'ACTIVE' ? `${c.todayBookedSlots} of ${c.todayTotalSlots} slots` : undefined}
        />
        <StatCard icon={CalendarCheck} label="Upcoming" value={String(c.upcomingBookings)} supporting="bookings" />
        <StatCard icon={CurrencyCircleDollar} label="Revenue, last 30 days" value={f.money(c.revenue30d)} valueA11y={f.moneyA11y(c.revenue30d)} />
        <StatCard icon={Tag} label="Base rate" value={`${f.money(c.hourlyRate)}`} supporting="per hour" />
      </StatGrid>

      <DetailLayout
        main={
          <Card padded={false}>
            <CardHeader title="Pricing" description="Time-based rates override the base rate for their days and hours." actions={<Button label="Manage pricing" icon={Percent} variant="secondary" size="sm" onPress={() => router.push(routes.pricing(c.id))} />} />
            {rules.isPending ? (
              <ListSkeleton rows={3} />
            ) : (
              <DataTable
                caption={`Pricing for ${c.name}`}
                rows={[{ id: '__base', name: 'Base rate', when: 'Any time without a time-based rate', rate: c.hourlyRate, active: true }, ...courtRules.map((r) => ({ id: r.id, name: r.name, when: `${formatWeekdays(r.weekdays)}, ${formatClock(r.startTime)} - ${formatClock(r.endTime)}`, rate: r.hourlyRate, active: r.active }))]}
                rowKey={(r) => r.id}
                rowHref={(r) => (r.id === '__base' ? routes.courtEdit(c.id) : routes.pricingRule(r.id))}
                columns={[
                  { key: 'name', header: 'Rate', primary: true, cell: (r) => <AppText variant="text-strong">{r.name}</AppText> },
                  { key: 'when', header: 'Applies', hideBelow: 'sm', cell: (r) => <span className="text-text-muted">{r.when}</span> },
                  { key: 'status', header: 'Status', hideBelow: 'md', cell: (r) => (r.active ? <StatusBadge label="Active" tone="positive" /> : <StatusBadge label="Inactive" tone="neutral" />) },
                  { key: 'rate', header: 'Per hour', align: 'right', cell: (r) => <span className="t-text-strong">{f.money(r.rate)}</span> },
                ]}
              />
            )}
          </Card>
        }
        side={
          <>
            <Card padded={false}>
              <CardHeader title="Today" actions={<Button label="Calendar" variant="ghost" size="sm" onPress={() => router.push(routes.courtCalendar(c.id, today))} />} />
              <div className="p-4">
                {availability.isPending ? (
                  <ListSkeleton rows={3} />
                ) : upcomingSlots.length === 0 ? (
                  <AppText variant="small" tone="muted">
                    No more slots today.
                  </AppText>
                ) : (
                  <DayTimeline
                    slots={upcomingSlots}
                    onOpenBooking={(id) => router.push(routes.booking(id))}
                    onBook={c.status === 'ACTIVE' ? (s) => router.push(routes.bookingNew({ courtId: c.id, date: today, startAt: s.startAt })) : undefined}
                  />
                )}
              </div>
            </Card>
            <Card padded={false}>
              <CardHeader title="Settings" />
              <div className="px-5 py-2">
                <DescriptionList
                  items={[
                    { label: 'Slot length', value: `${c.slotMinutes} min` },
                    { label: 'Location', value: c.indoor ? 'Indoor' : 'Outdoor' },
                    c.surface ? { label: 'Surface', value: c.surface } : null,
                    c.notes ? { label: 'Notes', value: c.notes } : null,
                  ]}
                />
              </div>
            </Card>
          </>
        }
      />

      {dialog && dialog !== 'delete' && (
        <ConfirmDialog
          visible
          title={statusCopy[dialog].title}
          message={statusCopy[dialog].message}
          confirmLabel={statusCopy[dialog].confirm}
          cancelLabel="Not now"
          destructive={dialog === 'INACTIVE'}
          loading={update.isPending}
          onCancel={() => setDialog(null)}
          onConfirm={() => update.mutate({ status: dialog }, { onSuccess: () => setDialog(null) })}
        />
      )}
      <ConfirmDialog
        visible={dialog === 'delete'}
        title={`Delete ${c.name}?`}
        message="This can't be undone. Courts with booking history can't be deleted; deactivate them instead."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onCancel={() => setDialog(null)}
        onConfirm={() => remove.mutate(c.id, { onSuccess: () => router.back(routes.courts), onSettled: () => setDialog(null) })}
      />
    </>
  );
}

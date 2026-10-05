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
import { Card } from '@/ui/Card';
import { ConfirmDialog } from '@/ui/Dialogs';
import { IconButton } from '@/ui/IconButton';
import { ListGroup, ListRow } from '@/ui/List';
import { MetricCard, MetricGrid } from '@/ui/MetricCard';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { StackHeader } from '@/ui/StackHeader';
import { ListSkeleton, Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useAvailability, useCourt, useDeleteCourt, useUpdateCourt } from '../api';

export function CourtDetailScreen() {
  const id = useRouteParam('id');
  const router = useAppRouter();
  const query = useCourt(id);

  return (
    <>
      <StackHeader title={query.data?.name ?? 'Court'} headerRight={<IconButton icon={PencilSimple} label="Edit court" size="sm" onPress={() => router.push(routes.courtEdit(id))} />} />
      <Screen onRefresh={() => query.refetch()}>
        <QueryView query={query} errorTitle="Couldn't load court">
          {(court) => <CourtBody court={court} />}
        </QueryView>
      </Screen>
    </>
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

  return (
    <>
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <AppText as="h2" variant="display-lg">
              {c.name}
            </AppText>
            <AppText tone="muted">
              {c.sport} · {c.indoor ? 'Indoor' : 'Outdoor'}
              {c.surface ? ` · ${c.surface}` : ''}
            </AppText>
          </div>
          <StatusBadge label={status.label} tone={status.tone} />
        </div>
      </Card>

      {c.status !== 'ACTIVE' && <Notice tone="warning" title={status.description} message={c.notes ?? 'Set the court back to active to take bookings again.'} />}

      <MetricGrid>
        <MetricCard
          icon={ChartBar}
          label="Booked today"
          value={c.status === 'ACTIVE' ? `${Math.round(c.todayUtilization)}%` : 'Closed'}
          supporting={c.status === 'ACTIVE' ? `${c.todayBookedSlots} of ${c.todayTotalSlots} slots` : undefined}
          tint="accent"
        />
        <MetricCard icon={CalendarCheck} label="Upcoming" value={String(c.upcomingBookings)} supporting="bookings" />
        <MetricCard span="full" icon={CurrencyCircleDollar} label="Revenue, last 30 days" value={f.money(c.revenue30d)} valueA11y={f.moneyA11y(c.revenue30d)} />
      </MetricGrid>

      <section>
        <SectionHeader title="Today" onLink={() => router.push(routes.courtCalendar(c.id, today))} linkLabel="Calendar" />
        {availability.isPending ? (
          <ListSkeleton rows={3} withAvatar={false} />
        ) : upcomingSlots.length === 0 ? (
          <AppText tone="muted">No more slots today.</AppText>
        ) : (
          <DayTimeline
            slots={upcomingSlots}
            onOpenBooking={(id) => router.push(routes.booking(id))}
            onBook={c.status === 'ACTIVE' ? (s) => router.push(routes.bookingNew({ courtId: c.id, date: today, startAt: s.startAt })) : undefined}
          />
        )}
      </section>

      <ListGroup title="Pricing">
        <ListRow title="Base rate" value={`${f.money(c.hourlyRate)} / h`} icon={CurrencyCircleDollar} onPress={() => router.push(routes.courtEdit(c.id))} />
        {courtRules.map((r) => (
          <ListRow
            key={r.id}
            title={r.name}
            subtitle={`${formatWeekdays(r.weekdays)}, ${formatClock(r.startTime)} - ${formatClock(r.endTime)}${r.active ? '' : ' · Inactive'}`}
            value={`${f.money(r.hourlyRate)} / h`}
            icon={Tag}
            onPress={() => router.push(routes.pricingRule(r.id))}
          />
        ))}
        <ListRow title="Manage pricing" subtitle="Peak rates and discounts for this court" icon={Percent} onPress={() => router.push(routes.pricing(c.id))} />
      </ListGroup>

      <ListGroup title="Settings">
        <ListRow title="Slot length" value={`${c.slotMinutes} min`} />
        <ListRow title="Location" value={c.indoor ? 'Indoor' : 'Outdoor'} />
        {c.surface && <ListRow title="Surface" value={c.surface} />}
        {c.notes && <ListRow title="Notes" subtitle={c.notes} />}
      </ListGroup>

      <ListGroup title="Manage">
        <ListRow title="Open calendar" icon={CalendarBlank} onPress={() => router.push(routes.courtCalendar(c.id, today))} />
        {c.status !== 'ACTIVE' && <ListRow title="Set active" subtitle="Open for bookings" icon={PlayCircle} onPress={() => setDialog('ACTIVE')} />}
        {c.status !== 'MAINTENANCE' && <ListRow title="Start maintenance" subtitle="Pause new bookings for now" icon={PauseCircle} onPress={() => setDialog('MAINTENANCE')} />}
        {c.status !== 'INACTIVE' && <ListRow title="Deactivate" subtitle="Hide from booking, keep history" icon={Prohibit} onPress={() => setDialog('INACTIVE')} />}
        <ListRow title="Delete court" icon={Trash} destructive onPress={() => setDialog('delete')} />
      </ListGroup>

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
        onConfirm={() =>
          remove.mutate(c.id, {
            onSuccess: () => router.back(routes.courts),
            onSettled: () => setDialog(null),
          })
        }
      />
    </>
  );
}

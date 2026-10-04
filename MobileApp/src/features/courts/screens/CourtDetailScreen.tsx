import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarBlank, CalendarCheck, ChartBar, CurrencyCircleDollar, PauseCircle, PencilSimple, Percent, PlayCircle, Prohibit, Tag, Trash } from 'phosphor-react-native';

import { COURT_STATUS } from '@/domain/labels';
import type { CourtStatus, CourtSummary } from '@/domain/types';
import { usePricingRules } from '@/features/pricing/api';
import { DayTimeline } from '@/features/bookings/components/DayTimeline';
import { formatClock, formatWeekdays, useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { ConfirmDialog } from '@/ui/Dialogs';
import { IconButton } from '@/ui/IconButton';
import { ListGroup, ListRow } from '@/ui/List';
import { MetricCard } from '@/ui/MetricCard';
import { Screen } from '@/ui/Screen';
import { useTileWidth } from '@/ui/surface';
import { SectionHeader } from '@/ui/SectionHeader';
import { ListSkeleton, Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useAvailability, useCourt, useDeleteCourt, useUpdateCourt } from '../api';

export function CourtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = useCourt(id);
  const [refreshing, setRefreshing] = useState(false);

  return (
    <>
      <Stack.Screen
        options={{
          title: query.data?.name ?? 'Court',
          headerRight: () => <IconButton icon={PencilSimple} label="Edit court" onPress={() => router.push(routes.courtEdit(id))} />,
        }}
      />
      <Screen
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await query.refetch();
          setRefreshing(false);
        }}
      >
        <QueryView query={query} errorTitle="Couldn't load court">
          {(court) => <CourtBody court={court} />}
        </QueryView>
      </Screen>
    </>
  );
}

function CourtBody({ court: c }: { court: CourtSummary }) {
  const router = useRouter();
  const f = useFormat();
  const today = f.today();
  const availability = useAvailability(c.id, today);
  const rules = usePricingRules(c.id);
  const update = useUpdateCourt(c.id, 'Court status updated');
  const remove = useDeleteCourt();
  const [dialog, setDialog] = useState<CourtStatus | 'delete' | null>(null);
  const status = COURT_STATUS[c.status];
  const { half: tile, full: fullTile } = useTileWidth();

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
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <AppText variant="display-lg">{c.name}</AppText>
            <AppText tone="muted">
              {c.sport} · {c.indoor ? 'Indoor' : 'Outdoor'}
              {c.surface ? ` · ${c.surface}` : ''}
            </AppText>
          </View>
          <StatusBadge label={status.label} tone={status.tone} />
        </View>
      </Card>

      {c.status !== 'ACTIVE' && (
        <Notice tone="warning" title={status.description} message={c.notes ?? 'Set the court back to active to take bookings again.'} />
      )}

      <View style={styles.tiles}>
        <MetricCard width={tile} icon={ChartBar} label="Booked today" value={c.status === 'ACTIVE' ? `${Math.round(c.todayUtilization)}%` : 'Closed'} supporting={c.status === 'ACTIVE' ? `${c.todayBookedSlots} of ${c.todayTotalSlots} slots` : undefined} tint="accent" />
        <MetricCard width={tile} icon={CalendarCheck} label="Upcoming" value={String(c.upcomingBookings)} supporting="bookings" />
        <MetricCard width={fullTile} icon={CurrencyCircleDollar} label="Revenue, last 30 days" value={f.money(c.revenue30d)} valueA11y={f.moneyA11y(c.revenue30d)} />
      </View>

      <View>
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
      </View>

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
            onSuccess: () => router.back(),
            onSettled: () => setDialog(null),
          })
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  flex: { flex: 1, gap: spacing.xxs },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});

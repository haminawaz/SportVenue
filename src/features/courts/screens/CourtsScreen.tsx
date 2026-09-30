import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CourtBasketball, Plus } from 'phosphor-react-native';

import { COURT_STATUS } from '@/domain/labels';
import type { CourtStatus, CourtSummary } from '@/domain/types';
import { useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { PressableCard } from '@/ui/Card';
import { Chip, ChipRow } from '@/ui/Chips';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ProgressBar } from '@/ui/ProgressBar';
import { Screen } from '@/ui/Screen';
import { DetailSkeleton, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useCourts } from '../api';

type Filter = 'ALL' | CourtStatus;

export function CourtsScreen() {
  const router = useRouter();
  const query = useCourts();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await query.refetch();
        setRefreshing(false);
      }}
    >
      <Stack.Screen
        options={{
          title: 'Courts',
          headerRight: () => <IconButton icon={Plus} label="Add court" onPress={() => router.push(routes.courtNew)} tone="accent" />,
        }}
      />
      <QueryView query={query} skeleton={<DetailSkeleton />} errorTitle="Couldn't load courts">
        {(courts) => {
          const count = (s: Filter) => (s === 'ALL' ? courts.length : courts.filter((c) => c.status === s).length);
          const shown = filter === 'ALL' ? courts : courts.filter((c) => c.status === filter);
          if (courts.length === 0) {
            return (
              <EmptyState
                icon={CourtBasketball}
                title="Add your first court"
                message="Courts are what customers book. Add one to start taking bookings."
                action={<Button label="Add court" icon={Plus} onPress={() => router.push(routes.courtNew)} />}
              />
            );
          }
          return (
            <View style={styles.list}>
              <ChipRow>
                {(['ALL', 'ACTIVE', 'MAINTENANCE', 'INACTIVE'] as Filter[]).map((s) => (
                  <Chip key={s} label={s === 'ALL' ? 'All' : COURT_STATUS[s].label} count={count(s)} selected={filter === s} onPress={() => setFilter(s)} />
                ))}
              </ChipRow>
              {shown.length === 0 ? (
                <EmptyState compact icon={CourtBasketball} title={`No ${filter === 'ALL' ? '' : COURT_STATUS[filter as CourtStatus].label.toLowerCase()} courts`} />
              ) : (
                shown.map((c) => <CourtCard key={c.id} court={c} onPress={() => router.push(routes.court(c.id))} />)
              )}
            </View>
          );
        }}
      </QueryView>
    </Screen>
  );
}

function CourtCard({ court: c, onPress }: { court: CourtSummary; onPress: () => void }) {
  const { colors } = useTheme();
  const f = useFormat();
  const status = COURT_STATUS[c.status];
  const active = c.status === 'ACTIVE';
  const a11y = [c.name, c.sport, c.indoor ? 'Indoor' : 'Outdoor', status.label, active ? `${Math.round(c.todayUtilization)} percent booked today` : undefined, `${f.moneyA11y(c.hourlyRate)} per hour`]
    .filter(Boolean)
    .join(', ');

  return (
    <PressableCard onPress={onPress} aria-label={a11y} accessibilityHint="Opens court details">
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: active ? colors.accentSoft : colors.surfaceMuted }]}>
          <CourtBasketball size={22} color={active ? colors.accent : colors.textMuted} />
        </View>
        <View style={styles.flex}>
          <AppText variant="title-md" numberOfLines={2}>
            {c.name}
          </AppText>
          <AppText variant="body-sm" tone="muted" numberOfLines={1}>
            {c.sport} · {c.indoor ? 'Indoor' : 'Outdoor'}
          </AppText>
        </View>
        <StatusBadge label={status.label} tone={status.tone} />
      </View>
      {active ? (
        <View style={styles.util}>
          <View style={styles.utilRow}>
            <AppText variant="body-sm" tone="muted" style={styles.flex}>
              Today: {c.todayBookedSlots} of {c.todayTotalSlots} slots
            </AppText>
            <AppText variant="body-strong" numeric>
              {Math.round(c.todayUtilization)}%
            </AppText>
          </View>
          <ProgressBar value={c.todayUtilization} />
        </View>
      ) : (
        <AppText variant="body-sm" tone="muted" style={styles.util}>
          {status.description}
        </AppText>
      )}
      <View style={[styles.foot, { borderTopColor: colors.border }]}>
        <AppText variant="body-strong" numeric>
          {f.money(c.hourlyRate)}
          <AppText variant="body-sm" tone="muted">
            {' '}
            / hour base
          </AppText>
        </AppText>
        <AppText variant="body-sm" tone="muted" numeric>
          {c.upcomingBookings} upcoming
        </AppText>
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  util: { marginTop: spacing.lg, gap: spacing.sm },
  utilRow: { flexDirection: 'row', alignItems: 'center' },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth * 2, marginTop: spacing.lg, paddingTop: spacing.md, flexWrap: 'wrap' },
});

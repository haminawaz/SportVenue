import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SealCheck } from 'phosphor-react-native';

import { OPPORTUNITY_STATUS, opportunityTypeMeta } from '@/domain/labels';
import type { Opportunity, OpportunityStatus } from '@/domain/types';
import { useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { PressableCard } from '@/ui/Card';
import { Chip, ChipRow } from '@/ui/Chips';
import { EmptyState } from '@/ui/EmptyState';
import { Screen } from '@/ui/Screen';
import { DetailSkeleton, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useOpportunities } from '../api';

const ORDER: OpportunityStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'];

export function OpportunitiesScreen() {
  const router = useRouter();
  const query = useOpportunities();
  const [status, setStatus] = useState<OpportunityStatus>('OPEN');
  const [refreshing, setRefreshing] = useState(false);

  return (
    <>
      <Stack.Screen options={{ title: 'Revenue opportunities' }} />
      <Screen
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await query.refetch();
          setRefreshing(false);
        }}
      >
        <AppText tone="muted">Patterns SportVenue found in your bookings and payments, with a suggested next step for each.</AppText>
        <QueryView query={query} skeleton={<DetailSkeleton />} errorTitle="Couldn't load opportunities">
          {(all) => <List all={all} status={status} setStatus={setStatus} onOpen={(id) => router.push(routes.opportunity(id))} />}
        </QueryView>
      </Screen>
    </>
  );
}

function List({ all, status, setStatus, onOpen }: { all: Opportunity[]; status: OpportunityStatus; setStatus: (s: OpportunityStatus) => void; onOpen: (id: string) => void }) {
  const counts = useMemo(() => Object.fromEntries(ORDER.map((s) => [s, all.filter((o) => o.status === s).length])), [all]);
  const shown = all.filter((o) => o.status === status);
  return (
    <View style={styles.list}>
      <ChipRow>
        {ORDER.map((s) => (
          <Chip key={s} label={OPPORTUNITY_STATUS[s].label} count={counts[s]} selected={s === status} onPress={() => setStatus(s)} />
        ))}
      </ChipRow>
      {shown.length === 0 ? (
        <EmptyState
          icon={SealCheck}
          title={status === 'OPEN' ? "You're all caught up" : `Nothing ${OPPORTUNITY_STATUS[status].label.toLowerCase()}`}
          message={status === 'OPEN' ? 'New opportunities appear here as your booking patterns change.' : undefined}
        />
      ) : (
        shown.map((o) => <OpportunityCard key={o.id} opportunity={o} onPress={() => onOpen(o.id)} />)
      )}
    </View>
  );
}

function OpportunityCard({ opportunity: o, onPress }: { opportunity: Opportunity; onPress: () => void }) {
  const { colors } = useTheme();
  const f = useFormat();
  const type = opportunityTypeMeta(o.type);
  const Icon = type.icon;
  const status = OPPORTUNITY_STATUS[o.status];
  const related = [o.courtName, o.customerName].filter(Boolean).join(' · ');
  const closed = o.status === 'RESOLVED' || o.status === 'DISMISSED';

  return (
    <PressableCard
      onPress={onPress}
      aria-label={[type.label, o.title, status.label, related, o.potentialRevenue ? `up to ${f.moneyA11y(o.potentialRevenue)}` : undefined].filter(Boolean).join(', ')}
      accessibilityHint="Opens opportunity details"
    >
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: closed ? colors.surfaceMuted : colors.accentSoft }]}>
          <Icon size={20} color={closed ? colors.textMuted : colors.accent} />
        </View>
        <AppText variant="nav-link" tone="muted" style={styles.flex}>
          {type.label}
        </AppText>
        <StatusBadge label={status.label} tone={status.tone} />
      </View>
      <AppText variant="body-strong" style={styles.title}>
        {o.title}
      </AppText>
      {o.description && (
        <AppText variant="body-sm" tone="muted" numberOfLines={2}>
          {o.description}
        </AppText>
      )}
      {(related || o.potentialRevenue) && (
        <View style={[styles.foot, { borderTopColor: colors.border }]}>
          <AppText variant="body-sm" tone="muted" style={styles.flex} numberOfLines={1}>
            {related}
          </AppText>
          {o.potentialRevenue ? (
            <AppText variant="nav-link" tone={closed ? 'muted' : 'accent'} numeric>
              Up to {f.compactMoney(o.potentialRevenue)}
            </AppText>
          ) : null}
        </View>
      )}
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 34, height: 34, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  title: { marginTop: spacing.md, marginBottom: spacing.xxs },
  foot: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.md, paddingTop: spacing.sm },
});

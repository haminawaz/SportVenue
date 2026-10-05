'use client';

import { useMemo, useState } from 'react';
import { SealCheck } from '@phosphor-icons/react';

import { OPPORTUNITY_STATUS, opportunityTypeMeta } from '@/domain/labels';
import type { Opportunity, OpportunityStatus } from '@/domain/types';
import { useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { PressableCard } from '@/ui/Card';
import { Chip, ChipRow } from '@/ui/Chips';
import { cn } from '@/ui/cn';
import { EmptyState } from '@/ui/EmptyState';
import { Screen } from '@/ui/Screen';
import { StackHeader } from '@/ui/StackHeader';
import { DetailSkeleton, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useOpportunities } from '../api';

const ORDER: OpportunityStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'];

export function OpportunitiesScreen() {
  const router = useAppRouter();
  const query = useOpportunities();
  const [status, setStatus] = useState<OpportunityStatus>('OPEN');

  return (
    <>
      <StackHeader title="Revenue opportunities" />
      <Screen onRefresh={() => query.refetch()}>
        <AppText as="p" tone="muted">
          Patterns SportVenue found in your bookings and payments, with a suggested next step for each.
        </AppText>
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
    <div className="flex flex-col gap-3">
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
    </div>
  );
}

function OpportunityCard({ opportunity: o, onPress }: { opportunity: Opportunity; onPress: () => void }) {
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
      title="Opens opportunity details"
    >
      <span className="flex items-center gap-2">
        <span className={cn('flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full', closed ? 'bg-surface-muted text-text-muted' : 'bg-accent-soft text-accent')}>
          <Icon size={20} aria-hidden />
        </span>
        <AppText variant="nav-link" tone="muted" className="flex-1">
          {type.label}
        </AppText>
        <StatusBadge label={status.label} tone={status.tone} />
      </span>
      <AppText variant="body-strong" className="mt-3 mb-0.5">
        {o.title}
      </AppText>
      {o.description && (
        <AppText variant="body-sm" tone="muted" lines={2}>
          {o.description}
        </AppText>
      )}
      {(related || o.potentialRevenue) && (
        <span className="mt-3 flex items-center gap-3 border-t border-border pt-2">
          <AppText variant="body-sm" tone="muted" lines={1} className="flex-1">
            {related}
          </AppText>
          {o.potentialRevenue ? (
            <AppText variant="nav-link" tone={closed ? 'muted' : 'accent'} numeric>
              Up to {f.compactMoney(o.potentialRevenue)}
            </AppText>
          ) : null}
        </span>
      )}
    </PressableCard>
  );
}

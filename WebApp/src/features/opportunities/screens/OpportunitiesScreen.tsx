'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SealCheck } from '@phosphor-icons/react';

import { OPPORTUNITY_STATUS, opportunityTypeMeta } from '@/domain/labels';
import type { Opportunity, OpportunityStatus } from '@/domain/types';
import { useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { notePush } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { cn } from '@/ui/cn';
import { EmptyState } from '@/ui/EmptyState';
import { Page, PageHeader } from '@/ui/Page';
import { Skeleton } from '@/ui/Skeleton';
import { QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';
import { Tabs } from '@/ui/Tabs';

import { useOpportunities } from '../api';

const ORDER: OpportunityStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'];

export function OpportunitiesScreen() {
  const query = useOpportunities();
  const [status, setStatus] = useState<OpportunityStatus>('OPEN');

  return (
    <Page onRefresh={() => query.refetch()}>
      <PageHeader title="Revenue opportunities" description="Patterns SportVenue found in your bookings and payments, with a suggested next step for each." />
      <QueryView
        query={query}
        skeleton={
          <div role="progressbar" aria-label="Loading" aria-busy className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="surface-card flex flex-col gap-3 p-5">
                <Skeleton width="40%" height={12} />
                <Skeleton width="80%" height={18} />
                <Skeleton width="90%" height={12} />
              </div>
            ))}
          </div>
        }
        errorTitle="Couldn't load opportunities"
      >
        {(all) => <List all={all} status={status} setStatus={setStatus} />}
      </QueryView>
    </Page>
  );
}

function List({ all, status, setStatus }: { all: Opportunity[]; status: OpportunityStatus; setStatus: (s: OpportunityStatus) => void }) {
  const counts = useMemo(() => Object.fromEntries(ORDER.map((s) => [s, all.filter((o) => o.status === s).length])), [all]);
  const shown = all.filter((o) => o.status === status);
  return (
    <div className="flex flex-col gap-5">
      <Tabs label="Status" value={status} onChange={setStatus} items={ORDER.map((s) => ({ value: s, label: OPPORTUNITY_STATUS[s].label, count: counts[s] }))} />
      {shown.length === 0 ? (
        <EmptyState
          framed
          icon={SealCheck}
          title={status === 'OPEN' ? "You're all caught up" : `Nothing ${OPPORTUNITY_STATUS[status].label.toLowerCase()}`}
          message={status === 'OPEN' ? 'New opportunities appear here as your booking patterns change.' : undefined}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} />
          ))}
        </ul>
      )}
    </div>
  );
}

function OpportunityCard({ opportunity: o }: { opportunity: Opportunity }) {
  const f = useFormat();
  const type = opportunityTypeMeta(o.type);
  const Icon = type.icon;
  const status = OPPORTUNITY_STATUS[o.status];
  const related = [o.courtName, o.customerName].filter(Boolean).join(' · ');
  const closed = o.status === 'RESOLVED' || o.status === 'DISMISSED';

  return (
    <li>
      <Link
        href={routes.opportunity(o.id)}
        onClick={notePush}
        aria-label={[type.label, o.title, status.label, related, o.potentialRevenue ? `up to ${f.moneyA11y(o.potentialRevenue)}` : undefined].filter(Boolean).join(', ')}
        className="surface-card flex h-full flex-col gap-3 p-5 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-[0_4px_12px_rgba(42,33,23,0.06)]"
      >
        <span className="flex items-center gap-2">
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-full', closed ? 'bg-surface-muted text-text-muted' : 'bg-accent-soft text-accent')}>
            <Icon size={15} aria-hidden />
          </span>
          <AppText variant="label" tone="muted" className="flex-1">
            {type.label}
          </AppText>
          <StatusBadge label={status.label} tone={status.tone} />
        </span>
        <span className="flex flex-col gap-1">
          <AppText variant="heading">{o.title}</AppText>
          {o.description && (
            <AppText variant="small" tone="muted" lines={3}>
              {o.description}
            </AppText>
          )}
        </span>
        {(related || o.potentialRevenue) && (
          <span className="mt-auto flex items-center gap-3 border-t border-border pt-3">
            <AppText variant="small" tone="muted" lines={1} className="flex-1">
              {related}
            </AppText>
            {o.potentialRevenue ? (
              <AppText variant="label" tone={closed ? 'muted' : 'accent'} numeric>
                Up to {f.compactMoney(o.potentialRevenue)}
              </AppText>
            ) : null}
          </span>
        )}
      </Link>
    </li>
  );
}

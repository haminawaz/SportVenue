'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarBlank, CourtBasketball, Plus, Tag } from '@phosphor-icons/react';

import { COURT_STATUS } from '@/domain/labels';
import type { CourtStatus, CourtSummary } from '@/domain/types';
import { useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { notePush, useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { cn } from '@/ui/cn';
import { EmptyState } from '@/ui/EmptyState';
import { Page, PageHeader } from '@/ui/Page';
import { ProgressBar } from '@/ui/ProgressBar';
import { QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';
import { Skeleton } from '@/ui/Skeleton';
import { Tabs } from '@/ui/Tabs';

import { useCourts } from '../api';

type Filter = 'ALL' | CourtStatus;

function GridSkeleton() {
  return (
    <div role="progressbar" aria-label="Loading" aria-busy className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="surface-card flex flex-col gap-3 p-5">
          <Skeleton width="50%" height={18} />
          <Skeleton width="35%" height={12} />
          <Skeleton height={8} />
          <Skeleton width="60%" height={12} />
        </div>
      ))}
    </div>
  );
}

export function CourtsScreen() {
  const router = useAppRouter();
  const query = useCourts();
  const [filter, setFilter] = useState<Filter>('ALL');

  return (
    <Page onRefresh={() => query.refetch()}>
      <PageHeader
        title="Courts"
        description="Your courts, how busy they are today, and their base rates."
        actions={
          <>
            <Button label="Pricing and discounts" icon={Tag} variant="secondary" onPress={() => router.push(routes.pricing())} />
            <Button label="Add court" icon={Plus} onPress={() => router.push(routes.courtNew)} />
          </>
        }
      />
      <QueryView query={query} skeleton={<GridSkeleton />} errorTitle="Couldn't load courts">
        {(courts) => {
          const count = (s: Filter) => (s === 'ALL' ? courts.length : courts.filter((c) => c.status === s).length);
          const shown = filter === 'ALL' ? courts : courts.filter((c) => c.status === filter);
          if (courts.length === 0) {
            return (
              <Card>
                <EmptyState
                  icon={CourtBasketball}
                  title="Add your first court"
                  message="Courts are what customers book. Add one to start taking bookings."
                  action={<Button label="Add court" icon={Plus} onPress={() => router.push(routes.courtNew)} />}
                />
              </Card>
            );
          }
          return (
            <div className="flex flex-col gap-5">
              <Tabs
                label="Court status"
                value={filter}
                onChange={setFilter}
                items={(['ALL', 'ACTIVE', 'MAINTENANCE', 'INACTIVE'] as Filter[]).map((s) => ({ value: s, label: s === 'ALL' ? 'All' : COURT_STATUS[s].label, count: count(s) }))}
              />
              {shown.length === 0 ? (
                <EmptyState framed icon={CourtBasketball} title={`No ${filter === 'ALL' ? '' : COURT_STATUS[filter as CourtStatus].label.toLowerCase()} courts`} />
              ) : (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {shown.map((c) => (
                    <CourtCard key={c.id} court={c} />
                  ))}
                </ul>
              )}
            </div>
          );
        }}
      </QueryView>
    </Page>
  );
}

/** A court with today's utilization; the card opens the court, the footer links open its calendar and pricing. */
function CourtCard({ court: c }: { court: CourtSummary }) {
  const f = useFormat();
  const status = COURT_STATUS[c.status];
  const active = c.status === 'ACTIVE';
  const a11y = [c.name, c.sport, c.indoor ? 'Indoor' : 'Outdoor', status.label, active ? `${Math.round(c.todayUtilization)} percent booked today` : undefined, `${c.upcomingBookings} upcoming bookings`]
    .filter(Boolean)
    .join(', ');

  return (
    <li className="surface-card group relative flex flex-col transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-[0_4px_12px_rgba(42,33,23,0.06)]">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-control', active ? 'bg-accent-soft text-accent' : 'bg-surface-muted text-text-muted')}>
            <CourtBasketball size={20} aria-hidden />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <Link href={routes.court(c.id)} onClick={notePush} aria-label={a11y} className="outline-none after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-accent">
              <AppText variant="heading" lines={1}>
                {c.name}
              </AppText>
            </Link>
            <AppText variant="small" tone="muted" lines={1}>
              {c.sport} · {c.indoor ? 'Indoor' : 'Outdoor'}
              {c.surface ? ` · ${c.surface}` : ''}
            </AppText>
          </div>
          <StatusBadge label={status.label} tone={status.tone} />
        </div>
        {active ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <AppText variant="small" tone="muted">
                Today: {c.todayBookedSlots} of {c.todayTotalSlots} slots
              </AppText>
              <AppText variant="text-strong" numeric>
                {Math.round(c.todayUtilization)}%
              </AppText>
            </div>
            <ProgressBar value={c.todayUtilization} />
          </div>
        ) : (
          <AppText variant="small" tone="muted">
            {status.description}
          </AppText>
        )}
        <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div>
            <dt className="t-mini text-text-muted">Base rate</dt>
            <dd className="t-text-strong tabular-nums">{f.money(c.hourlyRate)} / h</dd>
          </div>
          <div>
            <dt className="t-mini text-text-muted">Upcoming</dt>
            <dd className="t-text-strong tabular-nums">{c.upcomingBookings} bookings</dd>
          </div>
        </dl>
      </div>
      <div className="relative z-10 mt-auto flex border-t border-border">
        <Link href={routes.courtCalendar(c.id)} onClick={notePush} className="t-label flex h-10 flex-1 items-center justify-center gap-1.5 text-text-muted hover:bg-surface-muted hover:text-text">
          <CalendarBlank size={15} aria-hidden />
          Calendar
        </Link>
        <Link
          href={routes.pricing(c.id)}
          onClick={notePush}
          aria-label={`Pricing for ${c.name}, base rate ${f.moneyA11y(c.hourlyRate)} per hour`}
          className="t-label flex h-10 flex-1 items-center justify-center gap-1.5 border-l border-border text-text-muted hover:bg-surface-muted hover:text-text"
        >
          <Tag size={15} aria-hidden />
          Pricing
        </Link>
      </div>
    </li>
  );
}

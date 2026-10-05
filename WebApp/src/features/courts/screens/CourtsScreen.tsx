'use client';

import { useState } from 'react';
import { CaretRight, CourtBasketball, Plus, Tag } from '@phosphor-icons/react';

import { COURT_STATUS } from '@/domain/labels';
import type { CourtStatus, CourtSummary } from '@/domain/types';
import { useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Chip, ChipRow } from '@/ui/Chips';
import { cn } from '@/ui/cn';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ListGroup, ListRow } from '@/ui/List';
import { ProgressBar } from '@/ui/ProgressBar';
import { Screen } from '@/ui/Screen';
import { StackHeader } from '@/ui/StackHeader';
import { DetailSkeleton, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useCourts } from '../api';

type Filter = 'ALL' | CourtStatus;

export function CourtsScreen() {
  const router = useAppRouter();
  const query = useCourts();
  const [filter, setFilter] = useState<Filter>('ALL');

  return (
    <>
      {/* The pinned large title replaces the stack header here, to match the tab screens. */}
      <StackHeader title="Courts" headerShown={false} />
      <Screen
        title="Courts"
        onBack={() => router.back(routes.more)}
        titleActions={<IconButton icon={Plus} label="Add court" onPress={() => router.push(routes.courtNew)} variant="solid" size="sm" />}
        onRefresh={() => query.refetch()}
      >
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
              <div className="flex flex-col gap-3">
                <ListGroup>
                  <ListRow icon={Tag} title="Pricing and discounts" subtitle="Peak rates and offers across all courts" onPress={() => router.push(routes.pricing())} />
                </ListGroup>
                <ChipRow>
                  {(['ALL', 'ACTIVE', 'MAINTENANCE', 'INACTIVE'] as Filter[]).map((s) => (
                    <Chip key={s} label={s === 'ALL' ? 'All' : COURT_STATUS[s].label} count={count(s)} selected={filter === s} onPress={() => setFilter(s)} />
                  ))}
                </ChipRow>
                {shown.length === 0 ? (
                  <EmptyState compact icon={CourtBasketball} title={`No ${filter === 'ALL' ? '' : COURT_STATUS[filter as CourtStatus].label.toLowerCase()} courts`} />
                ) : (
                  shown.map((c) => <CourtCard key={c.id} court={c} onPress={() => router.push(routes.court(c.id))} onPricing={() => router.push(routes.pricing(c.id))} />)
                )}
              </div>
            );
          }}
        </QueryView>
      </Screen>
    </>
  );
}

/**
 * A court with its pricing attached: the body opens the court, the footer
 * opens that court's rates and discounts. Two sibling buttons (not nested)
 * so keyboard and screen-reader users can reach both.
 */
function CourtCard({ court: c, onPress, onPricing }: { court: CourtSummary; onPress: () => void; onPricing: () => void }) {
  const f = useFormat();
  const status = COURT_STATUS[c.status];
  const active = c.status === 'ACTIVE';
  const a11y = [c.name, c.sport, c.indoor ? 'Indoor' : 'Outdoor', status.label, active ? `${Math.round(c.todayUtilization)} percent booked today` : undefined, `${c.upcomingBookings} upcoming bookings`]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="surface-card overflow-hidden">
      <button type="button" aria-label={a11y} title="Opens court details" onClick={onPress} className="block w-full p-5 text-left transition-colors hover:bg-surface-muted/60 active:bg-surface-muted">
        <span className="flex items-center gap-3">
          <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', active ? 'bg-accent-soft text-accent' : 'bg-surface-muted text-text-muted')}>
            <CourtBasketball size={22} aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <AppText variant="title-md" lines={2}>
              {c.name}
            </AppText>
            <AppText variant="body-sm" tone="muted" lines={1}>
              {c.sport} · {c.indoor ? 'Indoor' : 'Outdoor'}
            </AppText>
          </span>
          <StatusBadge label={status.label} tone={status.tone} />
        </span>
        {active ? (
          <span className="mt-4 flex flex-col gap-2">
            <span className="flex items-center">
              <AppText variant="body-sm" tone="muted" className="flex-1">
                Today: {c.todayBookedSlots} of {c.todayTotalSlots} slots
              </AppText>
              <AppText variant="body-strong" numeric>
                {Math.round(c.todayUtilization)}%
              </AppText>
            </span>
            <ProgressBar value={c.todayUtilization} />
          </span>
        ) : (
          <AppText variant="body-sm" tone="muted" className="mt-4">
            {status.description}
          </AppText>
        )}
      </button>
      <button
        type="button"
        aria-label={`Pricing for ${c.name}, base rate ${f.moneyA11y(c.hourlyRate)} per hour`}
        title="Opens rates and discounts for this court"
        onClick={onPricing}
        className="flex min-h-14 w-full items-center gap-2.5 border-t border-border px-5 text-left transition-colors hover:bg-surface-muted/60 active:bg-surface-muted"
      >
        <Tag size={20} weight="bold" className="shrink-0 text-accent" aria-hidden />
        <AppText variant="body-strong" numeric className="flex-1">
          {f.money(c.hourlyRate)}
          <AppText inline variant="body-sm" tone="muted">
            {' '}
            / hour base
          </AppText>
        </AppText>
        <AppText variant="nav-link" tone="accent">
          Pricing
        </AppText>
        <CaretRight size={16} weight="bold" className="text-accent" aria-hidden />
      </button>
    </div>
  );
}

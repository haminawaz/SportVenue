'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowCounterClockwise, Bell, CalendarBlank, CheckCircle, CourtBasketball, Lightbulb, PlayCircle, Tag, User, XCircle } from '@phosphor-icons/react';

import { OPPORTUNITY_STATUS, opportunityTypeMeta } from '@/domain/labels';
import type { Opportunity } from '@/domain/types';
import { useSendReminder } from '@/features/bookings/api';
import { recommendationText } from '@/features/dashboard/utils/dashboardFormatters';
import { facilityWallClock, formatDayAndTime, formatTime } from '@/lib/datetime';
import { formatClock, useFormat } from '@/lib/format';
import { useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { ConfirmDialog } from '@/ui/Dialogs';
import { TextField } from '@/ui/Fields';
import type { IconType } from '@/ui/icon';
import { DetailLayout, Page, PageHeader } from '@/ui/Page';
import { Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useOpportunity, useOpportunityTransition } from '../api';

export function OpportunityDetailScreen() {
  const id = useRouteParam('id');
  const query = useOpportunity(id);
  return (
    <Page width="wide" onRefresh={() => query.refetch()}>
      <QueryView query={query} errorTitle="Couldn't load opportunity">
        {(o) => <Body opportunity={o} />}
      </QueryView>
    </Page>
  );
}

function Body({ opportunity: o }: { opportunity: Opportunity }) {
  const router = useAppRouter();
  const f = useFormat();
  const transition = useOpportunityTransition(o.id);
  const remind = useSendReminder();
  const [dialog, setDialog] = useState<'resolve' | 'dismiss' | null>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string>();

  const type = opportunityTypeMeta(o.type);
  const status = OPPORTUNITY_STATUS[o.status];
  const closed = o.status === 'RESOLVED' || o.status === 'DISMISSED';
  const suggestion = recommendationText(o.recommendedAction, (n) => f.money(n));
  const action = o.recommendedAction;

  const apply = ((): { label: string; icon: IconType; run: () => void } | null => {
    if (!action || closed) return null;
    const window = action.window;
    switch (action.type) {
      case 'DISCOUNT':
        return {
          label: 'Create this discount',
          icon: Tag,
          run: () =>
            router.push(
              routes.discountNew({
                courtId: o.courtId,
                value: action.value !== undefined ? String(action.value) : undefined,
                kind: action.unit === 'AMOUNT' ? 'AMOUNT' : 'PERCENT',
                weekdays: window?.weekdays.join(','),
                startTime: window?.startTime,
                endTime: window?.endTime,
                name: o.courtName ? `${o.courtName} off-peak` : 'Off-peak offer',
                opportunityId: o.id,
              }),
            ),
        };
      case 'PRICE_INCREASE':
        return {
          label: 'Add a peak rate',
          icon: Tag,
          run: () => router.push(routes.pricingRuleNew({ courtId: o.courtId, weekdays: window?.weekdays.join(','), startTime: window?.startTime, endTime: window?.endTime, name: 'Peak demand', opportunityId: o.id })),
        };
      case 'REMIND':
        return o.bookingId ? { label: 'Send reminder', icon: Bell, run: () => remind.mutate(o.bookingId!) } : null;
      case 'CONTACT':
        return o.customerId ? { label: `Open ${o.customerName?.split(' ')[0] ?? 'customer'}'s profile`, icon: User, run: () => router.push(routes.customer(o.customerId!)) } : null;
      default:
        return null;
    }
  })();

  const window = o.startAt ? `${formatDayAndTime(o.startAt, f.timeZone, f.today())}${o.endAt ? ` - ${formatTime(o.endAt, f.timeZone)}` : ''}` : undefined;
  const related: { href: string; icon: IconType; title: string; subtitle: string }[] = [];
  if (o.courtId) related.push({ href: routes.court(o.courtId), icon: CourtBasketball, title: o.courtName ?? 'Court', subtitle: 'Court details' });
  if (o.courtId && window && o.startAt) related.push({ href: routes.courtCalendar(o.courtId, facilityWallClock(o.startAt, f.timeZone).date), icon: CalendarBlank, title: window, subtitle: 'Open this day in the calendar' });
  if (o.bookingId) related.push({ href: routes.booking(o.bookingId), icon: CalendarBlank, title: `Booking ${o.bookingReference ?? ''}`.trim(), subtitle: 'Booking details' });
  if (o.customerId) related.push({ href: routes.customer(o.customerId), icon: User, title: o.customerName ?? 'Customer', subtitle: 'Customer profile' });

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Opportunities', href: routes.opportunities }, { label: type.label }]}
        title={o.title}
        meta={<StatusBadge label={status.label} tone={status.tone} />}
        description={`${type.label} · Found ${formatDayAndTime(o.createdAt, f.timeZone, f.today())}`}
        actions={
          closed ? (
            <Button label="Reopen" icon={ArrowCounterClockwise} variant="secondary" onPress={() => transition.mutate({ action: 'reopen' })} />
          ) : (
            <>
              {o.status === 'OPEN' && <Button label="Start working on it" icon={PlayCircle} variant="secondary" onPress={() => transition.mutate({ action: 'start' })} />}
              <Button label="Dismiss" icon={XCircle} variant="secondary" onPress={() => setDialog('dismiss')} />
              <Button label="Mark as resolved" icon={CheckCircle} onPress={() => setDialog('resolve')} />
            </>
          )
        }
      />

      {o.resolution && (
        <Notice
          tone="info"
          icon={o.resolution.outcome === 'ACTIONED' ? CheckCircle : XCircle}
          title={o.resolution.outcome === 'ACTIONED' ? 'Resolved' : 'Dismissed'}
          message={`${o.resolution.note ? `${o.resolution.note} ` : ''}By ${o.resolution.by}, ${formatDayAndTime(o.resolution.at, f.timeZone, f.today())}.`}
        />
      )}

      <DetailLayout
        main={
          <>
            {o.description && (
              <Card padded={false}>
                <CardHeader title="What we found" />
                <AppText as="p" className="p-5">
                  {o.description}
                </AppText>
              </Card>
            )}
            {suggestion && (
              <Card padded={false}>
                <CardHeader title="Recommended action" />
                <div className="flex flex-col gap-3 p-5">
                  <div className="flex items-start gap-2">
                    <Lightbulb size={18} weight="fill" className="mt-0.5 shrink-0 text-accent" aria-hidden />
                    <AppText variant="text-strong">{suggestion.replace(/^Suggested: /, '').replace(/^./, (c) => c.toUpperCase())}.</AppText>
                  </div>
                  {action?.window && (
                    <AppText variant="small" tone="muted">
                      Applies {action.window.weekdays.length === 5 ? 'on weekdays' : 'on selected days'}, {formatClock(action.window.startTime)} - {formatClock(action.window.endTime)}.
                    </AppText>
                  )}
                  {apply && (
                    <div>
                      <Button label={apply.label} icon={apply.icon} onPress={apply.run} loading={action?.type === 'REMIND' && remind.isPending} />
                    </div>
                  )}
                </div>
              </Card>
            )}
          </>
        }
        side={
          <>
            {o.potentialRevenue ? (
              <Card tint="accent" className="flex flex-col gap-1">
                <AppText variant="label" tone="muted">
                  Revenue at stake
                </AppText>
                <AppText variant="stat" numeric aria-label={f.moneyA11y(o.potentialRevenue)}>
                  {f.money(o.potentialRevenue)}
                </AppText>
                <AppText variant="small" tone="muted">
                  SportVenue’s estimate for the next 4 weeks if acted on.
                </AppText>
              </Card>
            ) : null}
            {related.length > 0 && (
              <Card padded={false}>
                <CardHeader title="Related" />
                <ul className="flex flex-col p-2">
                  {related.map((r) => (
                    <li key={`${r.href}${r.subtitle}`}>
                      <Link href={r.href} className="flex items-start gap-3 rounded-control px-3 py-2.5 hover:bg-surface-muted">
                        <r.icon size={17} className="mt-0.5 text-text-muted" aria-hidden />
                        <span className="flex flex-col">
                          <AppText variant="text-strong">{r.title}</AppText>
                          <AppText variant="small" tone="muted">
                            {r.subtitle}
                          </AppText>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        }
      />

      <ConfirmDialog
        visible={dialog !== null}
        title={dialog === 'resolve' ? 'Mark as resolved?' : 'Dismiss this opportunity?'}
        message={dialog === 'resolve' ? 'Add what you did so the team can see it later.' : "Say why, so it isn't raised again for the same reason."}
        confirmLabel={dialog === 'resolve' ? 'Resolve' : 'Dismiss'}
        cancelLabel="Back"
        loading={transition.isPending}
        onCancel={() => {
          setDialog(null);
          setNoteError(undefined);
        }}
        onConfirm={() => {
          if (dialog === 'dismiss' && !note.trim()) {
            setNoteError('Add a short reason.');
            return;
          }
          transition.mutate(
            { action: dialog === 'resolve' ? 'resolve' : 'dismiss', note: note.trim() || undefined },
            {
              onSuccess: () => {
                setDialog(null);
                setNote('');
              },
            },
          );
        }}
      >
        <TextField
          label={dialog === 'resolve' ? 'What did you do?' : 'Reason'}
          optional={dialog === 'resolve'}
          multiline
          rows={3}
          value={note}
          onChangeText={(t) => {
            setNote(t);
            setNoteError(undefined);
          }}
          error={noteError}
          maxLength={300}
        />
      </ConfirmDialog>
    </>
  );
}

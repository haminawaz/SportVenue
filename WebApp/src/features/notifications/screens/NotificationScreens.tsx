'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowSquareOut, BellSimple, BellSimpleSlash, Checks, EnvelopeSimple } from '@phosphor-icons/react';

import { NOTIFICATION_TYPE } from '@/domain/labels';
import type { AppNotification, NotificationLink } from '@/domain/types';
import { nowLocalIn } from '@/lib/datetime';
import { formatDateTimeLocal, formatRelative, useFormat } from '@/lib/format';
import { useRouteParam } from '@/navigation/params';
import { routes, type Href } from '@/navigation/routes';
import { notePush, useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { cn } from '@/ui/cn';
import { TableSkeleton } from '@/ui/DataTable';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Page, PageHeader } from '@/ui/Page';
import { useRegisterRefresh } from '@/ui/Refresh';
import { Toolbar } from '@/ui/SearchBar';
import { QueryView } from '@/ui/States';
import { Spinner } from '@/ui/Spinner';
import { SegmentedControl } from '@/ui/Tabs';
import { toUserFacingError } from '@/api/errors';

import { useMarkAllRead, useMarkRead, useMarkUnread, useNotification, useNotifications, useUnreadCount, type NotificationFilter } from '../api';

const LINK_LABEL: Record<NotificationLink['kind'], string> = {
  booking: 'Open booking',
  customer: 'Open customer',
  payment: 'Open payment',
  court: 'Open court',
  opportunity: 'Open opportunity',
};

export function linkHref(link: NotificationLink): Href {
  switch (link.kind) {
    case 'booking':
      return routes.booking(link.id);
    case 'customer':
      return routes.customer(link.id);
    case 'payment':
      return routes.payment(link.id);
    case 'court':
      return routes.court(link.id);
    case 'opportunity':
      return routes.opportunity(link.id);
  }
}

type TypeFilter = 'ALL' | NonNullable<NotificationFilter['type']>;

export function NotificationsScreen() {
  const [unreadOnly, setUnreadOnly] = useState<'all' | 'unread'>('all');
  const [type, setType] = useState<TypeFilter>('ALL');
  const query = useNotifications({ filter: unreadOnly === 'unread' ? 'unread' : undefined, type: type === 'ALL' ? undefined : type });
  const unread = useUnreadCount();
  const markAll = useMarkAllRead();
  const count = unread.data?.count ?? 0;
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  useRegisterRefresh(() => Promise.all([query.refetch(), unread.refetch()]));

  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) void fetchNextPage();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);

  let body;
  if (query.isPending) body = <TableSkeleton rows={6} columns={3} />;
  else if (query.isError && items.length === 0) {
    const err = toUserFacingError(query.error, "Couldn't load this list");
    body = <ErrorState plain title={err.title} message={err.message} onRetry={err.retryable ? () => void query.refetch() : undefined} retrying={query.isFetching} />;
  } else if (items.length === 0) {
    body =
      unreadOnly === 'unread' ? (
        <EmptyState icon={Checks} title="You're all caught up" message="No unread notifications." />
      ) : (
        <EmptyState icon={BellSimpleSlash} title="No notifications" message="Booking reminders, payments and system updates appear here." />
      );
  } else {
    body = (
      <>
        <ul className="divide-y divide-border">
          {items.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </ul>
        <div ref={sentinel} aria-hidden className="h-px" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4 text-accent">
            <Spinner label="Loading more" />
          </div>
        )}
      </>
    );
  }

  return (
    <Page width="narrow">
      <PageHeader title="Notifications" description={count ? `${count} unread` : 'Booking reminders, payments and system updates.'} actions={count > 0 && <Button label="Mark all as read" icon={Checks} variant="secondary" onPress={() => markAll.mutate()} loading={markAll.isPending} />} />
      <Card padded={false}>
        <Toolbar>
          <SegmentedControl
            label="Show"
            value={unreadOnly}
            onChange={setUnreadOnly}
            options={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: count ? `Unread (${count})` : 'Unread' },
            ]}
          />
          <SegmentedControl
            label="Type"
            value={type}
            onChange={setType}
            options={[
              { value: 'ALL', label: 'Everything' },
              { value: 'BOOKING', label: 'Bookings' },
              { value: 'PAYMENT', label: 'Payments' },
              { value: 'SYSTEM', label: 'System' },
            ]}
          />
        </Toolbar>
        {body}
      </Card>
    </Page>
  );
}

const NotificationRow = memo(function NotificationRow({ notification: n }: { notification: AppNotification }) {
  const f = useFormat();
  const meta = NOTIFICATION_TYPE[n.type];
  const Icon = meta.icon;
  const when = formatRelative(n.createdAt, nowLocalIn(f.timeZone));
  return (
    <li>
      <Link
        href={routes.notification(n.id)}
        onClick={notePush}
        aria-label={`${n.read ? '' : 'Unread. '}${meta.label}. ${n.title}. ${n.body}. ${when}`}
        className={cn('flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted/60', !n.read && 'bg-accent-soft/30')}
      >
        <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', n.read ? 'bg-surface-muted text-text-muted' : 'bg-accent-soft text-accent')}>
          <Icon size={16} aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-baseline gap-2">
            <AppText variant={n.read ? 'text' : 'text-strong'} lines={1} className="flex-1">
              {n.title}
            </AppText>
            <AppText variant="mini" tone="subtle" numeric className="shrink-0">
              {when}
            </AppText>
          </span>
          <AppText variant="small" tone="muted" lines={2}>
            {n.body}
          </AppText>
        </span>
        <span aria-hidden className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-accent')} />
      </Link>
    </li>
  );
});

export function NotificationDetailScreen() {
  const id = useRouteParam('id');
  const query = useNotification(id);
  return (
    <Page width="narrow">
      <QueryView query={query} errorTitle="Couldn't load notification">
        {(n) => <NotificationBody notification={n} />}
      </QueryView>
    </Page>
  );
}

function NotificationBody({ notification: n }: { notification: AppNotification }) {
  const router = useAppRouter();
  const f = useFormat();
  const markRead = useMarkRead();
  const markUnread = useMarkUnread();
  const meta = NOTIFICATION_TYPE[n.type];
  const Icon = meta.icon;
  const marked = useRef(false);

  // Opening a notification reads it (once, so "mark as unread" sticks).
  const { mutate: read } = markRead;
  useEffect(() => {
    if (!n.read && !marked.current) {
      marked.current = true;
      read(n.id);
    }
  }, [n.id, n.read, read]);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Notifications', href: routes.notifications }, { label: meta.label }]}
        title={n.title}
        description={formatDateTimeLocal(n.createdAt, f.today())}
        actions={
          n.read ? (
            <Button label="Mark as unread" icon={EnvelopeSimple} variant="secondary" onPress={() => markUnread.mutate(n.id, { onSuccess: () => router.back(routes.notifications) })} />
          ) : (
            <Button label="Mark as read" icon={BellSimple} variant="secondary" onPress={() => markRead.mutate(n.id)} />
          )
        }
        hideRefresh
      />
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-accent">
          <Icon size={18} aria-hidden />
          <AppText variant="label" tone="muted">
            {meta.label}
          </AppText>
        </div>
        <AppText as="p">{n.body}</AppText>
        {n.link && (
          <div>
            <Button label={LINK_LABEL[n.link.kind]} icon={ArrowSquareOut} onPress={() => router.push(linkHref(n.link!))} />
          </div>
        )}
      </Card>
    </>
  );
}

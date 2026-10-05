'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { ArrowSquareOut, BellSimple, BellSimpleSlash, Checks, EnvelopeSimple } from '@phosphor-icons/react';

import { NOTIFICATION_TYPE } from '@/domain/labels';
import type { AppNotification, NotificationLink } from '@/domain/types';
import { nowLocalIn } from '@/lib/datetime';
import { formatDateTimeLocal, formatRelative, useFormat } from '@/lib/format';
import { useRouteParam } from '@/navigation/params';
import { routes, type Href } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip, ChipRow, SegmentedControl } from '@/ui/Chips';
import { cn } from '@/ui/cn';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { InfiniteList } from '@/ui/InfiniteList';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { StackHeader } from '@/ui/StackHeader';
import { QueryView } from '@/ui/States';

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

export function NotificationsScreen() {
  const router = useAppRouter();
  const [unreadOnly, setUnreadOnly] = useState<'all' | 'unread'>('all');
  const [type, setType] = useState<NotificationFilter['type']>();
  const query = useNotifications({ filter: unreadOnly === 'unread' ? 'unread' : undefined, type });
  const unread = useUnreadCount();
  const markAll = useMarkAllRead();
  const count = unread.data?.count ?? 0;

  return (
    <>
      <StackHeader
        title="Notifications"
        headerRight={count > 0 ? <IconButton icon={Checks} label="Mark all as read" size="sm" onPress={() => markAll.mutate()} disabled={markAll.isPending} /> : undefined}
      />
      <InfiniteList
        query={query}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => <NotificationRow notification={item} onPress={() => router.push(routes.notification(item.id))} />}
        header={
          <div className="flex flex-col gap-4">
            <SegmentedControl
              label="Show"
              value={unreadOnly}
              onChange={setUnreadOnly}
              options={[
                { value: 'all', label: 'All' },
                { value: 'unread', label: count ? `Unread (${count})` : 'Unread' },
              ]}
            />
            <ChipRow>
              <Chip label="Everything" selected={!type} onPress={() => setType(undefined)} />
              <Chip label="Bookings" selected={type === 'BOOKING'} onPress={() => setType('BOOKING')} />
              <Chip label="Payments" selected={type === 'PAYMENT'} onPress={() => setType('PAYMENT')} />
              <Chip label="System" selected={type === 'SYSTEM'} onPress={() => setType('SYSTEM')} />
            </ChipRow>
          </div>
        }
        empty={
          unreadOnly === 'unread' ? (
            <EmptyState icon={Checks} title="You're all caught up" message="No unread notifications." />
          ) : (
            <EmptyState icon={BellSimpleSlash} title="No notifications" message="Booking reminders, payments and system updates appear here." />
          )
        }
      />
    </>
  );
}

const NotificationRow = memo(function NotificationRow({ notification: n, onPress }: { notification: AppNotification; onPress: () => void }) {
  const f = useFormat();
  const meta = NOTIFICATION_TYPE[n.type];
  const Icon = meta.icon;
  const when = formatRelative(n.createdAt, nowLocalIn(f.timeZone));
  return (
    <button
      type="button"
      aria-label={`${n.read ? '' : 'Unread. '}${meta.label}. ${n.title}. ${n.body}. ${when}`}
      onClick={onPress}
      className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-muted/60 active:bg-surface-muted"
    >
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', n.read ? 'bg-surface-muted text-text-muted' : 'bg-accent-soft text-accent')}>
        <Icon size={22} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="mb-0.5 flex items-center gap-2">
          <AppText variant={n.read ? 'body-md' : 'body-strong'} lines={1} className="flex-1">
            {n.title}
          </AppText>
          <AppText variant="body-sm" tone="subtle" numeric className="shrink-0">
            {when}
          </AppText>
        </span>
        <AppText variant="body-sm" tone="muted" lines={2}>
          {n.body}
        </AppText>
      </span>
      {/* Semantic unread marker; the row label and weight also say it. */}
      <span aria-hidden className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-accent')} />
    </button>
  );
});

export function NotificationDetailScreen() {
  const id = useRouteParam('id');
  const query = useNotification(id);
  return (
    <>
      <StackHeader title="Notification" />
      <Screen>
        <QueryView query={query} errorTitle="Couldn't load notification">
          {(n) => <NotificationBody notification={n} />}
        </QueryView>
      </Screen>
    </>
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
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Icon size={20} aria-hidden />
          </span>
          <AppText variant="nav-link" tone="muted" className="flex-1">
            {meta.label}
          </AppText>
        </div>
        <AppText as="h2" variant="display-lg" className="mt-4">
          {n.title}
        </AppText>
        <AppText variant="body-sm" tone="muted" className="mt-1">
          {formatDateTimeLocal(n.createdAt, f.today())}
        </AppText>
        <AppText as="p" className="mt-4">
          {n.body}
        </AppText>
        {n.link && (
          <div className="mt-4">
            <Button label={LINK_LABEL[n.link.kind]} icon={ArrowSquareOut} onPress={() => router.push(linkHref(n.link!))} />
          </div>
        )}
      </Card>
      <ListGroup>
        {n.read ? (
          <ListRow title="Mark as unread" icon={EnvelopeSimple} onPress={() => markUnread.mutate(n.id, { onSuccess: () => router.back(routes.notifications) })} />
        ) : (
          <ListRow title="Mark as read" icon={BellSimple} onPress={() => markRead.mutate(n.id)} />
        )}
      </ListGroup>
    </>
  );
}

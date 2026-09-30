import { memo, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ArrowSquareOut, BellSimple, BellSimpleSlash, Checks, EnvelopeSimple } from 'phosphor-react-native';

import { NOTIFICATION_TYPE } from '@/domain/labels';
import type { AppNotification, NotificationLink } from '@/domain/types';
import { nowLocalIn } from '@/lib/datetime';
import { formatDateTimeLocal, formatRelative, useFormat } from '@/lib/format';
import { routes } from '@/navigation/routes';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip, ChipRow, SegmentedControl } from '@/ui/Chips';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { InfiniteList } from '@/ui/InfiniteList';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
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
  const router = useRouter();
  const [unreadOnly, setUnreadOnly] = useState<'all' | 'unread'>('all');
  const [type, setType] = useState<NotificationFilter['type']>();
  const query = useNotifications({ filter: unreadOnly === 'unread' ? 'unread' : undefined, type });
  const unread = useUnreadCount();
  const markAll = useMarkAllRead();
  const count = unread.data?.count ?? 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerRight: count > 0 ? () => <IconButton icon={Checks} label="Mark all as read" onPress={() => markAll.mutate()} disabled={markAll.isPending} /> : undefined,
        }}
      />
      <InfiniteList
        query={query}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => <NotificationRow notification={item} onPress={() => router.push(routes.notification(item.id))} />}
        header={
          <View style={styles.header}>
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
          </View>
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
  const { colors } = useTheme();
  const f = useFormat();
  const meta = NOTIFICATION_TYPE[n.type];
  const Icon = meta.icon;
  const when = formatRelative(n.createdAt, nowLocalIn(f.timeZone));
  return (
    <Pressable
      role="button"
      aria-label={`${n.read ? '' : 'Unread. '}${meta.label}. ${n.title}. ${n.body}. ${when}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}
    >
      <View style={[styles.icon, { backgroundColor: n.read ? colors.surfaceMuted : colors.accentSoft }]}>
        <Icon size={22} color={n.read ? colors.textMuted : colors.accent} />
      </View>
      <View style={styles.flex}>
        <View style={styles.titleRow}>
          <AppText variant={n.read ? 'body-md' : 'body-strong'} numberOfLines={1} style={styles.flex}>
            {n.title}
          </AppText>
          <AppText variant="body-sm" tone="subtle" numeric>
            {when}
          </AppText>
        </View>
        <AppText variant="body-sm" tone="muted" numberOfLines={2}>
          {n.body}
        </AppText>
      </View>
      {/* Semantic unread marker; the row label and weight also say it. */}
      <View style={[styles.dot, { backgroundColor: n.read ? 'transparent' : colors.accent }]} />
    </Pressable>
  );
});

export function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useNotification(id);
  return (
    <>
      <Stack.Screen options={{ title: 'Notification' }} />
      <Screen>
        <QueryView query={query} errorTitle="Couldn't load notification">
          {(n) => <NotificationBody notification={n} />}
        </QueryView>
      </Screen>
    </>
  );
}

function NotificationBody({ notification: n }: { notification: AppNotification }) {
  const router = useRouter();
  const { colors } = useTheme();
  const f = useFormat();
  const markRead = useMarkRead();
  const markUnread = useMarkUnread();
  const meta = NOTIFICATION_TYPE[n.type];
  const Icon = meta.icon;
  const marked = useRef(false);

  // Opening a notification reads it (once, so "mark as unread" sticks).
  useEffect(() => {
    if (!n.read && !marked.current) {
      marked.current = true;
      markRead.mutate(n.id);
    }
  }, [n.id, n.read, markRead]);

  return (
    <>
      <Card>
        <View style={styles.detailHead}>
          <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
            <Icon size={20} color={colors.accent} />
          </View>
          <AppText variant="nav-link" tone="muted" style={styles.flex}>
            {meta.label}
          </AppText>
        </View>
        <AppText variant="display-lg" style={styles.gapTop}>
          {n.title}
        </AppText>
        <AppText variant="body-sm" tone="muted" style={styles.gapSmall}>
          {formatDateTimeLocal(n.createdAt, f.today())}
        </AppText>
        <AppText style={styles.gapTop}>{n.body}</AppText>
        {n.link && (
          <View style={styles.gapTop}>
            <Button label={LINK_LABEL[n.link.kind]} icon={ArrowSquareOut} onPress={() => router.push(linkHref(n.link!))} />
          </View>
        )}
      </Card>
      <ListGroup>
        {n.read ? (
          <ListRow title="Mark as unread" icon={EnvelopeSimple} onPress={() => markUnread.mutate(n.id, { onSuccess: () => router.back() })} />
        ) : (
          <ListRow title="Mark as read" icon={BellSimple} onPress={() => markRead.mutate(n.id)} />
        )}
      </ListGroup>
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  icon: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xxs },
  dot: { width: 10, height: 10, borderRadius: radius.full, marginTop: 6 },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  gapTop: { marginTop: spacing.lg },
  gapSmall: { marginTop: spacing.xs },
});

'use client';

import { useState } from 'react';
import { Bell, Buildings, CaretRight, ChartLine, CourtBasketball, Gear, Lightbulb, SignOut } from '@phosphor-icons/react';

import { useUnreadCount } from '@/features/notifications/api';
import { useOpportunities } from '@/features/opportunities/api';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { useAuth, useSession } from '@/session/SessionProvider';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { PressableCard } from '@/ui/Card';
import { ConfirmDialog } from '@/ui/Dialogs';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { StatusBadge } from '@/ui/StatusBadge';

export function MoreScreen() {
  const router = useAppRouter();
  const { session } = useSession();
  const unread = useUnreadCount();
  const open = useOpportunities(['OPEN']);
  const { user, facility } = session;
  const name = `${user.firstName} ${user.lastName}`;

  return (
    <Screen title="More">
      <PressableCard onPress={() => router.push(routes.profile)} aria-label={`${name}, owner of ${facility.name}`} title="Opens your profile">
        <span className="flex items-center gap-4">
          <Avatar name={name} size={56} tone="accent" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <AppText variant="title-md" lines={1}>
              {name}
            </AppText>
            <AppText variant="body-sm" tone="muted" lines={2}>
              Owner, {facility.name}
            </AppText>
          </span>
          <CaretRight size={18} weight="bold" className="shrink-0 text-text-subtle" aria-hidden />
        </span>
      </PressableCard>

      <ListGroup title="Run the business">
        <ListRow icon={CourtBasketball} title="Courts and pricing" subtitle="Schedules, rates and discounts for each court" onPress={() => router.push(routes.courts)} />
        <ListRow
          icon={Lightbulb}
          title="Revenue opportunities"
          subtitle={open.data?.length ? `${open.data.length} open to review` : 'Ways to fill courts and collect payments'}
          onPress={() => router.push(routes.opportunities)}
        />
        <ListRow icon={ChartLine} title="Analytics" subtitle="Revenue, utilization and peak hours" onPress={() => router.push(routes.analytics)} />
      </ListGroup>

      <ListGroup title="Facility">
        <ListRow icon={Buildings} title="Facility profile" subtitle="Contact details, hours and settings" onPress={() => router.push(routes.facility)} />
        <ListRow
          icon={Bell}
          title="Notifications"
          trailing={unread.data?.count ? <StatusBadge label={`${unread.data.count} new`} tone="positive" /> : undefined}
          onPress={() => router.push(routes.notifications)}
        />
        <ListRow icon={Gear} title="Settings" subtitle="Account, appearance and billing" onPress={() => router.push(routes.settings)} />
      </ListGroup>

      <LogoutRow />
    </Screen>
  );
}

export function LogoutRow() {
  const { signOut } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <ListGroup>
        <ListRow title="Log out" icon={SignOut} destructive onPress={() => setConfirm(true)} />
      </ListGroup>
      <ConfirmDialog
        visible={confirm}
        title="Log out of SportVenue?"
        message="You'll need your email and password to log back in on this device."
        confirmLabel="Log out"
        cancelLabel="Stay"
        destructive
        loading={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setBusy(true);
          await signOut();
        }}
      />
    </>
  );
}

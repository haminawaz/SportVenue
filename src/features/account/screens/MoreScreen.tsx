import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Bell, Buildings, ChartLine, Gear, Lightbulb, Receipt, SignOut, Tag } from 'phosphor-react-native';

import { useUnreadCount } from '@/features/notifications/api';
import { useOpportunities } from '@/features/opportunities/api';
import { routes } from '@/navigation/routes';
import { useAuth, useSession } from '@/session/SessionProvider';
import { Avatar } from '@/ui/Avatar';
import { ConfirmDialog } from '@/ui/Dialogs';
import { LargeTitle } from '@/ui/LargeTitle';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { StatusBadge } from '@/ui/StatusBadge';

export function MoreScreen() {
  const router = useRouter();
  const { session, can } = useSession();
  const unread = useUnreadCount();
  const open = useOpportunities(['OPEN']);
  const { user, facility } = session;

  return (
    <Screen topInset>
      <LargeTitle title="More" />
      <ListGroup>
        <ListRow
          leading={<Avatar name={`${user.firstName} ${user.lastName}`} size={48} tone="accent" />}
          title={`${user.firstName} ${user.lastName}`}
          subtitle={facility.name}
          onPress={() => router.push(routes.profile)}
          hint="Opens your profile"
        />
      </ListGroup>

      <ListGroup title="Business">
        {can('payment.view') && <ListRow icon={Receipt} title="Payments" subtitle="Outstanding balances and received payments" onPress={() => router.push(routes.payments())} />}
        {can('opportunity.view') && (
          <ListRow
            icon={Lightbulb}
            title="Revenue opportunities"
            subtitle="Suggested actions to fill courts and collect payments"
            trailing={open.data?.length ? <StatusBadge label={`${open.data.length} open`} tone="warning" /> : undefined}
            onPress={() => router.push(routes.opportunities)}
          />
        )}
        {can('analytics.view') && <ListRow icon={ChartLine} title="Analytics" subtitle="Revenue, utilization, peak hours and customers" onPress={() => router.push(routes.analytics)} />}
        {can('pricing.view') && <ListRow icon={Tag} title="Pricing" subtitle="Rates, peak pricing and discounts" onPress={() => router.push(routes.pricing())} />}
      </ListGroup>

      <ListGroup title="Facility">
        <ListRow icon={Buildings} title="Facility profile" subtitle="Contact details, hours and settings" onPress={() => router.push(routes.facility)} />
        <ListRow
          icon={Bell}
          title="Notifications"
          trailing={unread.data?.count ? <StatusBadge label={`${unread.data.count} new`} tone="positive" /> : undefined}
          onPress={() => router.push(routes.notifications)}
        />
        <ListRow icon={Gear} title="Settings" subtitle="Account, notifications and billing" onPress={() => router.push(routes.settings)} />
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
        title="Log out of CoyoteOS?"
        message="You'll need your email and password to sign back in on this phone."
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

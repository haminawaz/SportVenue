import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Buildings, CaretRight, CourtBasketball, Gear, Lightbulb, SignOut } from 'phosphor-react-native';

import { useUnreadCount } from '@/features/notifications/api';
import { useOpportunities } from '@/features/opportunities/api';
import { routes } from '@/navigation/routes';
import { useAuth, useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { PressableCard } from '@/ui/Card';
import { ConfirmDialog } from '@/ui/Dialogs';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { StatusBadge } from '@/ui/StatusBadge';

export function MoreScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { session } = useSession();
  const unread = useUnreadCount();
  const open = useOpportunities(['OPEN']);
  const { user, facility } = session;
  const name = `${user.firstName} ${user.lastName}`;

  return (
    <Screen title="More">

      <PressableCard onPress={() => router.push(routes.profile)} aria-label={`${name}, owner of ${facility.name}`} accessibilityHint="Opens your profile">
        <View style={styles.profile}>
          <Avatar name={name} size={56} tone="accent" />
          <View style={styles.flex}>
            <AppText variant="title-md" numberOfLines={1}>
              {name}
            </AppText>
            <AppText variant="body-sm" tone="muted" numberOfLines={2}>
              Owner, {facility.name}
            </AppText>
          </View>
          <CaretRight size={18} color={colors.textSubtle} weight="bold" />
        </View>
      </PressableCard>

      <ListGroup title="Run the business">
        <ListRow icon={CourtBasketball} title="Courts and pricing" subtitle="Schedules, rates and discounts for each court" onPress={() => router.push(routes.courts)} />
        <ListRow
          icon={Lightbulb}
          title="Revenue opportunities"
          subtitle={open.data?.length ? `${open.data.length} open to review` : 'Ways to fill courts and collect payments'}
          onPress={() => router.push(routes.opportunities)}
        />
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

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  flex: { flex: 1, gap: spacing.xxs },
});

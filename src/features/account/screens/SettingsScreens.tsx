import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Bell, Buildings, CreditCard, UserCircle } from 'phosphor-react-native';

import type { NotificationPreferences } from '@/domain/types';
import { rules, useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { useAuth, useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { SwitchRow, TextField } from '@/ui/Fields';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { SelectField } from '@/ui/Select';
import { QueryView } from '@/ui/States';
import { AppText } from '@/ui/AppText';
import { useToast } from '@/ui/Toast';
import { useAppMutation } from '@/api/useAppMutation';

import { accountService, usePreferences, useSavePreferences } from '../api';
import { LogoutRow } from './MoreScreen';

export function SettingsScreen() {
  const router = useRouter();
  const { can } = useSession();
  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <Screen>
        <ListGroup title="Account">
          <ListRow icon={UserCircle} title="Profile" subtitle="Name, email and phone" onPress={() => router.push(routes.profile)} />
          <ListRow icon={Bell} title="Notification preferences" subtitle="Reminders and alerts you receive" onPress={() => router.push(routes.notificationPreferences)} />
        </ListGroup>
        <ListGroup title="Facility">
          <ListRow icon={Buildings} title="Facility settings" subtitle="Profile, hours, currency and timezone" onPress={() => router.push(routes.facility)} />
          {can('billing.manage') && <ListRow icon={CreditCard} title="Subscription and billing" onPress={() => router.push(routes.billing)} />}
        </ListGroup>
        <LogoutRow />
      </Screen>
    </>
  );
}

/* ------------------------------------------------------------------ profile */

type ProfileValues = { firstName: string; lastName: string; email: string; phone: string };

export function ProfileScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { refreshSession } = useAuth();
  const save = useAppMutation({ mutationFn: accountService.updateProfile, successMessage: 'Profile saved', errorTitle: "Couldn't save profile" });
  const [saving, setSaving] = useState(false);
  const u = session.user;
  const form = useForm<ProfileValues>(
    { firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone ?? '' },
    useCallback(
      (v: ProfileValues) => ({
        firstName: v.firstName.trim() ? undefined : 'Enter your first name.',
        lastName: v.lastName.trim() ? undefined : 'Enter your last name.',
        email: rules.email(v.email),
        phone: rules.phone(v.phone, false),
      }),
      [],
    ),
  );

  const submit = async () => {
    setSaving(true);
    const ok = await form.submit(async (v) => {
      await save.mutateAsync({ firstName: v.firstName.trim(), lastName: v.lastName.trim(), email: v.email.trim().toLowerCase(), phone: v.phone.trim() || undefined });
      await refreshSession();
    });
    setSaving(false);
    if (ok) router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
      <Screen keyboard footer={<Button label="Save profile" block onPress={submit} loading={saving} disabled={!form.dirty} />}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField label="First name" value={form.values.firstName} onChangeText={(t) => form.set('firstName', t)} error={form.errors.firstName} autoComplete="given-name" />
          </View>
          <View style={styles.flex}>
            <TextField label="Last name" value={form.values.lastName} onChangeText={(t) => form.set('lastName', t)} error={form.errors.lastName} autoComplete="family-name" />
          </View>
        </View>
        <TextField label="Email" value={form.values.email} onChangeText={(t) => form.set('email', t)} error={form.errors.email} keyboardType="email-address" autoCapitalize="none" helper="You sign in with this email." />
        <TextField label="Phone" optional value={form.values.phone} onChangeText={(t) => form.set('phone', t)} error={form.errors.phone} keyboardType="phone-pad" />
      </Screen>
    </>
  );
}

/* ------------------------------------------------------------------ notification preferences */

export function NotificationPreferencesScreen() {
  const query = usePreferences();
  return (
    <>
      <Stack.Screen options={{ title: 'Notifications' }} />
      <Screen>
        <QueryView query={query} errorTitle="Couldn't load preferences">
          {(p) => <PreferencesForm initial={p} />}
        </QueryView>
      </Screen>
    </>
  );
}

function PreferencesForm({ initial }: { initial: NotificationPreferences }) {
  const { colors } = useTheme();
  const toast = useToast();
  const save = useSavePreferences();
  const [prefs, setPrefs] = useState(initial);

  /** Saves each change immediately; rolls back if the server refuses. */
  const change = <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    save.mutate({ [key]: value }, { onError: () => setPrefs(previous), onSuccess: () => toast.show('Saved') });
  };

  const box = [styles.group, { backgroundColor: colors.surface, borderColor: colors.border }];
  const off = !prefs.push && !prefs.email;

  return (
    <>
      <View>
        <AppText variant="label" tone="muted" style={styles.label}>
          Send to
        </AppText>
        <View style={box}>
          <SwitchRow label="Push notifications" description="On this phone" value={prefs.push} onChange={(v) => change('push', v)} />
          <SwitchRow label="Email" description="To your account email" value={prefs.email} onChange={(v) => change('email', v)} />
        </View>
        {off && (
          <AppText variant="caption" tone="warning" style={styles.label}>
            Everything below is paused until push or email is on.
          </AppText>
        )}
      </View>
      <View>
        <AppText variant="label" tone="muted" style={styles.label}>
          Bookings
        </AppText>
        <View style={box}>
          <SwitchRow label="Upcoming booking reminders" value={prefs.bookingReminders} onChange={(v) => change('bookingReminders', v)} disabled={off} />
          <SwitchRow label="New bookings" value={prefs.newBookings} onChange={(v) => change('newBookings', v)} disabled={off} />
          <SwitchRow label="Cancellations" value={prefs.cancellations} onChange={(v) => change('cancellations', v)} disabled={off} />
        </View>
      </View>
      {prefs.bookingReminders && !off && (
        <SelectField
          label="Remind me"
          value={String(prefs.reminderLeadMinutes)}
          options={[
            { value: '30', label: '30 minutes before' },
            { value: '60', label: '1 hour before' },
            { value: '120', label: '2 hours before' },
            { value: '1440', label: 'The day before' },
          ]}
          onChange={(v) => change('reminderLeadMinutes', Number(v) as NotificationPreferences['reminderLeadMinutes'])}
        />
      )}
      <View>
        <AppText variant="label" tone="muted" style={styles.label}>
          Payments and summaries
        </AppText>
        <View style={box}>
          <SwitchRow label="Unpaid balance reminders" value={prefs.paymentReminders} onChange={(v) => change('paymentReminders', v)} disabled={off} />
          <SwitchRow label="Payments received" value={prefs.paymentsReceived} onChange={(v) => change('paymentsReceived', v)} disabled={off} />
          <SwitchRow label="Daily summary" description="Yesterday's revenue and today's bookings, each morning" value={prefs.dailySummary} onChange={(v) => change('dailySummary', v)} disabled={off} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  group: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  label: { paddingHorizontal: spacing.xs, marginBottom: spacing.sm },
});

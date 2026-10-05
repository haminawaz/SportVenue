'use client';

import { useCallback, useState } from 'react';
import { Bell, Buildings, CreditCard, UserCircle } from '@phosphor-icons/react';

import { useAppMutation } from '@/api/useAppMutation';
import type { NotificationPreferences } from '@/domain/types';
import { rules, useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { useAuth, useSession } from '@/session/SessionProvider';
import { useTheme, type Appearance } from '@/theme/ThemeProvider';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { SegmentedControl } from '@/ui/Chips';
import { SwitchRow, TextField } from '@/ui/Fields';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { SelectField } from '@/ui/Select';
import { StackHeader } from '@/ui/StackHeader';
import { QueryView } from '@/ui/States';
import { useToast } from '@/ui/Toast';

import { accountService, usePreferences, useSavePreferences } from '../api';
import { LogoutRow } from './MoreScreen';

export function SettingsScreen() {
  const router = useAppRouter();
  const { appearance, setAppearance } = useTheme();
  return (
    <>
      <StackHeader title="Settings" />
      <Screen>
        <ListGroup title="Account">
          <ListRow icon={UserCircle} title="Profile" subtitle="Name, email and phone" onPress={() => router.push(routes.profile)} />
          <ListRow icon={Bell} title="Notification preferences" subtitle="Reminders and alerts you receive" onPress={() => router.push(routes.notificationPreferences)} />
        </ListGroup>
        <section className="flex flex-col gap-3">
          <AppText as="h2" variant="display-sm">
            Appearance
          </AppText>
          <SegmentedControl<Appearance>
            label="Appearance"
            value={appearance}
            onChange={setAppearance}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <AppText variant="body-sm" tone="muted">
            System follows your device setting.
          </AppText>
        </section>
        <ListGroup title="Facility">
          <ListRow icon={Buildings} title="Facility settings" subtitle="Profile, hours, currency and timezone" onPress={() => router.push(routes.facility)} />
          <ListRow icon={CreditCard} title="Subscription and billing" onPress={() => router.push(routes.billing)} />
        </ListGroup>
        <LogoutRow />
      </Screen>
    </>
  );
}

/* ------------------------------------------------------------------ profile */

type ProfileValues = { firstName: string; lastName: string; email: string; phone: string };

export function ProfileScreen() {
  const router = useAppRouter();
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
    if (ok) router.back(routes.settings);
  };

  return (
    <>
      <StackHeader title="Profile" />
      <Screen footer={<Button label="Save profile" block onPress={submit} loading={saving} disabled={!form.dirty} />}>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="First name" value={form.values.firstName} onChangeText={(t) => form.set('firstName', t)} error={form.errors.firstName} autoComplete="given-name" />
          <TextField label="Last name" value={form.values.lastName} onChangeText={(t) => form.set('lastName', t)} error={form.errors.lastName} autoComplete="family-name" />
        </div>
        <TextField label="Email" value={form.values.email} onChangeText={(t) => form.set('email', t)} error={form.errors.email} type="email" autoCapitalize="none" autoComplete="email" helper="You sign in with this email." />
        <TextField label="Phone" optional value={form.values.phone} onChangeText={(t) => form.set('phone', t)} error={form.errors.phone} type="tel" autoComplete="tel" />
      </Screen>
    </>
  );
}

/* ------------------------------------------------------------------ notification preferences */

export function NotificationPreferencesScreen() {
  const query = usePreferences();
  return (
    <>
      <StackHeader title="Notifications" />
      <Screen>
        <QueryView query={query} errorTitle="Couldn't load preferences">
          {(p) => <PreferencesForm initial={p} />}
        </QueryView>
      </Screen>
    </>
  );
}

function PreferencesForm({ initial }: { initial: NotificationPreferences }) {
  const toast = useToast();
  const save = useSavePreferences();
  const [prefs, setPrefs] = useState(initial);

  /** Saves each change immediately; rolls back if the server refuses. */
  const change = <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    save.mutate({ [key]: value }, { onError: () => setPrefs(previous), onSuccess: () => toast.show('Saved') });
  };

  const box = 'overflow-hidden rounded-card border border-border bg-surface';
  const off = !prefs.push && !prefs.email;

  return (
    <>
      <section>
        <AppText as="h2" variant="nav-link" tone="muted" className="mb-2 px-1">
          Send to
        </AppText>
        <div className={box}>
          <SwitchRow label="Push notifications" description="On your phone, through the SportVenue app" value={prefs.push} onChange={(v) => change('push', v)} />
          <SwitchRow label="Email" description="To your account email" value={prefs.email} onChange={(v) => change('email', v)} />
        </div>
        {off && (
          <AppText variant="body-sm" tone="warning" className="mt-2 px-1">
            Everything below is paused until push or email is on.
          </AppText>
        )}
      </section>
      <section>
        <AppText as="h2" variant="nav-link" tone="muted" className="mb-2 px-1">
          Bookings
        </AppText>
        <div className={box}>
          <SwitchRow label="Upcoming booking reminders" value={prefs.bookingReminders} onChange={(v) => change('bookingReminders', v)} disabled={off} />
          <SwitchRow label="New bookings" value={prefs.newBookings} onChange={(v) => change('newBookings', v)} disabled={off} />
          <SwitchRow label="Cancellations" value={prefs.cancellations} onChange={(v) => change('cancellations', v)} disabled={off} />
        </div>
      </section>
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
      <section>
        <AppText as="h2" variant="nav-link" tone="muted" className="mb-2 px-1">
          Payments and summaries
        </AppText>
        <div className={box}>
          <SwitchRow label="Unpaid balance reminders" value={prefs.paymentReminders} onChange={(v) => change('paymentReminders', v)} disabled={off} />
          <SwitchRow label="Payments received" value={prefs.paymentsReceived} onChange={(v) => change('paymentsReceived', v)} disabled={off} />
          <SwitchRow label="Daily summary" description="Yesterday's revenue and today's bookings, each morning" value={prefs.dailySummary} onChange={(v) => change('dailySummary', v)} disabled={off} />
        </div>
      </section>
    </>
  );
}

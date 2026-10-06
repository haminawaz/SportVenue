'use client';

import { useCallback, useState } from 'react';
import { SignOut } from '@phosphor-icons/react';

import { LogoutDialog } from '@/app-shell/AppShell';
import { useAppMutation } from '@/api/useAppMutation';
import type { NotificationPreferences } from '@/domain/types';
import { rules, useForm } from '@/lib/useForm';
import { useAuth, useSession } from '@/session/SessionProvider';
import { useTheme, type Appearance } from '@/theme/ThemeProvider';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { SelectField, SwitchRow, TextField } from '@/ui/Fields';
import { FormSection } from '@/ui/Page';
import { QueryView } from '@/ui/States';
import { SegmentedControl } from '@/ui/Tabs';
import { useToast } from '@/ui/Toast';

import { accountService, usePreferences, useSavePreferences } from '../api';
import { SettingsLayout } from '../components/SettingsLayout';

/* ------------------------------------------------------------------ general */

export function SettingsScreen() {
  const { appearance, setAppearance } = useTheme();
  const { session } = useSession();
  const [logout, setLogout] = useState(false);
  const name = `${session.user.firstName} ${session.user.lastName}`;
  return (
    <SettingsLayout>
      <Card>
        <FormSection title="Account" description="You are the owner of this facility.">
          <div className="flex items-center gap-3">
            <Avatar name={name} size={44} tone="accent" />
            <div className="flex min-w-0 flex-col">
              <AppText variant="text-strong">{name}</AppText>
              <AppText variant="small" tone="muted">
                {session.user.email} · Owner, {session.facility.name}
              </AppText>
            </div>
          </div>
        </FormSection>
        <FormSection title="Appearance" description="System follows your device setting.">
          <div>
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
          </div>
        </FormSection>
        <FormSection title="Log out" description="You'll need your email and password to log back in.">
          <div>
            <Button label="Log out" icon={SignOut} variant="secondary" onPress={() => setLogout(true)} />
          </div>
        </FormSection>
      </Card>
      <LogoutDialog visible={logout} onCancel={() => setLogout(false)} />
    </SettingsLayout>
  );
}

/* ------------------------------------------------------------------ profile */

type ProfileValues = { firstName: string; lastName: string; email: string; phone: string };

export function ProfileScreen() {
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
    // Saved values become the new baseline, so the form is clean again.
    if (ok) form.reset({ firstName: form.values.firstName.trim(), lastName: form.values.lastName.trim(), email: form.values.email.trim().toLowerCase(), phone: form.values.phone.trim() });
  };

  return (
    <SettingsLayout>
      <Card>
        <FormSection title="Profile" description="Your name and how to reach you. You sign in with this email.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField label="First name" value={form.values.firstName} onChangeText={(t) => form.set('firstName', t)} error={form.errors.firstName} autoComplete="given-name" />
            <TextField label="Last name" value={form.values.lastName} onChangeText={(t) => form.set('lastName', t)} error={form.errors.lastName} autoComplete="family-name" />
            <TextField label="Email" value={form.values.email} onChangeText={(t) => form.set('email', t)} error={form.errors.email} type="email" autoCapitalize="none" autoComplete="email" />
            <TextField label="Phone" optional value={form.values.phone} onChangeText={(t) => form.set('phone', t)} error={form.errors.phone} type="tel" autoComplete="tel" />
          </div>
          <div className="flex justify-end">
            <Button label="Save profile" onPress={submit} loading={saving} disabled={!form.dirty} />
          </div>
        </FormSection>
      </Card>
    </SettingsLayout>
  );
}

/* ------------------------------------------------------------------ notification preferences */

export function NotificationPreferencesScreen() {
  const query = usePreferences();
  return (
    <SettingsLayout onRefresh={() => query.refetch()}>
      <QueryView query={query} errorTitle="Couldn't load preferences">
        {(p) => <PreferencesForm initial={p} />}
      </QueryView>
    </SettingsLayout>
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

  const off = !prefs.push && !prefs.email;

  return (
    <Card>
      <FormSection title="Send to" description="Changes save as you make them.">
        <div className="flex flex-col divide-y divide-border">
          <SwitchRow label="Push notifications" description="On your phone, through the SportVenue app" value={prefs.push} onChange={(v) => change('push', v)} />
          <SwitchRow label="Email" description="To your account email" value={prefs.email} onChange={(v) => change('email', v)} />
        </div>
        {off && (
          <AppText variant="small" tone="warning">
            Everything below is paused until push or email is on.
          </AppText>
        )}
      </FormSection>
      <FormSection title="Bookings">
        <div className="flex flex-col divide-y divide-border">
          <SwitchRow label="Upcoming booking reminders" value={prefs.bookingReminders} onChange={(v) => change('bookingReminders', v)} disabled={off} />
          <SwitchRow label="New bookings" value={prefs.newBookings} onChange={(v) => change('newBookings', v)} disabled={off} />
          <SwitchRow label="Cancellations" value={prefs.cancellations} onChange={(v) => change('cancellations', v)} disabled={off} />
        </div>
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
            className="sm:max-w-xs"
          />
        )}
      </FormSection>
      <FormSection title="Payments and summaries">
        <div className="flex flex-col divide-y divide-border">
          <SwitchRow label="Unpaid balance reminders" value={prefs.paymentReminders} onChange={(v) => change('paymentReminders', v)} disabled={off} />
          <SwitchRow label="Payments received" value={prefs.paymentsReceived} onChange={(v) => change('paymentsReceived', v)} disabled={off} />
          <SwitchRow label="Daily summary" description="Yesterday's revenue and today's bookings, each morning" value={prefs.dailySummary} onChange={(v) => change('dailySummary', v)} disabled={off} />
        </div>
      </FormSection>
    </Card>
  );
}

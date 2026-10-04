import { useCallback, useMemo, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Clock, Envelope, Gear, Globe, MapPin, PencilSimple, Phone } from 'phosphor-react-native';

import { SPORTS } from '@/domain/labels';
import type { BusinessHoursDay, Facility } from '@/domain/types';
import { clockOptions, formatClock, formatDuration, WEEK_ORDER, WEEKDAY_LONG, WEEKDAY_SHORT } from '@/lib/format';
import { rules, useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip, ChipRow, SegmentedControl } from '@/ui/Chips';
import { ConfirmDialog } from '@/ui/Dialogs';
import { FieldShell, SwitchRow, TextField } from '@/ui/Fields';
import { IconButton } from '@/ui/IconButton';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { SelectField } from '@/ui/Select';
import { Notice, QueryView } from '@/ui/States';

import { useFacility, useUpdateFacility, useUpdateHours } from '../api';

/* ------------------------------------------------------------------ profile */

export function FacilityScreen() {
  const router = useRouter();
  const query = useFacility();
  const [refreshing, setRefreshing] = useState(false);
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Facility',
          headerRight: () => <IconButton icon={PencilSimple} label="Edit facility" onPress={() => router.push(routes.facilityEdit)} />,
        }}
      />
      <Screen
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await query.refetch();
          setRefreshing(false);
        }}
      >
        <QueryView query={query} errorTitle="Couldn't load facility">
          {(fac) => <FacilityBody facility={fac} />}
        </QueryView>
      </Screen>
    </>
  );
}

function FacilityBody({ facility: fac }: { facility: Facility }) {
  const router = useRouter();
  const { colors } = useTheme();
  const open = (url: string) => Linking.openURL(url);

  return (
    <>
      <Card>
        <View style={[styles.mark, { backgroundColor: colors.accent }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <AppText variant="display-lg" style={{ color: colors.onAccent }}>
            {fac.name.trim()[0]?.toUpperCase()}
          </AppText>
        </View>
        <AppText variant="display-lg" style={styles.gapTop}>
          {fac.name}
        </AppText>
        <AppText tone="muted">{fac.city}</AppText>
        {fac.description && <AppText style={styles.gapTop}>{fac.description}</AppText>}
        <View style={styles.sports}>
          {fac.sports.map((s) => (
            <View key={s} style={[styles.sport, { backgroundColor: colors.surfaceMuted }]}>
              <AppText variant="nav-link" tone="muted">
                {s}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <ListGroup title="Contact">
        <ListRow icon={MapPin} title={fac.address} subtitle={fac.city} onPress={() => open(`https://maps.google.com/?q=${encodeURIComponent(`${fac.address}, ${fac.city}`)}`)} />
        <ListRow icon={Phone} title={fac.phone} onPress={() => open(`tel:${fac.phone.replace(/\s/g, '')}`)} label={`Phone ${fac.phone}`} />
        <ListRow icon={Envelope} title={fac.email} onPress={() => open(`mailto:${fac.email}`)} />
        {fac.website && <ListRow icon={Globe} title={fac.website} onPress={() => open(fac.website!.startsWith('http') ? fac.website! : `https://${fac.website}`)} />}
      </ListGroup>

      <ListGroup title="Business hours">
        {WEEK_ORDER.map((d) => {
          const h = fac.businessHours.find((x) => x.weekday === d)!;
          return <ListRow key={d} title={WEEKDAY_LONG[d]} value={h.closed ? 'Closed' : `${formatClock(h.open)} - ${formatClock(h.close)}`} />;
        })}
        <ListRow icon={Clock} title="Edit business hours" onPress={() => router.push(routes.facilityHours)} />
      </ListGroup>

      <ListGroup title="Settings">
        <ListRow title="Currency" value={fac.currency} />
        <ListRow title="Timezone" value={fac.timezone.replace(/_/g, ' ')} />
        <ListRow title="Default slot length" value={formatDuration(fac.settings.defaultSlotMinutes)} />
        <ListRow title="Free cancellation until" value={`${fac.settings.cancellationWindowHours} h before`} />
        <ListRow title="Bookings open" value={`${fac.settings.bookingLeadDays} days ahead`} />
        <ListRow icon={Gear} title="Edit settings" onPress={() => router.push(routes.facilitySettings)} />
      </ListGroup>
    </>
  );
}

/* ------------------------------------------------------------------ edit profile */

export function FacilityEditScreen() {
  const query = useFacility();
  return (
    <>
      <Stack.Screen options={{ title: 'Edit facility' }} />
      <QueryView query={query} errorTitle="Couldn't load facility">
        {(fac) => <FacilityEditForm facility={fac} />}
      </QueryView>
    </>
  );
}

type ProfileValues = { name: string; description: string; sports: string[]; address: string; city: string; phone: string; email: string; website: string };

function FacilityEditForm({ facility: fac }: { facility: Facility }) {
  const router = useRouter();
  const update = useUpdateFacility();
  const [saving, setSaving] = useState(false);
  const form = useForm<ProfileValues>(
    { name: fac.name, description: fac.description ?? '', sports: fac.sports, address: fac.address, city: fac.city, phone: fac.phone, email: fac.email, website: fac.website ?? '' },
    useCallback(
      (v: ProfileValues) => ({
        name: v.name.trim() ? undefined : 'Enter the facility name.',
        sports: v.sports.length ? undefined : 'Choose at least one sport.',
        address: v.address.trim() ? undefined : 'Enter the street address.',
        city: v.city.trim() ? undefined : 'Enter the city.',
        phone: rules.phone(v.phone),
        email: rules.email(v.email),
        website: v.website && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v.website.trim()) ? 'Enter a valid web address.' : undefined,
      }),
      [],
    ),
  );
  const v = form.values;

  const save = async () => {
    setSaving(true);
    const ok = await form.submit((x) =>
      update.mutateAsync({
        name: x.name.trim(),
        description: x.description.trim() || undefined,
        sports: x.sports,
        address: x.address.trim(),
        city: x.city.trim(),
        phone: x.phone.trim(),
        email: x.email.trim().toLowerCase(),
        website: x.website.trim() || undefined,
      }),
    );
    setSaving(false);
    if (ok) router.back();
  };

  const sports = [...new Set([...SPORTS, ...fac.sports])];

  return (
    <Screen keyboard footer={<Button label="Save facility" block onPress={save} loading={saving} disabled={!form.dirty} />}>
      <TextField label="Facility name" value={v.name} onChangeText={(t) => form.set('name', t)} error={form.errors.name} maxLength={60} />
      <TextField label="About" optional multiline value={v.description} onChangeText={(t) => form.set('description', t)} placeholder="What makes your facility worth a visit" maxLength={300} />
      <FieldShell label="Sports" error={form.errors.sports}>
        <ChipRow>
          {sports.map((s) => {
            const on = v.sports.includes(s);
            return <Chip key={s} label={s} selected={on} onPress={() => form.set('sports', on ? v.sports.filter((x) => x !== s) : [...v.sports, s])} />;
          })}
        </ChipRow>
      </FieldShell>
      <TextField label="Street address" value={v.address} onChangeText={(t) => form.set('address', t)} error={form.errors.address} autoComplete="street-address" />
      <TextField label="City" value={v.city} onChangeText={(t) => form.set('city', t)} error={form.errors.city} />
      <TextField label="Phone" value={v.phone} onChangeText={(t) => form.set('phone', t)} error={form.errors.phone} keyboardType="phone-pad" />
      <TextField label="Email" value={v.email} onChangeText={(t) => form.set('email', t)} error={form.errors.email} keyboardType="email-address" autoCapitalize="none" />
      <TextField label="Website" optional value={v.website} onChangeText={(t) => form.set('website', t)} error={form.errors.website} autoCapitalize="none" keyboardType="url" />
    </Screen>
  );
}

/* ------------------------------------------------------------------ business hours */

export function BusinessHoursScreen() {
  const query = useFacility();
  return (
    <>
      <Stack.Screen options={{ title: 'Business hours' }} />
      <QueryView query={query} errorTitle="Couldn't load hours">
        {(fac) => <HoursForm facility={fac} />}
      </QueryView>
    </>
  );
}

function HoursForm({ facility: fac }: { facility: Facility }) {
  const router = useRouter();
  const { colors } = useTheme();
  const update = useUpdateHours();
  const [hours, setHours] = useState<BusinessHoursDay[]>(() => [...fac.businessHours].sort((a, b) => a.weekday - b.weekday));
  const [attempted, setAttempted] = useState(false);
  const times = useMemo(() => clockOptions('05:00', '23:30').map((t) => ({ value: t, label: formatClock(t) })), []);

  const errors = useMemo(() => {
    const out: Record<number, string> = {};
    for (const h of hours) if (!h.closed && h.close <= h.open) out[h.weekday] = 'Closing time must be after opening time.';
    return out;
  }, [hours]);

  const setDay = (weekday: number, patch: Partial<BusinessHoursDay>) => setHours((hs) => hs.map((h) => (h.weekday === weekday ? { ...h, ...patch } : h)));
  const monday = hours.find((h) => h.weekday === 1)!;
  const dirty = JSON.stringify(hours) !== JSON.stringify([...fac.businessHours].sort((a, b) => a.weekday - b.weekday));

  const save = () => {
    setAttempted(true);
    if (Object.keys(errors).length) return;
    update.mutate(hours, { onSuccess: () => router.back() });
  };

  return (
    <Screen footer={<Button label="Save hours" block onPress={save} loading={update.isPending} disabled={!dirty} />}>
      <Notice message="Hours set when courts can be booked. Existing bookings outside new hours are kept." />
      <Button
        size="sm"
        variant="secondary"
        label="Copy Monday to weekdays"
        onPress={() => setHours((hs) => hs.map((h) => (h.weekday >= 2 && h.weekday <= 5 ? { ...h, closed: monday.closed, open: monday.open, close: monday.close } : h)))}
      />
      {WEEK_ORDER.map((d) => {
        const h = hours.find((x) => x.weekday === d)!;
        return (
          <View key={d} style={[styles.day, { backgroundColor: colors.surface, borderColor: attempted && errors[d] ? colors.danger : colors.border }]}>
            <SwitchRow label={WEEKDAY_LONG[d]} description={h.closed ? 'Closed all day' : `${formatClock(h.open)} - ${formatClock(h.close)}`} value={!h.closed} onChange={(openDay) => setDay(d, { closed: !openDay })} />
            {!h.closed && (
              <View style={styles.dayTimes}>
                <View style={styles.flex}>
                  <SelectField label={`${WEEKDAY_SHORT[d]} opens`} value={h.open} options={times} onChange={(t) => setDay(d, { open: t })} />
                </View>
                <View style={styles.flex}>
                  <SelectField label="Closes" value={h.close} options={times} onChange={(t) => setDay(d, { close: t })} error={attempted ? errors[d] : undefined} />
                </View>
              </View>
            )}
          </View>
        );
      })}
    </Screen>
  );
}

/* ------------------------------------------------------------------ settings */

const CURRENCIES = ['PKR', 'INR', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'BDT', 'LKR', 'EGP', 'TRY', 'EUR', 'GBP', 'USD', 'CAD', 'AUD', 'SGD', 'MYR', 'ZAR'];
const TIMEZONES = [
  'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Qatar', 'Asia/Kuwait', 'Asia/Bahrain', 'Asia/Muscat', 'Asia/Dhaka', 'Asia/Colombo',
  'Africa/Cairo', 'Europe/Istanbul', 'Europe/London', 'Europe/Madrid', 'Europe/Paris', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'America/Toronto', 'Australia/Sydney', 'Asia/Singapore', 'Asia/Kuala_Lumpur', 'Africa/Johannesburg',
];

function currencyName(code: string) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function FacilitySettingsScreen() {
  const query = useFacility();
  return (
    <>
      <Stack.Screen options={{ title: 'Facility settings' }} />
      <QueryView query={query} errorTitle="Couldn't load settings">
        {(fac) => <SettingsForm facility={fac} />}
      </QueryView>
    </>
  );
}

type SettingsValues = { currency: string; timezone: string; slot: '30' | '60' | '90'; cancel: string; lead: string };

function SettingsForm({ facility: fac }: { facility: Facility }) {
  const router = useRouter();
  const update = useUpdateFacility('Settings saved');
  const [confirm, setConfirm] = useState(false);
  const form = useForm<SettingsValues>(
    {
      currency: fac.currency,
      timezone: fac.timezone,
      slot: String(fac.settings.defaultSlotMinutes) as SettingsValues['slot'],
      cancel: String(fac.settings.cancellationWindowHours),
      lead: String(fac.settings.bookingLeadDays),
    },
    useCallback(() => ({}), []),
  );
  const v = form.values;
  const sensitive = v.currency !== fac.currency || v.timezone !== fac.timezone;

  const commit = () =>
    form.submit((x) =>
      update
        .mutateAsync({
          currency: x.currency,
          timezone: x.timezone,
          settings: { defaultSlotMinutes: Number(x.slot) as 30 | 60 | 90, cancellationWindowHours: Number(x.cancel), bookingLeadDays: Number(x.lead) },
        })
        .then(() => router.back()),
    );

  return (
    <Screen footer={<Button label="Save settings" block onPress={() => (sensitive ? setConfirm(true) : void commit())} loading={update.isPending && !confirm} disabled={!form.dirty} />}>
      <SelectField
        label="Currency"
        value={v.currency}
        searchable
        options={[...new Set([fac.currency, ...CURRENCIES])].map((c) => ({ value: c, label: `${c}`, description: currencyName(c) }))}
        onChange={(c) => form.set('currency', c)}
        helper="All prices and payments are shown in this currency."
        error={form.errors.currency}
      />
      <SelectField
        label="Timezone"
        value={v.timezone}
        searchable
        options={[...new Set([fac.timezone, ...TIMEZONES])].map((z) => ({ value: z, label: z.replace(/_/g, ' ') }))}
        onChange={(z) => form.set('timezone', z)}
        helper="Booking times and 'today' follow this zone, not each phone's."
        error={form.errors.timezone}
      />
      <FieldShell label="Default slot length" helper="Used for new courts.">
        <SegmentedControl
          label="Default slot length"
          value={v.slot}
          onChange={(s) => form.set('slot', s)}
          options={[
            { value: '30', label: '30 min' },
            { value: '60', label: '60 min' },
            { value: '90', label: '90 min' },
          ]}
        />
      </FieldShell>
      <SelectField
        label="Free cancellation until"
        value={v.cancel}
        options={[0, 2, 6, 12, 24, 48].map((h) => ({ value: String(h), label: h === 0 ? 'Any time before start' : `${h} hours before start` }))}
        onChange={(c) => form.set('cancel', c)}
        error={form.errors.cancellationWindowHours}
      />
      <SelectField
        label="Bookings open"
        value={v.lead}
        options={[7, 14, 30, 60, 90, 180].map((d) => ({ value: String(d), label: `${d} days ahead` }))}
        onChange={(l) => form.set('lead', l)}
        error={form.errors.bookingLeadDays}
      />

      <ConfirmDialog
        visible={confirm}
        title={v.currency !== fac.currency ? `Switch currency to ${v.currency}?` : 'Change timezone?'}
        message={
          v.currency !== fac.currency
            ? `Amounts are not converted. Existing prices and balances will display in ${v.currency} using the same numbers, so review your rates afterwards.`
            : `Booking times will be shown in ${v.timezone.replace(/_/g, ' ')}. Existing bookings keep their facility times.`
        }
        confirmLabel="Save"
        cancelLabel="Back"
        loading={update.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          await commit();
          setConfirm(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  mark: { width: 56, height: 56, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  gapTop: { marginTop: spacing.md },
  sports: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2, marginTop: spacing.md },
  sport: { borderRadius: radius.badge, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs + 1 },
  day: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  dayTimes: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  flex: { flex: 1 },
});

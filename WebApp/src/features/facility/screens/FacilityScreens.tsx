'use client';

import { useCallback, useMemo, useState } from 'react';
import { Clock, Envelope, Gear, Globe, MapPin, PencilSimple, Phone } from '@phosphor-icons/react';

import { SPORTS } from '@/domain/labels';
import type { BusinessHoursDay, Facility } from '@/domain/types';
import { clockOptions, formatClock, formatDuration, WEEK_ORDER, WEEKDAY_LONG } from '@/lib/format';
import { rules, useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { cn } from '@/ui/cn';
import { ConfirmDialog } from '@/ui/Dialogs';
import { FieldShell, SelectField, Switch, TextField, ToggleGroup } from '@/ui/Fields';
import { DetailLayout, FormActions, FormSection, Page, PageHeader } from '@/ui/Page';
import { DescriptionList, Notice, QueryView } from '@/ui/States';
import { SegmentedControl } from '@/ui/Tabs';

import { useFacility, useUpdateFacility, useUpdateHours } from '../api';

/* ------------------------------------------------------------------ profile */

export function FacilityScreen() {
  const query = useFacility();
  return (
    <Page onRefresh={() => query.refetch()}>
      <QueryView query={query} errorTitle="Couldn't load facility">
        {(fac) => <FacilityBody facility={fac} />}
      </QueryView>
    </Page>
  );
}

function FacilityBody({ facility: fac }: { facility: Facility }) {
  const router = useAppRouter();
  const website = fac.website ? (fac.website.startsWith('http') ? fac.website : `https://${fac.website}`) : undefined;
  const row = 'flex items-start gap-3 rounded-control px-3 py-2.5 hover:bg-surface-muted';

  return (
    <>
      <PageHeader
        title={fac.name}
        leading={
          <span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card bg-accent">
            <AppText variant="page-title" tone="onAccent">
              {fac.name.trim()[0]?.toUpperCase()}
            </AppText>
          </span>
        }
        description={fac.city}
        actions={<Button label="Edit facility" icon={PencilSimple} onPress={() => router.push(routes.facilityEdit)} />}
      />
      <DetailLayout
        main={
          <>
            <Card padded={false}>
              <CardHeader title="About" />
              <div className="flex flex-col gap-3 p-5">
                {fac.description ? <AppText as="p">{fac.description}</AppText> : <AppText tone="muted">No description yet.</AppText>}
                <div className="flex flex-wrap gap-1.5">
                  {fac.sports.map((s) => (
                    <span key={s} className="t-label rounded-full bg-surface-muted px-2.5 py-0.5 text-text-muted">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
            <Card padded={false}>
              <CardHeader title="Business hours" description="When courts can be booked." actions={<Button label="Edit hours" icon={Clock} variant="secondary" size="sm" onPress={() => router.push(routes.facilityHours)} />} />
              <table className="w-full">
                <caption className="sr-only">Business hours</caption>
                <tbody>
                  {WEEK_ORDER.map((d) => {
                    const h = fac.businessHours.find((x) => x.weekday === d)!;
                    return (
                      <tr key={d} className="border-b border-border last:border-b-0">
                        <th scope="row" className="t-text-strong py-2.5 pl-5 text-left">
                          {WEEKDAY_LONG[d]}
                        </th>
                        <td className={cn('t-text py-2.5 pr-5 text-right tabular-nums', h.closed && 'text-text-subtle')}>{h.closed ? 'Closed' : `${formatClock(h.open)} - ${formatClock(h.close)}`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </>
        }
        side={
          <>
            <Card padded={false}>
              <CardHeader title="Contact" />
              <ul className="flex flex-col p-2">
                <li>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(`${fac.address}, ${fac.city}`)}`} target="_blank" rel="noopener noreferrer" className={row}>
                    <MapPin size={17} className="mt-0.5 text-text-muted" aria-hidden />
                    <span className="flex flex-col">
                      <AppText>{fac.address}</AppText>
                      <AppText variant="small" tone="muted">
                        {fac.city}
                      </AppText>
                    </span>
                  </a>
                </li>
                <li>
                  <a href={`tel:${fac.phone.replace(/\s/g, '')}`} aria-label={`Phone ${fac.phone}`} className={row}>
                    <Phone size={17} className="mt-0.5 text-text-muted" aria-hidden />
                    <AppText numeric>{fac.phone}</AppText>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${fac.email}`} className={row}>
                    <Envelope size={17} className="mt-0.5 text-text-muted" aria-hidden />
                    <AppText lines={1}>{fac.email}</AppText>
                  </a>
                </li>
                {fac.website && (
                  <li>
                    <a href={website} target="_blank" rel="noopener noreferrer" className={row}>
                      <Globe size={17} className="mt-0.5 text-text-muted" aria-hidden />
                      <AppText lines={1}>{fac.website}</AppText>
                    </a>
                  </li>
                )}
              </ul>
            </Card>
            <Card padded={false}>
              <CardHeader title="Settings" actions={<Button label="Edit" icon={Gear} variant="secondary" size="sm" onPress={() => router.push(routes.facilitySettings)} />} />
              <div className="px-5 py-2">
                <DescriptionList
                  items={[
                    { label: 'Currency', value: fac.currency },
                    { label: 'Timezone', value: fac.timezone.replace(/_/g, ' ') },
                    { label: 'Default slot length', value: formatDuration(fac.settings.defaultSlotMinutes) },
                    { label: 'Free cancellation until', value: `${fac.settings.cancellationWindowHours} h before` },
                    { label: 'Bookings open', value: `${fac.settings.bookingLeadDays} days ahead` },
                  ]}
                />
              </div>
            </Card>
          </>
        }
      />
    </>
  );
}

const CRUMB = { label: 'Facility', href: routes.facility };

/* ------------------------------------------------------------------ edit profile */

export function FacilityEditScreen() {
  const query = useFacility();
  return (
    <Page width="form">
      <QueryView query={query} errorTitle="Couldn't load facility">
        {(fac) => <FacilityEditForm facility={fac} />}
      </QueryView>
    </Page>
  );
}

type ProfileValues = { name: string; description: string; sports: string[]; address: string; city: string; phone: string; email: string; website: string };

function FacilityEditForm({ facility: fac }: { facility: Facility }) {
  const router = useAppRouter();
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
    if (ok) router.back(routes.facility);
  };

  const sports = [...new Set([...SPORTS, ...fac.sports])];

  return (
    <>
      <PageHeader breadcrumbs={[CRUMB, { label: 'Edit' }]} title="Edit facility" hideRefresh />
      <Card>
        <FormSection title="Profile" description="How your facility is described to customers.">
          <TextField label="Facility name" value={v.name} onChangeText={(t) => form.set('name', t)} error={form.errors.name} maxLength={60} autoComplete="organization" />
          <TextField label="About" optional multiline rows={3} value={v.description} onChangeText={(t) => form.set('description', t)} placeholder="What makes your facility worth a visit" maxLength={300} />
          <FieldShell label="Sports" error={form.errors.sports}>
            <ToggleGroup label="Sports" options={sports.map((s) => ({ value: s, label: s }))} isOn={(s) => v.sports.includes(s)} onToggle={(s) => form.set('sports', v.sports.includes(s) ? v.sports.filter((x) => x !== s) : [...v.sports, s])} />
          </FieldShell>
        </FormSection>
        <FormSection title="Location and contact" description="Shown on receipts and reminders.">
          <TextField label="Street address" value={v.address} onChangeText={(t) => form.set('address', t)} error={form.errors.address} autoComplete="street-address" />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="City" value={v.city} onChangeText={(t) => form.set('city', t)} error={form.errors.city} autoComplete="address-level2" />
            <TextField label="Phone" value={v.phone} onChangeText={(t) => form.set('phone', t)} error={form.errors.phone} type="tel" />
            <TextField label="Email" value={v.email} onChangeText={(t) => form.set('email', t)} error={form.errors.email} type="email" autoCapitalize="none" />
            <TextField label="Website" optional value={v.website} onChangeText={(t) => form.set('website', t)} error={form.errors.website} autoCapitalize="none" type="url" />
          </div>
        </FormSection>
      </Card>
      <FormActions>
        <Button label="Cancel" variant="secondary" onPress={() => router.back(routes.facility)} />
        <Button label="Save facility" onPress={save} loading={saving} disabled={!form.dirty} />
      </FormActions>
    </>
  );
}

/* ------------------------------------------------------------------ business hours */

export function BusinessHoursScreen() {
  const query = useFacility();
  return (
    <Page width="form">
      <QueryView query={query} errorTitle="Couldn't load hours">
        {(fac) => <HoursForm facility={fac} />}
      </QueryView>
    </Page>
  );
}

function HoursForm({ facility: fac }: { facility: Facility }) {
  const router = useAppRouter();
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
    update.mutate(hours, { onSuccess: () => router.back(routes.facility) });
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[CRUMB, { label: 'Business hours' }]}
        title="Business hours"
        description="Hours set when courts can be booked. Existing bookings outside new hours are kept."
        actions={
          <Button
            label="Copy Monday to weekdays"
            variant="secondary"
            onPress={() => setHours((hs) => hs.map((h) => (h.weekday >= 2 && h.weekday <= 5 ? { ...h, closed: monday.closed, open: monday.open, close: monday.close } : h)))}
          />
        }
        hideRefresh
      />
      <Card padded={false}>
        <ul className="divide-y divide-border">
          {WEEK_ORDER.map((d) => {
            const h = hours.find((x) => x.weekday === d)!;
            const err = attempted ? errors[d] : undefined;
            return (
              <li key={d} className={cn('grid items-center gap-3 px-5 py-3 sm:grid-cols-[160px_120px_minmax(0,1fr)]', err && 'bg-danger-soft/40')}>
                <AppText variant="text-strong">{WEEKDAY_LONG[d]}</AppText>
                <button type="button" role="switch" aria-checked={!h.closed} aria-label={`${WEEKDAY_LONG[d]} open`} onClick={() => setDay(d, { closed: !h.closed })} className="flex items-center gap-2">
                  <Switch on={!h.closed} />
                  <AppText variant="small" tone={h.closed ? 'subtle' : 'muted'}>
                    {h.closed ? 'Closed' : 'Open'}
                  </AppText>
                </button>
                {h.closed ? (
                  <AppText variant="small" tone="subtle">
                    Closed all day
                  </AppText>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <SelectField hideLabel label={`${WEEKDAY_LONG[d]} opens`} value={h.open} options={times} onChange={(t) => setDay(d, { open: t })} className="flex-1" />
                      <AppText variant="small" tone="muted">
                        to
                      </AppText>
                      <SelectField hideLabel label={`${WEEKDAY_LONG[d]} closes`} value={h.close} options={times} onChange={(t) => setDay(d, { close: t })} className="flex-1" />
                    </div>
                    {err && (
                      <AppText variant="small" tone="danger" role="alert">
                        {err}
                      </AppText>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
      <FormActions>
        <Button label="Cancel" variant="secondary" onPress={() => router.back(routes.facility)} />
        <Button label="Save hours" onPress={save} loading={update.isPending} disabled={!dirty} />
      </FormActions>
    </>
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
    <Page width="form">
      <QueryView query={query} errorTitle="Couldn't load settings">
        {(fac) => <SettingsForm facility={fac} />}
      </QueryView>
    </Page>
  );
}

type SettingsValues = { currency: string; timezone: string; slot: '30' | '60' | '90'; cancel: string; lead: string };

function SettingsForm({ facility: fac }: { facility: Facility }) {
  const router = useAppRouter();
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
        .then(() => router.back(routes.facility)),
    );

  return (
    <>
      <PageHeader breadcrumbs={[CRUMB, { label: 'Settings' }]} title="Facility settings" hideRefresh />
      <Card>
        <FormSection title="Region" description="Every amount and time in the app follows these.">
          {sensitive && <Notice tone="warning" message="Changing the currency or timezone affects how every amount and booking time is shown. You'll be asked to confirm." />}
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              label="Currency"
              value={v.currency}
              options={[...new Set([fac.currency, ...CURRENCIES])].map((c) => ({ value: c, label: c, description: currencyName(c) }))}
              onChange={(c) => form.set('currency', c)}
              helper="All prices and payments are shown in this currency."
              error={form.errors.currency}
            />
            <SelectField
              label="Timezone"
              value={v.timezone}
              options={[...new Set([fac.timezone, ...TIMEZONES])].map((z) => ({ value: z, label: z.replace(/_/g, ' ') }))}
              onChange={(z) => form.set('timezone', z)}
              helper="Booking times and 'today' follow this zone, not each device's."
              error={form.errors.timezone}
            />
          </div>
        </FormSection>
        <FormSection title="Booking rules" description="Defaults for new courts and how far ahead customers can book.">
          <FieldShell label="Default slot length" helper="Used for new courts.">
            <div>
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
            </div>
          </FieldShell>
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              label="Free cancellation until"
              value={v.cancel}
              options={[0, 2, 6, 12, 24, 48].map((h) => ({ value: String(h), label: h === 0 ? 'Any time before start' : `${h} hours before start` }))}
              onChange={(c) => form.set('cancel', c)}
              error={form.errors.cancellationWindowHours}
            />
            <SelectField label="Bookings open" value={v.lead} options={[7, 14, 30, 60, 90, 180].map((d) => ({ value: String(d), label: `${d} days ahead` }))} onChange={(l) => form.set('lead', l)} error={form.errors.bookingLeadDays} />
          </div>
        </FormSection>
      </Card>
      <FormActions>
        <Button label="Cancel" variant="secondary" onPress={() => router.back(routes.facility)} />
        <Button label="Save settings" onPress={() => (sensitive ? setConfirm(true) : void commit())} loading={update.isPending && !confirm} disabled={!form.dirty} />
      </FormActions>

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
    </>
  );
}

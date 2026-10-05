'use client';

import { useCallback, useState } from 'react';

import { COURT_STATUS, SPORTS } from '@/domain/labels';
import type { Court, CourtStatus } from '@/domain/types';
import { useFormat } from '@/lib/format';
import { parseMoney, rules, useForm } from '@/lib/useForm';
import { useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { FieldShell, SelectField, SwitchRow, TextField } from '@/ui/Fields';
import { FormActions, FormSection, Page, PageHeader } from '@/ui/Page';
import { QueryView } from '@/ui/States';
import { SegmentedControl } from '@/ui/Tabs';

import { useCourt, useCreateCourt, useUpdateCourt } from '../api';

export function CourtFormScreen() {
  const id = useRouteParam('id');
  const query = useCourt(id);
  return (
    <Page width="form">
      {!id ? (
        <CourtForm />
      ) : (
        <QueryView query={query} errorTitle="Couldn't load court">
          {(c) => <CourtForm court={c} />}
        </QueryView>
      )}
    </Page>
  );
}

type Values = { name: string; sport: string; surface: string; indoor: boolean; hourlyRate: string; slotMinutes: '30' | '60' | '90'; status: CourtStatus; notes: string };

function CourtForm({ court }: { court?: Court }) {
  const router = useAppRouter();
  const f = useFormat();
  const create = useCreateCourt();
  const update = useUpdateCourt(court?.id ?? '');
  const [saving, setSaving] = useState(false);

  const form = useForm<Values>(
    {
      name: court?.name ?? '',
      sport: court?.sport ?? '',
      surface: court?.surface ?? '',
      indoor: court?.indoor ?? true,
      hourlyRate: court ? String(court.hourlyRate) : '',
      slotMinutes: String(court?.slotMinutes ?? 60) as Values['slotMinutes'],
      status: court?.status ?? 'ACTIVE',
      notes: court?.notes ?? '',
    },
    useCallback(
      (v: Values) => ({
        name: v.name.trim().length < 2 ? 'Enter a court name, for example "Court 4".' : v.name.length > 40 ? 'Keep the name under 40 characters.' : undefined,
        sport: rules.required(v.sport, 'Choose a sport.'),
        hourlyRate: rules.money(v.hourlyRate, 'hourly rate'),
      }),
      [],
    ),
  );

  const save = async () => {
    setSaving(true);
    await form.submit(async (v) => {
      const input = {
        name: v.name.trim(),
        sport: v.sport,
        surface: v.surface.trim() || undefined,
        indoor: v.indoor,
        hourlyRate: parseMoney(v.hourlyRate),
        slotMinutes: Number(v.slotMinutes) as Court['slotMinutes'],
        status: v.status,
        notes: v.notes.trim() || undefined,
      };
      if (court) {
        await update.mutateAsync(input);
        router.back(routes.court(court.id));
      } else {
        const created = await create.mutateAsync(input);
        router.replace(routes.court(created.id));
      }
    });
    setSaving(false);
  };

  const sportOptions = [...new Set([...SPORTS, ...(court?.sport ? [court.sport] : [])])].map((s) => ({ value: s, label: s }));
  const back = court ? routes.court(court.id) : routes.courts;

  return (
    <>
      <PageHeader
        breadcrumbs={court ? [{ label: 'Courts', href: routes.courts }, { label: court.name, href: routes.court(court.id) }, { label: 'Edit' }] : [{ label: 'Courts', href: routes.courts }, { label: 'Add court' }]}
        title={court ? 'Edit court' : 'Add court'}
        hideRefresh
      />
      <Card>
        <FormSection title="Court" description="How the court appears in bookings and schedules.">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Name" value={form.values.name} onChangeText={(t) => form.set('name', t)} error={form.errors.name} placeholder="Court 4" maxLength={40} autoCapitalize="words" />
            <SelectField label="Sport" value={form.values.sport || undefined} options={sportOptions} onChange={(v) => form.set('sport', v)} error={form.errors.sport} placeholder="Choose a sport" />
          </div>
          <TextField label="Surface" optional value={form.values.surface} onChangeText={(t) => form.set('surface', t)} placeholder="For example: artificial turf" maxLength={60} />
          <SwitchRow label="Indoor court" description="Shown to customers and used for weather-related opportunities." value={form.values.indoor} onChange={(v) => form.set('indoor', v)} />
        </FormSection>
        <FormSection title="Booking and price" description="The base rate applies when no time-based rate does.">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Base hourly rate" value={form.values.hourlyRate} onChangeText={(t) => form.set('hourlyRate', t)} error={form.errors.hourlyRate} inputMode="decimal" prefix={f.currency} helper="Used when no time-based rate applies." />
            <FieldShell label="Slot length" helper="Bookings start on these intervals.">
              <SegmentedControl
                label="Slot length"
                value={form.values.slotMinutes}
                onChange={(v) => form.set('slotMinutes', v)}
                options={[
                  { value: '30', label: '30 min' },
                  { value: '60', label: '60 min' },
                  { value: '90', label: '90 min' },
                ]}
              />
            </FieldShell>
          </div>
        </FormSection>
        <FormSection title="Status" description={COURT_STATUS[form.values.status].description}>
          <SegmentedControl label="Status" value={form.values.status} onChange={(v) => form.set('status', v)} options={(['ACTIVE', 'MAINTENANCE', 'INACTIVE'] as CourtStatus[]).map((s) => ({ value: s, label: COURT_STATUS[s].label }))} />
          <TextField label="Notes" optional multiline rows={3} value={form.values.notes} onChangeText={(t) => form.set('notes', t)} placeholder="Visible to your team only" maxLength={300} />
        </FormSection>
      </Card>
      <FormActions>
        <Button label="Cancel" variant="secondary" onPress={() => router.back(back)} />
        <Button label={court ? 'Save court' : 'Add court'} onPress={save} loading={saving} disabled={!!court && !form.dirty} />
      </FormActions>
    </>
  );
}

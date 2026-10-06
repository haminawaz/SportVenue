'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash } from '@phosphor-icons/react';

import { qk } from '@/api/queryKeys';
import type { PricingRule, Weekday } from '@/domain/types';
import { useCourts } from '@/features/courts/api';
import { opportunitiesService } from '@/features/opportunities/api';
import { clockOptions, formatClock, useFormat } from '@/lib/format';
import { parseMoney, rules as v, useForm } from '@/lib/useForm';
import { useQueryParams, useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ConfirmDialog } from '@/ui/Dialogs';
import { DayToggles, FieldShell, SelectField, SwitchRow, TextField } from '@/ui/Fields';
import { FormActions, FormSection, Page, PageHeader } from '@/ui/Page';
import { Notice, QueryView } from '@/ui/States';

import { useDeleteRule, usePricingRule, useSaveRule } from '../api';

export function PricingRuleScreen() {
  const id = useRouteParam('id');
  const query = usePricingRule(id);
  return (
    <Page width="form">
      {!id ? (
        <RuleForm />
      ) : (
        <QueryView query={query} errorTitle="Couldn't load this rate">
          {(r) => <RuleForm rule={r} />}
        </QueryView>
      )}
    </Page>
  );
}

type Values = { name: string; courtId: string; weekdays: number[]; startTime?: string; endTime?: string; hourlyRate: string; active: boolean };

function RuleForm({ rule }: { rule?: PricingRule }) {
  const router = useAppRouter();
  const f = useFormat();
  const queryClient = useQueryClient();
  const params = useQueryParams('courtId', 'weekdays', 'startTime', 'endTime', 'name', 'opportunityId');
  const courts = useCourts();
  const save = useSaveRule(rule?.id);
  const remove = useDeleteRule();
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const form = useForm<Values>(
    {
      name: rule?.name ?? params.name ?? '',
      courtId: rule ? (rule.courtId ?? '') : (params.courtId ?? ''),
      weekdays: rule?.weekdays ?? (params.weekdays ? params.weekdays.split(',').map(Number) : [1, 2, 3, 4, 5]),
      startTime: rule?.startTime ?? params.startTime ?? '18:00',
      endTime: rule?.endTime ?? params.endTime ?? '23:00',
      hourlyRate: rule ? String(rule.hourlyRate) : '',
      active: rule?.active ?? true,
    },
    useCallback(
      (x: Values) => ({
        name: x.name.trim() ? undefined : 'Name this rate, for example "Evening peak".',
        weekdays: x.weekdays.length ? undefined : 'Choose at least one day.',
        startTime: x.startTime ? undefined : 'Choose a start time.',
        endTime: !x.endTime ? 'Choose an end time.' : x.startTime && x.endTime <= x.startTime ? 'The end time must be after the start time.' : undefined,
        hourlyRate: v.money(x.hourlyRate, 'hourly rate'),
      }),
      [],
    ),
  );

  const court = courts.data?.find((c) => c.id === form.values.courtId);

  const submit = async () => {
    setSaving(true);
    const ok = await form.submit(async (x) => {
      await save.mutateAsync({
        name: x.name.trim(),
        courtId: x.courtId || null,
        weekdays: [...x.weekdays].sort() as Weekday[],
        startTime: x.startTime!,
        endTime: x.endTime!,
        hourlyRate: parseMoney(x.hourlyRate),
        active: x.active,
      });
      if (params.opportunityId) {
        await opportunitiesService.transition(params.opportunityId, 'resolve', `Added the "${x.name.trim()}" rate.`).catch(() => undefined);
        void queryClient.invalidateQueries({ queryKey: qk.opportunities });
      }
    });
    setSaving(false);
    if (ok) router.back(routes.pricing());
  };

  const times = clockOptions('05:00', '23:30').map((t) => ({ value: t, label: formatClock(t) }));

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Pricing', href: routes.pricing() }, { label: rule ? rule.name : 'Add a rate' }]}
        title={rule ? 'Time-based rate' : 'Add a rate'}
        actions={rule && <Button label="Delete rate" icon={Trash} variant="secondary" onPress={() => setConfirmDelete(true)} />}
        hideRefresh
      />
      {params.opportunityId && !rule && <Notice message="Pre-filled from a revenue opportunity. Set the rate, then save to mark it resolved." />}
      <Card>
        <FormSection title="Rate" description="Name it so it's easy to recognise in bookings and history.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField label="Name" value={form.values.name} onChangeText={(t) => form.set('name', t)} error={form.errors.name} placeholder="Evening peak" maxLength={40} />
            <SelectField
              label="Court"
              value={form.values.courtId}
              options={[{ value: '', label: 'All courts' }, ...(courts.data ?? []).map((c) => ({ value: c.id, label: c.name, description: `Base ${f.money(c.hourlyRate)} / h` }))]}
              onChange={(x) => form.set('courtId', x)}
            />
          </div>
          <TextField
            label="Hourly rate"
            value={form.values.hourlyRate}
            onChangeText={(t) => form.set('hourlyRate', t)}
            error={form.errors.hourlyRate}
            inputMode="decimal"
            prefix={f.currency}
            helper={court ? `${court.name}'s base rate is ${f.money(court.hourlyRate)} / h.` : 'Applies to every court in this time window.'}
            className="sm:max-w-xs"
          />
        </FormSection>
        <FormSection title="When it applies" description="The days and hours this rate replaces the base rate.">
          <FieldShell label="Days" error={form.errors.weekdays}>
            <DayToggles label="Days" value={form.values.weekdays} onChange={(d) => form.set('weekdays', d)} />
          </FieldShell>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <SelectField label="From" value={form.values.startTime} options={times} onChange={(t) => form.set('startTime', t)} error={form.errors.startTime} />
            <SelectField label="Until" value={form.values.endTime} options={times} onChange={(t) => form.set('endTime', t)} error={form.errors.endTime} />
          </div>
          <SwitchRow label="Active" description="Turn off to keep the rate without applying it." value={form.values.active} onChange={(x) => form.set('active', x)} />
        </FormSection>
      </Card>
      <FormActions>
        <Button label="Cancel" variant="secondary" onPress={() => router.back(routes.pricing())} />
        <Button label={rule ? 'Save rate' : 'Add rate'} onPress={submit} loading={saving} disabled={!!rule && !form.dirty} />
      </FormActions>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this rate?"
        message="Future bookings in this window use the base rate instead. Existing bookings keep their price."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => rule && remove.mutate(rule.id, { onSuccess: () => router.back(routes.pricing()), onSettled: () => setConfirmDelete(false) })}
      />
    </>
  );
}

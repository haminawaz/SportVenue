import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Trash } from 'phosphor-react-native';

import { qk } from '@/api/queryKeys';
import type { PricingRule, Weekday } from '@/domain/types';
import { useCourts } from '@/features/courts/api';
import { opportunitiesService } from '@/features/opportunities/api';
import { clockOptions, formatClock, formatWeekdays, useFormat } from '@/lib/format';
import { parseMoney, rules as v, useForm } from '@/lib/useForm';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { DayToggles } from '@/ui/Chips';
import { ConfirmDialog } from '@/ui/Dialogs';
import { FieldShell, SwitchRow, TextField } from '@/ui/Fields';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { SelectField } from '@/ui/Select';
import { Notice, QueryView } from '@/ui/States';

import { useDeleteRule, usePricingRule, useSaveRule } from '../api';

export function PricingRuleScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const query = usePricingRule(id ?? '');
  if (!id) {
    return (
      <>
        <Stack.Screen options={{ title: 'Add a rate' }} />
        <RuleForm />
      </>
    );
  }
  return (
    <>
      <Stack.Screen options={{ title: 'Time-based rate' }} />
      <QueryView query={query} errorTitle="Couldn't load this rate">
        {(r) => <RuleForm rule={r} />}
      </QueryView>
    </>
  );
}

type Values = { name: string; courtId: string; weekdays: number[]; startTime?: string; endTime?: string; hourlyRate: string; active: boolean };

function RuleForm({ rule }: { rule?: PricingRule }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { can } = useSession();
  const f = useFormat();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ courtId?: string; weekdays?: string; startTime?: string; endTime?: string; name?: string; opportunityId?: string }>();
  const courts = useCourts();
  const save = useSaveRule(rule?.id);
  const remove = useDeleteRule();
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canManage = can('pricing.manage');

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

  if (!canManage && rule) {
    return (
      <Screen>
        <ListGroup title={rule.name}>
          <ListRow title="Court" value={rule.courtName ?? 'All courts'} />
          <ListRow title="Days" value={formatWeekdays(rule.weekdays)} />
          <ListRow title="Time" value={`${formatClock(rule.startTime)} - ${formatClock(rule.endTime)}`} />
          <ListRow title="Rate" value={`${f.money(rule.hourlyRate)} / h`} />
          <ListRow title="Status" value={rule.active ? 'Active' : 'Off'} />
        </ListGroup>
      </Screen>
    );
  }

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
    if (ok) router.back();
  };

  const times = clockOptions('05:00', '23:30').map((t) => ({ value: t, label: formatClock(t) }));

  return (
    <Screen keyboard footer={<Button label={rule ? 'Save rate' : 'Add rate'} block onPress={submit} loading={saving} disabled={!!rule && !form.dirty} />}>
      {params.opportunityId && !rule && <Notice message="Pre-filled from a revenue opportunity. Set the rate, then save to mark it resolved." />}
      <TextField label="Name" value={form.values.name} onChangeText={(t) => form.set('name', t)} error={form.errors.name} placeholder="Evening peak" maxLength={40} />
      <SelectField
        label="Court"
        value={form.values.courtId}
        options={[{ value: '', label: 'All courts' }, ...(courts.data ?? []).map((c) => ({ value: c.id, label: c.name, description: `Base ${f.money(c.hourlyRate)} / h` }))]}
        onChange={(x) => form.set('courtId', x)}
      />
      <FieldShell label="Days" error={form.errors.weekdays}>
        <DayToggles label="Days" value={form.values.weekdays} onChange={(d) => form.set('weekdays', d)} />
      </FieldShell>
      <View style={styles.row}>
        <View style={styles.flex}>
          <SelectField label="From" value={form.values.startTime} options={times} onChange={(t) => form.set('startTime', t)} error={form.errors.startTime} />
        </View>
        <View style={styles.flex}>
          <SelectField label="Until" value={form.values.endTime} options={times} onChange={(t) => form.set('endTime', t)} error={form.errors.endTime} />
        </View>
      </View>
      <TextField
        label="Hourly rate"
        value={form.values.hourlyRate}
        onChangeText={(t) => form.set('hourlyRate', t)}
        error={form.errors.hourlyRate}
        keyboardType="decimal-pad"
        prefix={f.currency}
        helper={court ? `${court.name}'s base rate is ${f.money(court.hourlyRate)} / h.` : 'Applies to every court in this time window.'}
      />
      <View style={[styles.group, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <SwitchRow label="Active" description="Turn off to keep the rate without applying it." value={form.values.active} onChange={(x) => form.set('active', x)} />
      </View>

      {rule && (
        <ListGroup>
          <ListRow title="Delete rate" icon={Trash} destructive onPress={() => setConfirmDelete(true)} />
        </ListGroup>
      )}

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this rate?"
        message="Future bookings in this window use the base rate instead. Existing bookings keep their price."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => rule && remove.mutate(rule.id, { onSuccess: () => router.back(), onSettled: () => setConfirmDelete(false) })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  group: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});

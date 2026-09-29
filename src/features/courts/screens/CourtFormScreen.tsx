import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { COURT_STATUS, SPORTS } from '@/domain/labels';
import type { Court, CourtStatus } from '@/domain/types';
import { useFormat } from '@/lib/format';
import { parseMoney, rules, useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { SegmentedControl } from '@/ui/Chips';
import { FieldShell, SwitchRow, TextField } from '@/ui/Fields';
import { Screen } from '@/ui/Screen';
import { SelectField } from '@/ui/Select';
import { QueryView } from '@/ui/States';

import { useCourt, useCreateCourt, useUpdateCourt } from '../api';

export function CourtFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const query = useCourt(id ?? '');
  if (!id) {
    return (
      <>
        <Stack.Screen options={{ title: 'Add court' }} />
        <CourtForm />
      </>
    );
  }
  return (
    <>
      <Stack.Screen options={{ title: 'Edit court' }} />
      <QueryView query={query} errorTitle="Couldn't load court">
        {(c) => <CourtForm court={c} />}
      </QueryView>
    </>
  );
}

type Values = { name: string; sport: string; surface: string; indoor: boolean; hourlyRate: string; slotMinutes: '30' | '60' | '90'; status: CourtStatus; notes: string };

function CourtForm({ court }: { court?: Court }) {
  const router = useRouter();
  const { colors } = useTheme();
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
        router.back();
      } else {
        const created = await create.mutateAsync(input);
        router.replace(routes.court(created.id));
      }
    });
    setSaving(false);
  };

  const sportOptions = [...new Set([...SPORTS, ...(court?.sport ? [court.sport] : [])])].map((s) => ({ value: s, label: s }));

  return (
    <Screen keyboard footer={<Button label={court ? 'Save court' : 'Add court'} block onPress={save} loading={saving} disabled={!!court && !form.dirty} />}>
      <TextField label="Name" value={form.values.name} onChangeText={(t) => form.set('name', t)} error={form.errors.name} placeholder="Court 4" maxLength={40} autoCapitalize="words" />
      <SelectField label="Sport" value={form.values.sport || undefined} options={sportOptions} onChange={(v) => form.set('sport', v)} error={form.errors.sport} placeholder="Choose a sport" />
      <TextField label="Surface" optional value={form.values.surface} onChangeText={(t) => form.set('surface', t)} placeholder="For example: artificial turf" maxLength={60} />
      <View style={[styles.group, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <SwitchRow label="Indoor court" description="Shown to customers and used for weather-related opportunities." value={form.values.indoor} onChange={(v) => form.set('indoor', v)} />
      </View>
      <TextField
        label="Base hourly rate"
        value={form.values.hourlyRate}
        onChangeText={(t) => form.set('hourlyRate', t)}
        error={form.errors.hourlyRate}
        keyboardType="decimal-pad"
        prefix={f.currency}
        helper="Used when no time-based rate applies."
      />
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
      <FieldShell label="Status" helper={COURT_STATUS[form.values.status].description}>
        <SegmentedControl
          label="Status"
          value={form.values.status}
          onChange={(v) => form.set('status', v)}
          options={(['ACTIVE', 'MAINTENANCE', 'INACTIVE'] as CourtStatus[]).map((s) => ({ value: s, label: COURT_STATUS[s].label }))}
        />
      </FieldShell>
      <TextField label="Notes" optional multiline value={form.values.notes} onChangeText={(t) => form.set('notes', t)} placeholder="Visible to your team only" maxLength={300} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});

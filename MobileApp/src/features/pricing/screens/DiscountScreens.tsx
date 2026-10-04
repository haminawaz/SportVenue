import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ClockCounterClockwise, PauseCircle, PencilSimple, Percent, PlayCircle, Tag, Trash } from 'phosphor-react-native';

import { qk } from '@/api/queryKeys';
import type { Discount, Weekday } from '@/domain/types';
import { useCourts } from '@/features/courts/api';
import { opportunitiesService } from '@/features/opportunities/api';
import { formatCalendarDate } from '@/lib/datetime';
import { clockOptions, formatClock, formatDateTimeLocal, formatWeekdays, useFormat } from '@/lib/format';
import { parseMoney, useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip, ChipRow, DayToggles, SegmentedControl } from '@/ui/Chips';
import { DateField } from '@/ui/DateField';
import { ConfirmDialog } from '@/ui/Dialogs';
import { EmptyState } from '@/ui/EmptyState';
import { FieldShell, SwitchRow, TextField } from '@/ui/Fields';
import { IconButton } from '@/ui/IconButton';
import { InfiniteList } from '@/ui/InfiniteList';
import { ListGroup, ListRow } from '@/ui/List';
import { Screen } from '@/ui/Screen';
import { SelectField } from '@/ui/Select';
import { Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';

import { useDeleteDiscount, useDiscount, usePricingHistory, useSaveDiscount, useToggleDiscount } from '../api';
import { discountValueLabel } from './PricingScreen';

/* ------------------------------------------------------------------ detail */

export function DiscountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = useDiscount(id);
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Discount',
          headerRight: () => <IconButton icon={PencilSimple} label="Edit discount" onPress={() => router.push(routes.discountEdit(id))} />,
        }}
      />
      <Screen>
        <QueryView query={query} errorTitle="Couldn't load discount">
          {(d) => <DiscountBody discount={d} />}
        </QueryView>
      </Screen>
    </>
  );
}

function DiscountBody({ discount: d }: { discount: Discount }) {
  const router = useRouter();
  const { colors } = useTheme();
  const f = useFormat();
  const courts = useCourts();
  const toggle = useToggleDiscount(d.id);
  const remove = useDeleteDiscount();
  const [confirm, setConfirm] = useState<'delete' | 'toggle' | null>(null);
  const courtNames = d.courtIds.length ? d.courtIds.map((id) => courts.data?.find((c) => c.id === id)?.name ?? 'Deleted court').join(', ') : 'All courts';
  const expired = !!d.validTo && d.validTo < f.today();

  return (
    <>
      <Card tint={d.active ? 'accent' : 'surface'}>
        <View style={styles.head}>
          <View style={[styles.icon, { backgroundColor: colors.surface }]}>
            <Percent size={22} color={colors.accent} />
          </View>
          <StatusBadge label={expired ? 'Ended' : d.active ? 'Active' : 'Off'} tone={d.active && !expired ? 'positive' : 'neutral'} />
        </View>
        <AppText variant="display-xl" numeric style={styles.value}>
          {discountValueLabel(d, f.money)}
        </AppText>
        <AppText variant="body-strong">{d.name}</AppText>
        {d.code && (
          <AppText variant="nav-link" tone="muted">
            Code {d.code}
          </AppText>
        )}
      </Card>

      {expired && d.active && <Notice tone="warning" message="The end date has passed, so this discount no longer applies to new bookings." />}

      <ListGroup title="Where and when">
        <ListRow title="Courts" value={courtNames} />
        <ListRow title="Days" value={d.weekdays.length ? formatWeekdays(d.weekdays) : 'Every day'} />
        <ListRow title="Time" value={d.startTime && d.endTime ? `${formatClock(d.startTime)} - ${formatClock(d.endTime)}` : 'All day'} />
        <ListRow title="Valid" value={`${formatCalendarDate(d.validFrom)}${d.validTo ? ` - ${formatCalendarDate(d.validTo)}` : ' onwards'}`} />
      </ListGroup>

      <ListGroup title="Usage">
        <ListRow title="Used on bookings" value={d.maxUses ? `${d.usageCount} of ${d.maxUses}` : String(d.usageCount)} />
        <ListRow title="Last changed" value={formatDateTimeLocal(d.updatedAt, f.today())} />
        <ListRow title="Change history" icon={ClockCounterClockwise} onPress={() => router.push(routes.pricingHistory)} />
      </ListGroup>

      <ListGroup title="Manage">
        <ListRow title="Edit discount" icon={PencilSimple} onPress={() => router.push(routes.discountEdit(d.id))} />
        <ListRow title={d.active ? 'Turn off' : 'Turn on'} subtitle={d.active ? 'Stops applying to new bookings' : 'Starts applying to new bookings'} icon={d.active ? PauseCircle : PlayCircle} onPress={() => setConfirm('toggle')} />
        <ListRow title="Delete discount" icon={Trash} destructive onPress={() => setConfirm('delete')} />
      </ListGroup>

      <ConfirmDialog
        visible={confirm === 'toggle'}
        title={d.active ? `Turn off "${d.name}"?` : `Turn on "${d.name}"?`}
        message={d.active ? 'Existing bookings keep their discount.' : 'It applies to new bookings that match its courts, days and times.'}
        confirmLabel={d.active ? 'Turn off' : 'Turn on'}
        cancelLabel="Not now"
        loading={toggle.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => toggle.mutate(!d.active, { onSettled: () => setConfirm(null) })}
      />
      <ConfirmDialog
        visible={confirm === 'delete'}
        title={`Delete "${d.name}"?`}
        message="Discounts that have been used can't be deleted; turn them off instead."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => remove.mutate(d.id, { onSuccess: () => router.back(), onSettled: () => setConfirm(null) })}
      />
    </>
  );
}

/* ------------------------------------------------------------------ form */

export function DiscountFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const query = useDiscount(id ?? '');
  if (!id) {
    return (
      <>
        <Stack.Screen options={{ title: 'Create discount' }} />
        <DiscountForm />
      </>
    );
  }
  return (
    <>
      <Stack.Screen options={{ title: 'Edit discount' }} />
      <QueryView query={query} errorTitle="Couldn't load discount">
        {(d) => <DiscountForm discount={d} />}
      </QueryView>
    </>
  );
}

type Values = {
  name: string;
  code: string;
  kind: 'PERCENT' | 'AMOUNT';
  value: string;
  allCourts: boolean;
  courtIds: string[];
  validFrom: string;
  validTo?: string;
  weekdays: number[];
  timed: boolean;
  startTime?: string;
  endTime?: string;
  maxUses: string;
  active: boolean;
};

function DiscountForm({ discount }: { discount?: Discount }) {
  const router = useRouter();
  const { colors } = useTheme();
  const f = useFormat();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ courtId?: string; value?: string; kind?: string; weekdays?: string; startTime?: string; endTime?: string; name?: string; opportunityId?: string }>();
  const courts = useCourts();
  const save = useSaveDiscount(discount?.id);
  const [saving, setSaving] = useState(false);

  const prefillCourts = params.courtId ? [params.courtId] : [];
  const form = useForm<Values>(
    {
      name: discount?.name ?? params.name ?? '',
      code: discount?.code ?? '',
      kind: discount?.kind ?? (params.kind === 'AMOUNT' ? 'AMOUNT' : 'PERCENT'),
      value: discount ? String(discount.value) : (params.value ?? ''),
      allCourts: discount ? discount.courtIds.length === 0 : prefillCourts.length === 0,
      courtIds: discount?.courtIds ?? prefillCourts,
      validFrom: discount?.validFrom ?? f.today(),
      validTo: discount?.validTo,
      weekdays: discount?.weekdays ?? (params.weekdays ? params.weekdays.split(',').map(Number) : []),
      timed: discount ? !!discount.startTime : !!params.startTime,
      startTime: discount?.startTime ?? params.startTime,
      endTime: discount?.endTime ?? params.endTime,
      maxUses: discount?.maxUses ? String(discount.maxUses) : '',
      active: discount?.active ?? true,
    },
    useCallback((x: Values) => {
      const value = parseMoney(x.value);
      return {
        name: x.name.trim() ? undefined : 'Name this discount.',
        code: x.code && !/^[A-Z0-9]{3,16}$/.test(x.code) ? 'Use 3 to 16 capital letters or numbers.' : undefined,
        value: Number.isNaN(value) || value <= 0 ? 'Enter a value above zero.' : x.kind === 'PERCENT' && value > 100 ? 'A percentage discount cannot be over 100%.' : undefined,
        courtIds: !x.allCourts && x.courtIds.length === 0 ? 'Choose at least one court, or apply to all courts.' : undefined,
        validTo: x.validTo && x.validTo < x.validFrom ? 'The end date must be on or after the start date.' : undefined,
        startTime: x.timed && !x.startTime ? 'Choose a start time.' : undefined,
        endTime: !x.timed ? undefined : !x.endTime ? 'Choose an end time.' : x.startTime && x.endTime <= x.startTime ? 'The end time must be after the start time.' : undefined,
        maxUses: x.maxUses && !(/^\d+$/.test(x.maxUses) && Number(x.maxUses) >= 1) ? 'Use a whole number, or leave it empty for unlimited.' : undefined,
      };
    }, []),
  );

  const submit = async () => {
    setSaving(true);
    const ok = await form.submit(async (x) => {
      const saved = await save.mutateAsync({
        name: x.name.trim(),
        code: x.code || undefined,
        kind: x.kind,
        value: parseMoney(x.value),
        courtIds: x.allCourts ? [] : x.courtIds,
        validFrom: x.validFrom,
        validTo: x.validTo,
        weekdays: [...x.weekdays].sort() as Weekday[],
        startTime: x.timed ? x.startTime : undefined,
        endTime: x.timed ? x.endTime : undefined,
        maxUses: x.maxUses ? Number(x.maxUses) : undefined,
        active: x.active,
      });
      if (params.opportunityId) {
        await opportunitiesService.transition(params.opportunityId, 'resolve', `Created the "${saved.name}" discount.`).catch(() => undefined);
        void queryClient.invalidateQueries({ queryKey: qk.opportunities });
      }
      if (!discount) router.replace(routes.discount(saved.id));
    });
    setSaving(false);
    if (ok && discount) router.back();
  };

  const times = clockOptions('05:00', '23:30').map((t) => ({ value: t, label: formatClock(t) }));
  const x = form.values;

  return (
    <Screen keyboard footer={<Button label={discount ? 'Save discount' : 'Create discount'} block onPress={submit} loading={saving} disabled={!!discount && !form.dirty} />}>
      {params.opportunityId && !discount && <Notice message="Pre-filled from a revenue opportunity. Review it, then create to mark the opportunity resolved." />}
      <TextField label="Name" value={x.name} onChangeText={(t) => form.set('name', t)} error={form.errors.name} placeholder="Weekday afternoons" maxLength={40} />

      <FieldShell label="Type">
        <SegmentedControl
          label="Discount type"
          value={x.kind}
          onChange={(k) => form.set('kind', k)}
          options={[
            { value: 'PERCENT', label: 'Percentage' },
            { value: 'AMOUNT', label: 'Fixed amount' },
          ]}
        />
      </FieldShell>
      <TextField
        label={x.kind === 'PERCENT' ? 'Percentage off' : 'Amount off'}
        value={x.value}
        onChangeText={(t) => form.set('value', t)}
        error={form.errors.value}
        keyboardType="decimal-pad"
        prefix={x.kind === 'AMOUNT' ? f.currency : undefined}
        suffix={x.kind === 'PERCENT' ? '%' : undefined}
      />
      <TextField
        label="Code"
        optional
        value={x.code}
        onChangeText={(t) => form.set('code', t.toUpperCase().replace(/\s/g, ''))}
        error={form.errors.code}
        autoCapitalize="characters"
        placeholder="STUDENT10"
        helper="Leave empty to apply it to bookings without a code."
        maxLength={16}
      />

      <FieldShell label="Courts" error={form.errors.courtIds}>
        <ChipRow>
          <Chip label="All courts" selected={x.allCourts} onPress={() => form.patch({ allCourts: true, courtIds: [] })} />
          {(courts.data ?? []).map((c) => {
            const on = !x.allCourts && x.courtIds.includes(c.id);
            return (
              <Chip
                key={c.id}
                label={c.name}
                selected={on}
                onPress={() => form.patch({ allCourts: false, courtIds: on ? x.courtIds.filter((i) => i !== c.id) : [...x.courtIds, c.id] })}
              />
            );
          })}
        </ChipRow>
      </FieldShell>

      <FieldShell label="Days" helper={x.weekdays.length ? formatWeekdays(x.weekdays) : 'None selected means every day.'}>
        <DayToggles label="Days" value={x.weekdays} onChange={(d) => form.set('weekdays', d)} />
      </FieldShell>

      <View style={[styles.group, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <SwitchRow label="Only at certain times" description="For example, quiet afternoon hours." value={x.timed} onChange={(t) => form.set('timed', t)} />
      </View>
      {x.timed && (
        <View style={styles.row}>
          <View style={styles.flex}>
            <SelectField label="From" value={x.startTime} options={times} onChange={(t) => form.set('startTime', t)} error={form.errors.startTime} />
          </View>
          <View style={styles.flex}>
            <SelectField label="Until" value={x.endTime} options={times} onChange={(t) => form.set('endTime', t)} error={form.errors.endTime} />
          </View>
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.flex}>
          <DateField label="Starts" value={x.validFrom} onChange={(d) => form.set('validFrom', d)} />
        </View>
        <View style={styles.flex}>
          <DateField label="Ends" optional value={x.validTo} minimumDate={x.validFrom} onChange={(d) => form.set('validTo', d)} onClear={() => form.set('validTo', undefined)} placeholder="No end" error={form.errors.validTo} />
        </View>
      </View>

      <TextField label="Maximum uses" optional value={x.maxUses} onChangeText={(t) => form.set('maxUses', t)} error={form.errors.maxUses} keyboardType="number-pad" placeholder="Unlimited" />

      <View style={[styles.group, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <SwitchRow label="Active" description="Inactive discounts are kept but never applied." value={x.active} onChange={(a) => form.set('active', a)} />
      </View>
    </Screen>
  );
}

/* ------------------------------------------------------------------ history */

export function PricingHistoryScreen() {
  const f = useFormat();
  const query = usePricingHistory();
  return (
    <>
      <Stack.Screen options={{ title: 'Pricing history' }} />
      <InfiniteList
        query={query}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <ListRow
            icon={item.subject === 'DISCOUNT' ? Percent : Tag}
            title={item.subjectName}
            subtitle={`${item.change}\n${item.actor} · ${formatDateTimeLocal(item.at, f.today())}`}
          />
        )}
        empty={<EmptyState icon={ClockCounterClockwise} title="No changes yet" message="Every change to rates and discounts is recorded here." />}
      />
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icon: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  value: { marginTop: spacing.lg },
  group: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});

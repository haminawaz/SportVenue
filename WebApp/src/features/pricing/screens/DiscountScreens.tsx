'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ClockCounterClockwise, PauseCircle, PencilSimple, PlayCircle, Trash } from '@phosphor-icons/react';

import { qk } from '@/api/queryKeys';
import type { Discount, Weekday } from '@/domain/types';
import { useCourts } from '@/features/courts/api';
import { opportunitiesService } from '@/features/opportunities/api';
import { formatCalendarDate } from '@/lib/datetime';
import { clockOptions, formatClock, formatDateTimeLocal, formatWeekdays, useFormat } from '@/lib/format';
import { parseMoney, useForm } from '@/lib/useForm';
import { useQueryParams, useRouteParam } from '@/navigation/params';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { InfiniteTable } from '@/ui/DataTable';
import { ConfirmDialog } from '@/ui/Dialogs';
import { EmptyState } from '@/ui/EmptyState';
import { DateField, DayToggles, FieldShell, SelectField, SwitchRow, TextField, ToggleGroup } from '@/ui/Fields';
import { Menu } from '@/ui/Menu';
import { DetailLayout, FormActions, FormSection, Page, PageHeader } from '@/ui/Page';
import { StatCard, StatGrid } from '@/ui/StatCard';
import { DescriptionList, Notice, QueryView } from '@/ui/States';
import { StatusBadge } from '@/ui/StatusBadge';
import { SegmentedControl } from '@/ui/Tabs';

import { useDeleteDiscount, useDiscount, usePricingHistory, useSaveDiscount, useToggleDiscount } from '../api';
import { discountValueLabel } from './PricingScreen';

/* ------------------------------------------------------------------ detail */

export function DiscountDetailScreen() {
  const id = useRouteParam('id');
  const query = useDiscount(id);
  return (
    <Page width="wide" onRefresh={() => query.refetch()}>
      <QueryView query={query} errorTitle="Couldn't load discount">
        {(d) => <DiscountBody discount={d} />}
      </QueryView>
    </Page>
  );
}

function DiscountBody({ discount: d }: { discount: Discount }) {
  const router = useAppRouter();
  const f = useFormat();
  const courts = useCourts();
  const toggle = useToggleDiscount(d.id);
  const remove = useDeleteDiscount();
  const [confirm, setConfirm] = useState<'delete' | 'toggle' | null>(null);
  const courtNames = d.courtIds.length ? d.courtIds.map((id) => courts.data?.find((c) => c.id === id)?.name ?? 'Deleted court').join(', ') : 'All courts';
  const expired = !!d.validTo && d.validTo < f.today();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Pricing', href: routes.pricing() }, { label: d.name }]}
        title={d.name}
        meta={<StatusBadge label={expired ? 'Ended' : d.active ? 'Active' : 'Off'} tone={d.active && !expired ? 'positive' : 'neutral'} />}
        description={d.code ? `Code ${d.code}` : 'Applies without a code'}
        actions={
          <>
            <Button label={d.active ? 'Turn off' : 'Turn on'} icon={d.active ? PauseCircle : PlayCircle} variant="secondary" onPress={() => setConfirm('toggle')} />
            <Button label="Edit discount" icon={PencilSimple} onPress={() => router.push(routes.discountEdit(d.id))} />
            <Menu label="More discount actions" actions={[{ key: 'delete', label: 'Delete discount', icon: Trash, destructive: true, onSelect: () => setConfirm('delete') }]} />
          </>
        }
      />
      {expired && d.active && <Notice tone="warning" message="The end date has passed, so this discount no longer applies to new bookings." />}
      <StatGrid columns={3}>
        <StatCard tint={d.active ? 'accent' : 'surface'} label="Discount" value={discountValueLabel(d, f.money)} />
        <StatCard label="Used on bookings" value={d.maxUses ? `${d.usageCount} of ${d.maxUses}` : String(d.usageCount)} />
        <StatCard label="Last changed" value={formatDateTimeLocal(d.updatedAt, f.today())} />
      </StatGrid>
      <DetailLayout
        main={
          <Card padded={false}>
            <CardHeader title="Where and when" />
            <div className="px-5 py-2">
              <DescriptionList
                items={[
                  { label: 'Courts', value: courtNames },
                  { label: 'Days', value: d.weekdays.length ? formatWeekdays(d.weekdays) : 'Every day' },
                  { label: 'Time', value: d.startTime && d.endTime ? `${formatClock(d.startTime)} - ${formatClock(d.endTime)}` : 'All day' },
                  { label: 'Valid', value: `${formatCalendarDate(d.validFrom)}${d.validTo ? ` - ${formatCalendarDate(d.validTo)}` : ' onwards'}` },
                ]}
              />
            </div>
          </Card>
        }
        side={
          <Card padded={false}>
            <CardHeader title="Change history" />
            <div className="p-5">
              <AppText variant="small" tone="muted" className="mb-3">
                Every change to rates and discounts is recorded.
              </AppText>
              <Button label="View pricing history" icon={ClockCounterClockwise} variant="secondary" onPress={() => router.push(routes.pricingHistory)} />
            </div>
          </Card>
        }
      />

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
        onConfirm={() => remove.mutate(d.id, { onSuccess: () => router.back(routes.pricing()), onSettled: () => setConfirm(null) })}
      />
    </>
  );
}

/* ------------------------------------------------------------------ form */

export function DiscountFormScreen() {
  const id = useRouteParam('id');
  const query = useDiscount(id);
  return (
    <Page width="form">
      {!id ? (
        <DiscountForm />
      ) : (
        <QueryView query={query} errorTitle="Couldn't load discount">
          {(d) => <DiscountForm discount={d} />}
        </QueryView>
      )}
    </Page>
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
  const router = useAppRouter();
  const f = useFormat();
  const queryClient = useQueryClient();
  const params = useQueryParams('courtId', 'value', 'kind', 'weekdays', 'startTime', 'endTime', 'name', 'opportunityId');
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
    if (ok && discount) router.back(routes.discount(discount.id));
  };

  const times = clockOptions('05:00', '23:30').map((t) => ({ value: t, label: formatClock(t) }));
  const x = form.values;
  const back = discount ? routes.discount(discount.id) : routes.pricing();

  return (
    <>
      <PageHeader
        breadcrumbs={discount ? [{ label: 'Pricing', href: routes.pricing() }, { label: discount.name, href: routes.discount(discount.id) }, { label: 'Edit' }] : [{ label: 'Pricing', href: routes.pricing() }, { label: 'Create discount' }]}
        title={discount ? 'Edit discount' : 'Create discount'}
        hideRefresh
      />
      {params.opportunityId && !discount && <Notice message="Pre-filled from a revenue opportunity. Review it, then create to mark the opportunity resolved." />}
      <Card>
        <FormSection title="Discount" description="What comes off the price, and an optional code customers quote.">
          <TextField label="Name" value={x.name} onChangeText={(t) => form.set('name', t)} error={form.errors.name} placeholder="Weekday afternoons" maxLength={40} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
              inputMode="decimal"
              prefix={x.kind === 'AMOUNT' ? f.currency : undefined}
              suffix={x.kind === 'PERCENT' ? '%' : undefined}
            />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
            <TextField label="Maximum uses" optional value={x.maxUses} onChangeText={(t) => form.set('maxUses', t)} error={form.errors.maxUses} inputMode="numeric" placeholder="Unlimited" />
          </div>
        </FormSection>

        <FormSection title="Where and when" description="Limit the discount to some courts, days or hours. Leave days empty for every day.">
          <FieldShell label="Courts" error={form.errors.courtIds}>
            <ToggleGroup
              label="Courts"
              options={[{ value: '__all', label: 'All courts' }, ...(courts.data ?? []).map((c) => ({ value: c.id, label: c.name }))]}
              isOn={(v) => (v === '__all' ? x.allCourts : !x.allCourts && x.courtIds.includes(v))}
              onToggle={(v) => {
                if (v === '__all') form.patch({ allCourts: true, courtIds: [] });
                else {
                  const on = !x.allCourts && x.courtIds.includes(v);
                  form.patch({ allCourts: false, courtIds: on ? x.courtIds.filter((i) => i !== v) : [...x.courtIds, v] });
                }
              }}
            />
          </FieldShell>
          <FieldShell label="Days" helper={x.weekdays.length ? formatWeekdays(x.weekdays) : 'None selected means every day.'}>
            <DayToggles label="Days" value={x.weekdays} onChange={(d) => form.set('weekdays', d)} />
          </FieldShell>
          <SwitchRow label="Only at certain times" description="For example, quiet afternoon hours." value={x.timed} onChange={(t) => form.set('timed', t)} />
          {x.timed && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <SelectField label="From" value={x.startTime} options={times} onChange={(t) => form.set('startTime', t)} error={form.errors.startTime} />
              <SelectField label="Until" value={x.endTime} options={times} onChange={(t) => form.set('endTime', t)} error={form.errors.endTime} />
            </div>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <DateField label="Starts" value={x.validFrom} onChange={(d) => form.set('validFrom', d)} />
            <DateField label="Ends" optional value={x.validTo} minimumDate={x.validFrom} onChange={(d) => form.set('validTo', d)} onClear={() => form.set('validTo', undefined)} error={form.errors.validTo} helper="Leave empty for no end date." />
          </div>
        </FormSection>

        <FormSection title="Status">
          <SwitchRow label="Active" description="Inactive discounts are kept but never applied." value={x.active} onChange={(a) => form.set('active', a)} />
        </FormSection>
      </Card>
      <FormActions>
        <Button label="Cancel" variant="secondary" onPress={() => router.back(back)} />
        <Button label={discount ? 'Save discount' : 'Create discount'} onPress={submit} loading={saving} disabled={!!discount && !form.dirty} />
      </FormActions>
    </>
  );
}

/* ------------------------------------------------------------------ history */

const SUBJECT: Record<string, string> = { COURT_RATE: 'Base rate', RULE: 'Time-based rate', DISCOUNT: 'Discount' };

export function PricingHistoryScreen() {
  const f = useFormat();
  const query = usePricingHistory();
  return (
    <Page onRefresh={() => query.refetch()}>
      <PageHeader breadcrumbs={[{ label: 'Pricing', href: routes.pricing() }, { label: 'History' }]} title="Pricing history" description="Every change to base rates, time-based rates and discounts." />
      <Card padded={false}>
        <InfiniteTable
          query={query}
          rowKey={(e) => e.id}
          caption="Pricing history"
          noun={['change', 'changes']}
          columns={[
            { key: 'at', header: 'When', cell: (e) => <span className="whitespace-nowrap text-text-muted">{formatDateTimeLocal(e.at, f.today())}</span> },
            {
              key: 'item',
              header: 'Item',
              cell: (e) => (
                <span className="flex flex-col">
                  <AppText variant="text-strong">{e.subjectName}</AppText>
                  <AppText variant="mini" tone="muted">
                    {SUBJECT[e.subject] ?? e.subject}
                  </AppText>
                </span>
              ),
            },
            { key: 'change', header: 'Change', className: 'min-w-[220px]', cell: (e) => e.change },
            { key: 'by', header: 'By', hideBelow: 'md', cell: (e) => <span className="whitespace-nowrap text-text-muted">{e.actor}</span> },
          ]}
          empty={<EmptyState icon={ClockCounterClockwise} title="No changes yet" message="Every change to rates and discounts is recorded here." />}
        />
      </Card>
    </Page>
  );
}

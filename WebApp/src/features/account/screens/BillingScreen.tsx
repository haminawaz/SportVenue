'use client';

import { CreditCard } from '@phosphor-icons/react';

import type { Subscription } from '@/domain/types';
import { BarList } from '@/features/dashboard/components/Charts';
import { formatCalendarDate } from '@/lib/datetime';
import { formatMoney } from '@/lib/money';
import { AppText } from '@/ui/AppText';
import { Card, CardHeader } from '@/ui/Card';
import { DataTable } from '@/ui/DataTable';
import { EmptyState } from '@/ui/EmptyState';
import { Notice, QueryView } from '@/ui/States';
import { StatusBadge, type BadgeTone } from '@/ui/StatusBadge';

import { useSubscription } from '../api';
import { SettingsLayout } from '../components/SettingsLayout';

const STATUS: Record<Subscription['status'], { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: 'Active', tone: 'positive' },
  TRIALING: { label: 'Trial', tone: 'positive' },
  PAST_DUE: { label: 'Payment due', tone: 'danger' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

export function BillingScreen() {
  const query = useSubscription();
  return (
    <SettingsLayout onRefresh={() => query.refetch()}>
      <QueryView query={query} errorTitle="Couldn't load your subscription">
        {(s) => {
          const status = STATUS[s.status];
          const money = (n: number) => formatMoney(n, s.currency);
          return (
            <>
              {s.status === 'PAST_DUE' && <Notice tone="danger" title="Payment failed" message="Update your card to keep bookings running." />}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card tint="accent" className="flex flex-col gap-1">
                  <div className="flex items-center">
                    <AppText variant="label" tone="muted" className="flex-1">
                      Current plan
                    </AppText>
                    <StatusBadge label={status.label} tone={status.tone} />
                  </div>
                  <AppText as="h2" variant="page-title">
                    {s.plan}
                  </AppText>
                  <AppText variant="small" numeric>
                    {money(s.price)} per {s.interval === 'MONTH' ? 'month' : 'year'} · renews {formatCalendarDate(s.renewsOn)}
                  </AppText>
                </Card>
                <Card className="flex flex-col gap-3">
                  <AppText variant="label" tone="muted">
                    Usage
                  </AppText>
                  <BarList max={1} data={[{ key: 'courts', label: 'Courts', value: s.courtsUsed / s.courtsLimit, valueLabel: `${s.courtsUsed} of ${s.courtsLimit}` }]} />
                  <div className="flex items-center gap-2 border-t border-border pt-3">
                    <CreditCard size={18} className="text-text-muted" aria-hidden />
                    <AppText variant="small">{s.paymentMethod ? `${s.paymentMethod.brand} ending ${s.paymentMethod.last4} · Expires ${s.paymentMethod.expires}` : 'No card on file'}</AppText>
                  </div>
                </Card>
              </div>
              <Card padded={false}>
                <CardHeader title="Invoices" count={s.invoices.length} />
                {s.invoices.length === 0 ? (
                  <EmptyState compact icon={CreditCard} title="No invoices yet" />
                ) : (
                  <DataTable
                    caption="Invoices"
                    rows={s.invoices}
                    rowKey={(i) => i.id}
                    columns={[
                      { key: 'date', header: 'Date', cell: (i) => formatCalendarDate(i.date) },
                      { key: 'status', header: 'Status', cell: (i) => <StatusBadge label={i.status === 'PAID' ? 'Paid' : i.status === 'OPEN' ? 'Open' : 'Failed'} tone={i.status === 'PAID' ? 'positive' : i.status === 'OPEN' ? 'warning' : 'danger'} /> },
                      { key: 'amount', header: 'Amount', align: 'right', cell: (i) => <span className="t-text-strong">{money(i.amount)}</span> },
                    ]}
                  />
                )}
              </Card>
              <Notice message="Plan changes and card updates are made in the SportVenue web dashboard." />
            </>
          );
        }}
      </QueryView>
    </SettingsLayout>
  );
}

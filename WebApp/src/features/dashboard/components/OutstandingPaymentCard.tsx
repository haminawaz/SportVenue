import { memo } from 'react';
import { Bell, Receipt, Wallet } from '@phosphor-icons/react';

import { formatDayAndTime, type CalendarDate } from '@/lib/datetime';
import { formatMoney, formatMoneyForA11y } from '@/lib/money';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { StatusBadge } from '@/ui/StatusBadge';

import type { OutstandingPayment } from '../types/facilityDashboard.types';
import { bookingStatusMeta } from '../utils/dashboardFormatters';

type OutstandingPaymentCardProps = {
  payment: OutstandingPayment;
  timeZone: string;
  today: CalendarDate;
  /** The facility's plan includes payment reminders. */
  canRemind: boolean;
  reminding: boolean;
  remindDisabled: boolean;
  onViewBooking: (bookingId: string) => void;
  onRecord: (bookingId: string) => void;
  onRemind: (bookingId: string) => void;
};

/** An unpaid balance in the attention queue: who owes what, with Record and Remind. */
export const OutstandingPaymentCard = memo(function OutstandingPaymentCard({ payment: p, timeZone, today, canRemind, reminding, remindDisabled, onViewBooking, onRecord, onRemind }: OutstandingPaymentCardProps) {
  const when = formatDayAndTime(p.startAt, timeZone, today);
  const status = bookingStatusMeta(p.status);
  const a11y = `Outstanding payment from ${p.customerName}, ${formatMoneyForA11y(p.outstandingAmount, p.currency)}, ${p.courtName}, ${when}, ${status.label}`;

  return (
    <li className="flex flex-col gap-3 px-5 py-4">
      <button type="button" aria-label={a11y} title="Open the booking" onClick={() => onViewBooking(p.bookingId)} className="group flex items-start gap-3 text-left">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
          <Wallet size={16} weight="bold" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2">
            <AppText variant="text-strong" lines={1} className="flex-1 group-hover:underline">
              {p.customerName}
            </AppText>
            <AppText variant="text-strong" tone="warning" numeric>
              {formatMoney(p.outstandingAmount, p.currency)}
            </AppText>
          </span>
          <span className="flex items-center gap-2">
            <AppText variant="small" tone="muted" lines={1} className="flex-1">
              {p.courtName} · {when}
            </AppText>
            <StatusBadge label={status.label} tone={status.tone} />
          </span>
        </span>
      </button>
      <div className="flex flex-wrap gap-2 pl-11">
        <Button size="sm" variant="secondary" label="Record payment" icon={Receipt} aria-label={`Record payment from ${p.customerName}`} onPress={() => onRecord(p.bookingId)} />
        {canRemind && (
          <Button size="sm" variant="ghost" label="Remind" icon={Bell} loading={reminding} disabled={remindDisabled} aria-label={`Remind ${p.customerName} to pay`} onPress={() => onRemind(p.bookingId)} />
        )}
      </div>
    </li>
  );
});

import { CalendarBlank, Plus } from '@phosphor-icons/react';

import { formatTimeRange } from '@/lib/datetime';
import { formatMoney, formatMoneyForA11y } from '@/lib/money';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { cn } from '@/ui/cn';
import { EmptyState } from '@/ui/EmptyState';
import { StatusBadge } from '@/ui/StatusBadge';

import type { RecentBooking } from '../types/facilityDashboard.types';
import { bookingStatusMeta } from '../utils/dashboardFormatters';

type RecentBookingsSectionProps = {
  bookings: RecentBooking[];
  currency: string;
  timeZone: string;
  onBookingPress?: (bookingId: string) => void;
  onNewBooking?: () => void;
  onSeeAll?: () => void;
};

/** The latest bookings in the period as a compact table. */
export function RecentBookingsSection({ bookings, currency, timeZone, onBookingPress, onNewBooking, onSeeAll }: RecentBookingsSectionProps) {
  return (
    <Card padded={false} as="section">
      <CardHeader title="Recent bookings" actions={onSeeAll && <Button label="All bookings" variant="ghost" size="sm" onPress={onSeeAll} />} />
      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarBlank}
          title="No bookings for this period"
          message="Your facility has no bookings yet for the selected period."
          action={onNewBooking && <Button label="New booking" icon={Plus} onPress={onNewBooking} />}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Recent bookings</caption>
            <thead>
              <tr className="border-b border-border bg-surface-muted/50">
                {['Customer', 'Court', 'Time', 'Status', 'Amount'].map((h, i) => (
                  <th key={h} scope="col" className={cn('t-overline h-9 px-4 font-semibold text-text-subtle first:pl-5 last:pr-5', i === 4 && 'text-right', (i === 1 || i === 2) && 'hidden md:table-cell')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const time = formatTimeRange(b.startAt, b.endAt, timeZone);
                const status = bookingStatusMeta(b.status);
                const cancelled = b.status === 'CANCELLED';
                const a11y = `${b.customerName}, ${b.courtName}, ${time}, ${formatMoneyForA11y(b.amount, currency)}, ${status.label}`;
                return (
                  <tr key={b.bookingId} className="relative border-b border-border last:border-b-0 hover:bg-surface-muted/60">
                    <td className="py-2.5 pr-4 pl-5">
                      {onBookingPress ? (
                        <button type="button" aria-label={a11y} title="Open the booking" onClick={() => onBookingPress(b.bookingId)} className="text-left after:absolute after:inset-0 after:content-['']">
                          <AppText variant="text-strong" lines={1}>
                            {b.customerName}
                          </AppText>
                          <AppText variant="mini" tone="muted" lines={1} className="md:hidden">
                            {b.courtName} · {time}
                          </AppText>
                        </button>
                      ) : (
                        <AppText variant="text-strong">{b.customerName}</AppText>
                      )}
                    </td>
                    <td className="t-text hidden px-4 text-text-muted md:table-cell">{b.courtName}</td>
                    <td className="t-text hidden px-4 whitespace-nowrap text-text-muted tabular-nums md:table-cell">{time}</td>
                    <td className="px-4">
                      <StatusBadge label={status.label} tone={status.tone} />
                    </td>
                    <td className={cn('t-text-strong py-2.5 pr-5 pl-4 text-right whitespace-nowrap tabular-nums', cancelled && 'text-text-subtle line-through')}>{formatMoney(b.amount, currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

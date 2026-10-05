import { BOOKING_STATUS, PAYMENT_STATUS } from '@/domain/labels';
import type { Booking } from '@/domain/types';
import { facilityWallClock, formatCalendarDate, formatTime } from '@/lib/datetime';
import type { useFormat } from '@/lib/format';
import { AppText } from '@/ui/AppText';
import { cn } from '@/ui/cn';
import type { Column } from '@/ui/DataTable';
import { StatusBadge } from '@/ui/StatusBadge';

type Format = ReturnType<typeof useFormat>;

/** Payment is shown unless the booking was cancelled without a refund. */
const showPay = (b: Booking) => b.status !== 'CANCELLED' || b.paymentStatus === 'REFUNDED';

/** The bookings table columns, shared by the bookings list and a customer's history. */
export function bookingColumns(f: Format, { showCustomer = true }: { showCustomer?: boolean } = {}): Column<Booking>[] {
  const when = (b: Booking) => `${formatCalendarDate(facilityWallClock(b.startAt, f.timeZone).date)}`;
  const time = (b: Booking) => `${formatTime(b.startAt, f.timeZone)} - ${formatTime(b.endAt, f.timeZone)}`;
  const cols: Column<Booking>[] = [
    {
      key: 'when',
      header: 'Date',
      primary: !showCustomer,
      cell: (b) => (
        <span className="flex flex-col">
          <AppText variant="text-strong" numeric className="whitespace-nowrap">
            {when(b)}
          </AppText>
          <AppText variant="small" tone="muted" numeric className="whitespace-nowrap">
            {time(b)}
          </AppText>
        </span>
      ),
    },
  ];
  if (showCustomer) {
    cols.push({
      key: 'customer',
      header: 'Customer',
      primary: true,
      cell: (b) => (
        <span className="flex flex-col">
          <AppText variant="text-strong" lines={1}>
            {b.customerName}
          </AppText>
          <AppText variant="small" tone="muted" lines={1} className="md:hidden">
            {b.courtName}
          </AppText>
        </span>
      ),
    });
  }
  cols.push(
    { key: 'court', header: 'Court', hideBelow: 'md', cell: (b) => <span className="whitespace-nowrap text-text-muted">{b.courtName}</span> },
    {
      key: 'status',
      header: 'Status',
      hideBelow: 'sm',
      cell: (b) => <StatusBadge label={BOOKING_STATUS[b.status].label} tone={BOOKING_STATUS[b.status].tone} />,
    },
    {
      key: 'payment',
      header: 'Payment',
      hideBelow: 'lg',
      cell: (b) => (showPay(b) ? <StatusBadge label={PAYMENT_STATUS[b.paymentStatus].label} tone={PAYMENT_STATUS[b.paymentStatus].tone} /> : <span className="text-text-subtle">-</span>),
    },
    { key: 'ref', header: 'Reference', hideBelow: 'xl', cell: (b) => <span className="t-small text-text-muted tabular-nums">{b.reference}</span> },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cell: (b) => <span className={cn('t-text-strong whitespace-nowrap', b.status === 'CANCELLED' && 'text-text-subtle line-through')}>{f.money(b.total)}</span>,
    },
  );
  return cols;
}

/** Spoken label for a booking row link. */
export function bookingRowLabel(f: Format, b: Booking) {
  const clock = facilityWallClock(b.startAt, f.timeZone);
  return [b.customerName, b.courtName, formatCalendarDate(clock.date), `${formatTime(b.startAt, f.timeZone)} to ${formatTime(b.endAt, f.timeZone)}`, BOOKING_STATUS[b.status].label, showPay(b) ? PAYMENT_STATUS[b.paymentStatus].label : undefined, f.moneyA11y(b.total)]
    .filter(Boolean)
    .join(', ');
}

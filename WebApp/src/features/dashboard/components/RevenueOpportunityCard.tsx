import { ArrowsClockwise, Bell, CalendarCheck, CalendarX, ChartLineDown, Info, Lightbulb, Tag, Wallet } from '@phosphor-icons/react';

import { facilityWallClock, formatDayAndTime, formatTime, type CalendarDate } from '@/lib/datetime';
import { formatMoney } from '@/lib/money';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import type { IconType } from '@/ui/icon';

import type { KnownOpportunityType, Opportunity } from '../types/facilityDashboard.types';
import { recommendationText } from '../utils/dashboardFormatters';

const TYPE_ICON: Record<KnownOpportunityType, IconType> = {
  LOW_UTILIZATION: ChartLineDown,
  OUTSTANDING_PAYMENT: Wallet,
  CANCELLATION_RISK: CalendarX,
  REPEAT_CUSTOMER: ArrowsClockwise,
  PRICE_OPPORTUNITY: Tag,
  FULLY_BOOKED_PERIOD: CalendarCheck,
};

export type OpportunityHandlers = {
  onViewSlot: (courtId: string, date: CalendarDate) => void;
  onViewBooking: (bookingId: string) => void;
  onViewCustomer: (customerId: string) => void;
  onRemind: (bookingId: string) => void;
  onOpen?: (opportunityId: string) => void;
};

type RevenueOpportunityCardProps = {
  opportunity: Opportunity;
  currency: string;
  timeZone: string;
  today: CalendarDate;
  /** Used for "View court" when the opportunity has a court but no time. */
  fallbackDate: CalendarDate;
  /** The facility's plan includes payment reminders. */
  canRemind: boolean;
  reminding: boolean;
  handlers: OpportunityHandlers;
};

type Action = { key: string; label: string; icon?: IconType; onPress: () => void; loading?: boolean };

/**
 * An opportunity the backend identified, in the attention queue. It never
 * adds its own conclusions: the suggestion appears only when the backend sends
 * a recommendedAction, and actions appear only when the needed IDs exist.
 */
export function RevenueOpportunityCard({ opportunity: o, currency, timeZone, today, fallbackDate, canRemind, reminding, handlers }: RevenueOpportunityCardProps) {
  const Icon = TYPE_ICON[o.type as KnownOpportunityType] ?? Info;
  const when = o.startAt ? (o.endAt ? `${formatDayAndTime(o.startAt, timeZone, today)} - ${formatTime(o.endAt, timeZone)}` : formatDayAndTime(o.startAt, timeZone, today)) : null;
  const meta = [o.courtName, when].filter(Boolean).join(' · ');
  const suggestion = recommendationText(o.recommendedAction, (amount) => formatMoney(amount, currency));

  const actions: Action[] = [];
  if (o.courtId) {
    const courtId = o.courtId;
    const date = o.startAt ? facilityWallClock(o.startAt, timeZone).date : fallbackDate;
    actions.push({ key: 'slot', label: o.startAt ? 'View slot' : 'View court', onPress: () => handlers.onViewSlot(courtId, date) });
  }
  if (o.bookingId) {
    const bookingId = o.bookingId;
    actions.push({ key: 'booking', label: 'View booking', onPress: () => handlers.onViewBooking(bookingId) });
  }
  if (o.type === 'OUTSTANDING_PAYMENT' && o.bookingId && canRemind) {
    const bookingId = o.bookingId;
    actions.push({ key: 'remind', label: 'Remind', icon: Bell, onPress: () => handlers.onRemind(bookingId), loading: reminding });
  }
  if (o.customerId) {
    const customerId = o.customerId;
    actions.push({ key: 'customer', label: 'View customer', onPress: () => handlers.onViewCustomer(customerId) });
  }

  const label = [o.title, meta, o.description, suggestion].filter(Boolean).join('. ');
  const body = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon size={16} weight="bold" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <AppText variant="text-strong" className={handlers.onOpen ? 'group-hover:underline' : undefined}>
          {o.title}
        </AppText>
        {meta ? (
          <AppText variant="small" tone="muted">
            {meta}
          </AppText>
        ) : null}
        {o.description ? (
          <AppText variant="small" tone="muted" lines={2}>
            {o.description}
          </AppText>
        ) : null}
        {suggestion && (
          <span className="mt-1.5 flex items-center gap-1.5 text-accent">
            <Lightbulb size={14} weight="fill" aria-hidden />
            <AppText variant="label" className="text-current">
              {suggestion}
            </AppText>
          </span>
        )}
      </span>
    </>
  );

  return (
    <li className="flex flex-col gap-3 px-5 py-4">
      {handlers.onOpen ? (
        <button type="button" aria-label={label} title="Open opportunity details" onClick={() => handlers.onOpen?.(o.id)} className="group flex items-start gap-3 text-left">
          {body}
        </button>
      ) : (
        <div role="group" aria-label={label} className="flex items-start gap-3">
          {body}
        </div>
      )}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-11">
          {actions.slice(0, 2).map((a, i) => (
            <Button key={a.key} size="sm" variant={i === 0 ? 'secondary' : 'ghost'} label={a.label} icon={a.icon} onPress={a.onPress} loading={a.loading} />
          ))}
        </div>
      )}
    </li>
  );
}

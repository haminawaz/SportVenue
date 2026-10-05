import { CourtBasketball } from '@phosphor-icons/react';

import { formatMoney, formatMoneyForA11y } from '@/lib/money';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { ProgressBar } from '@/ui/ProgressBar';

import type { CourtUtilization } from '../types/facilityDashboard.types';
import { formatPercent } from '../utils/dashboardFormatters';

type CourtUtilizationSectionProps = {
  courts: CourtUtilization[];
  currency: string;
  title: string;
  onCourtPress: (courtId: string) => void;
  onSeeAll?: () => void;
};

/** Each court's share of booked time for the period, as a scannable bar list. */
export function CourtUtilizationSection({ courts, currency, title, onCourtPress, onSeeAll }: CourtUtilizationSectionProps) {
  return (
    <Card padded={false} as="section">
      <CardHeader title={title} actions={onSeeAll && <Button label="All courts" variant="ghost" size="sm" onPress={onSeeAll} />} />
      {courts.length === 0 ? (
        <EmptyState compact icon={CourtBasketball} title="No courts to show" message="Courts appear here once they are set up for booking." />
      ) : (
        <ul className="divide-y divide-border">
          {courts.map((court) => {
            const slots = `${court.bookedSlots} of ${court.totalSlots} slots booked`;
            const a11y = [court.name, court.sport, `${Math.round(court.utilizationPercentage)} percent utilized`, slots, court.revenue !== undefined ? `${formatMoneyForA11y(court.revenue, currency)} revenue` : undefined]
              .filter(Boolean)
              .join(', ');
            return (
              <li key={court.id}>
                <button
                  type="button"
                  aria-label={a11y}
                  title="Open this court's bookings"
                  onClick={() => onCourtPress(court.id)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-5 py-3 text-left transition-colors hover:bg-surface-muted/60 sm:grid-cols-[minmax(120px,180px)_minmax(0,1fr)_56px_auto]"
                >
                  <span className="flex min-w-0 flex-col">
                    <AppText variant="text-strong" lines={1}>
                      {court.name}
                    </AppText>
                    {court.sport && (
                      <AppText variant="mini" tone="muted" lines={1}>
                        {court.sport}
                      </AppText>
                    )}
                  </span>
                  <span className="order-last col-span-2 flex flex-col gap-1 sm:order-none sm:col-span-1">
                    <ProgressBar value={court.utilizationPercentage} />
                    <AppText variant="mini" tone="muted" numeric>
                      {slots}
                    </AppText>
                  </span>
                  <AppText variant="text-strong" numeric className="text-right">
                    {formatPercent(court.utilizationPercentage)}
                  </AppText>
                  {court.revenue !== undefined && (
                    <AppText variant="small" tone="muted" numeric className="hidden min-w-[88px] text-right sm:block">
                      {formatMoney(court.revenue, currency)}
                    </AppText>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

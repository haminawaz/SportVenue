'use client';

import type { BookingQuote } from '@/domain/types';
import { useFormat } from '@/lib/format';
import { AppText } from '@/ui/AppText';
import { cn } from '@/ui/cn';
import { Skeleton } from '@/ui/Skeleton';

type QuoteSummaryProps = { quote?: BookingQuote; loading?: boolean; previousTotal?: number; error?: boolean };

/** Server-priced breakdown. The app never adds these numbers up itself. */
export function QuoteSummary({ quote, loading, previousTotal, error }: QuoteSummaryProps) {
  const f = useFormat();

  return (
    <div aria-live="polite" className="flex flex-col gap-3">
      {error ? (
        <AppText variant="small" tone="danger">
          Couldn’t price this slot. Choose it again.
        </AppText>
      ) : !quote ? (
        loading ? (
          <div role="progressbar" aria-label="Calculating price" className="flex flex-col gap-2">
            <Skeleton width="80%" height={14} />
            <Skeleton width="40%" height={22} />
          </div>
        ) : (
          <AppText variant="small" tone="muted">
            Choose a court and time to see the price.
          </AppText>
        )
      ) : (
        <div className={cn('flex flex-col gap-2 transition-opacity', loading && 'opacity-50')}>
          {quote.breakdown.map((l) => (
            <div key={l.label} className="flex items-baseline gap-3">
              <AppText variant="small" tone="muted" className="flex-1">
                {l.label}
              </AppText>
              <AppText variant="text" numeric tone={l.amount < 0 ? 'accent' : 'default'}>
                {l.amount < 0 ? `-${f.money(-l.amount)}` : f.money(l.amount)}
              </AppText>
            </div>
          ))}
          <div className="mt-1 flex items-baseline gap-3 border-t border-border pt-3">
            <AppText variant="text-strong" className="flex-1">
              Total
            </AppText>
            <AppText variant="stat" numeric aria-label={`Total ${f.moneyA11y(quote.total)}`} className="text-2xl">
              {f.money(quote.total)}
            </AppText>
          </div>
          {previousTotal !== undefined && previousTotal !== quote.total && (
            <AppText variant="small" tone="muted">
              Was {f.money(previousTotal)}. {quote.total > previousTotal ? `The customer will owe ${f.money(quote.total - previousTotal)} more.` : `The price drops by ${f.money(previousTotal - quote.total)}.`}
            </AppText>
          )}
        </div>
      )}
    </div>
  );
}

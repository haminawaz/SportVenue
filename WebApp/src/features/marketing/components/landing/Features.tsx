import { AddressBook, CalendarCheck, ChartLineUp, CourtBasketball, Wallet } from '@phosphor-icons/react';

import { AppText } from '@/ui/AppText';
import { cn } from '@/ui/cn';
import type { IconType } from '@/ui/icon';

import { Section } from './LandingScroll';

type Feature = { key: string; title: string; body: string; icon: IconType };

/** Five cards, one per job an owner does. No staff management: SportVenue has one owner account. */
const FEATURES: Feature[] = [
  { key: 'calendar', title: 'Booking calendar', body: 'Every court, every hour on one screen. Spot free slots and book them in a few taps.', icon: CalendarCheck },
  { key: 'courts', title: 'Courts and hours', body: 'Set opening hours, base rates and peak pricing for each court once.', icon: CourtBasketball },
  { key: 'customers', title: 'Customer records', body: 'Phone numbers, booking history and balances for every regular in one place.', icon: AddressBook },
  { key: 'payments', title: 'Payments and balances', body: 'Record cash, card or transfer payments and remind anyone who still owes you.', icon: Wallet },
  { key: 'analytics', title: 'Revenue analytics', body: 'Revenue, utilization and peak hours by court, for any period you choose.', icon: ChartLineUp },
];

/**
 * 1 column on phones, 2 from 520px, 3 from 900px (measured on the grid itself).
 * The first card is featured and spans two columns so five cards always fill
 * the grid with no gaps.
 */
export function Features() {
  return (
    <Section id="features">
      <div className="flex flex-col gap-3">
        <AppText as="h2" variant="display-xl">
          Everything your facility runs on.
        </AppText>
        <AppText as="p" tone="muted" variant="body-md" className="max-w-[520px]">
          One app for the front counter, the courts and the books.
        </AppText>
      </div>
      <div className="@container">
        <ul className="grid grid-cols-1 gap-3 @min-[520px]:grid-cols-2 @min-[900px]:grid-cols-3">
          {FEATURES.map((f, i) => {
            const featured = i === 0;
            const Icon = f.icon;
            return (
              <li
                key={f.key}
                className={cn(
                  'flex min-h-[200px] flex-col gap-3 rounded-card border p-6',
                  featured ? 'border-border bg-surface @min-[520px]:col-span-2 @min-[520px]:border-transparent @min-[520px]:bg-accent-soft' : 'border-border bg-surface',
                )}
              >
                <span
                  className={cn(
                    'mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-accent',
                    featured && '@min-[520px]:bg-surface',
                  )}
                >
                  <Icon size={24} weight="bold" aria-hidden />
                </span>
                <AppText as="h3" variant="title-md" className={cn(featured && '@min-[520px]:t-display-md')}>
                  {f.title}
                </AppText>
                <AppText as="p" variant="body-md" tone="muted">
                  {f.body}
                </AppText>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

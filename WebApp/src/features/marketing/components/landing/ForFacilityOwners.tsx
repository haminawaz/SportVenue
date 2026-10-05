import { CheckCircle, XCircle } from '@phosphor-icons/react';

import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import type { IconType } from '@/ui/icon';

import { Section } from './LandingScroll';

const BEFORE = ['Bookings buried in WhatsApp chats', 'Balances tracked in Excel, or not at all', 'Double-booked courts on busy evenings', 'No idea which hours make money'];
const AFTER = ['Every booking on one calendar', 'Outstanding balances with a reminder button', 'Slots that can only be sold once', 'Revenue and utilization by court and hour'];

/** The owner-to-owner section: an ink panel naming the daily mess, then what changes. */
export function ForFacilityOwners({ onBookDemo }: { onBookDemo: () => void }) {
  return (
    <Section id="owners" bandClassName="px-3" className="gap-8 rounded-hero bg-ink px-6 py-10">
      <div className="flex flex-col gap-3">
        <AppText as="h2" variant="display-xl" className="text-on-ink">
          Built for the people who run the venue.
        </AppText>
        <AppText as="p" className="max-w-[560px] text-on-ink-muted">
          Players get a booking app. You get the back office that keeps the courts full and the books straight.
        </AppText>
      </div>
      <div className="flex flex-col gap-4 md:flex-row">
        <Column title="Without SportVenue" items={BEFORE} icon={XCircle} tone="muted" />
        <Column title="With SportVenue" items={AFTER} icon={CheckCircle} tone="accent" />
      </div>
      <div className="flex items-start">
        <Button label="Book a demo" variant="inverse" size="lg" onPress={onBookDemo} />
      </div>
    </Section>
  );
}

function Column({ title, items, icon: Icon, tone }: { title: string; items: string[]; icon: IconType; tone: 'muted' | 'accent' }) {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-card border border-ink-line p-5">
      <AppText as="h3" variant="caption-uppercase" className={tone === 'accent' ? 'text-ink-accent' : 'text-on-ink-muted'}>
        {title}
      </AppText>
      <ul className="flex flex-col gap-3">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-3">
            <Icon size={22} weight={tone === 'accent' ? 'fill' : 'regular'} className={cn('mt-px shrink-0', tone === 'accent' ? 'text-ink-accent' : 'text-on-ink-muted')} aria-hidden />
            <AppText className={cn('flex-1', tone === 'accent' ? 'text-on-ink' : 'text-on-ink-muted')}>{t}</AppText>
          </li>
        ))}
      </ul>
    </div>
  );
}

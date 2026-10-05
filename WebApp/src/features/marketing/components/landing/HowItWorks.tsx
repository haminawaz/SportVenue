import { AppText } from '@/ui/AppText';
import { cn } from '@/ui/cn';

import { Section } from './LandingScroll';

const STEPS = [
  { title: 'Add your courts', body: 'Set opening hours, base rates and peak pricing once.' },
  { title: 'Manage bookings', body: 'Book customers into open slots and see every court at a glance.' },
  { title: 'Grow revenue', body: 'Collect what you are owed and fill the hours that sit empty.' },
];

/** Three numbered steps: a row from 768px, a connected vertical list on phones. */
export function HowItWorks() {
  return (
    <Section id="how">
      <AppText as="h2" variant="display-xl">
        Up and running in an afternoon.
      </AppText>
      <ol className="flex flex-col md:flex-row md:gap-6">
        {STEPS.map((s, i) => {
          const last = i === STEPS.length - 1;
          return (
            <li key={s.title} aria-label={`Step ${i + 1}: ${s.title}. ${s.body}`} className="flex gap-4 md:flex-1 md:flex-col">
              <div aria-hidden className="flex flex-col items-center md:flex-row md:self-stretch">
                <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent">
                  <AppText variant="display-md" tone="accent">
                    {i + 1}
                  </AppText>
                </span>
                {!last && <span className="my-2 w-[1.5px] flex-1 bg-border md:mx-3 md:my-0 md:h-[1.5px] md:w-auto" />}
              </div>
              <div className={cn('flex flex-1 flex-col gap-1 pt-3', !last && 'pb-8 md:pb-0')}>
                <AppText as="h3" variant="title-md">
                  {s.title}
                </AppText>
                <AppText as="p" tone="muted">
                  {s.body}
                </AppText>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

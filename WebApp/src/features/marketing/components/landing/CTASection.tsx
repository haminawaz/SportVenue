import { ArrowRight } from '@phosphor-icons/react';

import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';

import { Section } from './LandingScroll';

/** Closing band: one headline, one action, nothing else. */
export function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <Section bandClassName="px-3" className="items-center gap-4 rounded-hero bg-ink px-6 py-14">
      <AppText as="h2" variant="display-xl" className="text-center text-on-ink">
        Put your facility on SportVenue.
      </AppText>
      <AppText as="p" variant="body-md" className="max-w-[480px] text-center text-on-ink-muted">
        We set it up with your courts and prices, then walk you through it.
      </AppText>
      <div className="mt-2">
        <Button label="Get started" variant="accent" size="lg" trailingIcon={ArrowRight} onPress={onGetStarted} />
      </div>
    </Section>
  );
}

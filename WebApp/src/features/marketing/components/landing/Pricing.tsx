import { Receipt } from '@phosphor-icons/react';

import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';

import { Section } from './LandingScroll';

/** Pricing tiers are not published yet, so this section asks for a quote instead. */
export function Pricing({ onGetQuote }: { onGetQuote: () => void }) {
  return (
    <Section id="pricing">
      <div className="surface-card flex flex-col items-start gap-5 p-6 md:flex-row md:items-center md:p-8">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Receipt size={26} weight="bold" aria-hidden />
        </span>
        <div className="flex flex-col gap-2 md:flex-1">
          <AppText as="h2" variant="display-lg">
            Pricing that fits your facility.
          </AppText>
          <AppText as="p" tone="muted">
            Plans depend on how many courts you run. Tell us about your facility and we will send you a quote.
          </AppText>
        </div>
        <Button label="Get a quote" variant="secondary" size="lg" onPress={onGetQuote} className="md:self-center" />
      </div>
    </Section>
  );
}

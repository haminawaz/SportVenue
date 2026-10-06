import { Button } from '@/ui/Button';

import { Lede, Section, SectionTitle } from './LandingScroll';

/**
 * Pricing and the closing call to action in one place: plans are quoted per
 * facility, so the section offers a quote or a demo instead of a price table.
 */
export function Pricing({ onGetQuote, onBookDemo }: { onGetQuote: () => void; onBookDemo: () => void }) {
  return (
    <Section id="pricing">
      <div className="flex flex-col gap-8 rounded-hero border border-border bg-surface p-8 sm:p-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16 lg:p-14">
        <div className="flex flex-col gap-4">
          <SectionTitle>Pricing that fits your facility.</SectionTitle>
          <Lede>Plans depend on how many courts you run. Tell us about your facility and we will send you a quote, or book a demo first.</Lede>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button label="Get a quote" variant="accent" size="lg" onPress={onGetQuote} />
          <Button label="Book a demo" variant="secondary" size="lg" onPress={onBookDemo} />
        </div>
      </div>
    </Section>
  );
}

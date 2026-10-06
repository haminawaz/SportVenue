'use client';

import type { CSSProperties } from 'react';
import { ArrowRight } from '@phosphor-icons/react';

import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';

import { COLUMN } from './LandingScroll';
import { ProductShot } from './ProductShot';

type HeroProps = { onGetStarted: () => void; onBookDemo: () => void };

/** Staggered entrance: copy, actions, then the product (static under reduced motion). */
const rise = (i: number): CSSProperties => ({ animationDelay: `${i * 90}ms` });

/**
 * Left-aligned copy with one action pair, then the real dashboard. The
 * screenshot is cropped by a fade so the page continues below it without a
 * hard edge; the headline and actions always sit above the fold.
 */
export function Hero({ onGetStarted, onBookDemo }: HeroProps) {
  return (
    <div id="top" className="overflow-hidden pt-14 sm:pt-20 lg:pt-24">
      <div className={cn(COLUMN, 'flex flex-col gap-6')}>
        <h1
          className="max-w-[16ch] animate-rise font-display text-[40px] leading-[1.04] font-normal tracking-[-0.025em] text-balance text-text sm:text-[54px] lg:text-[68px]"
          style={rise(0)}
        >
          The back office for your sports facility.
        </h1>
        <p className="max-w-[52ch] animate-rise text-[17px] leading-[1.6] text-pretty text-text-muted sm:text-lg" style={rise(1)}>
          Bookings, payments and customers for every court, in one place. Built for padel, tennis, futsal and squash venues.
        </p>
        <div className="flex animate-rise flex-wrap gap-3 pt-2" style={rise(2)}>
          <Button label="Get started" variant="accent" size="lg" trailingIcon={ArrowRight} onPress={onGetStarted} />
          <Button label="Book a demo" variant="secondary" size="lg" onPress={onBookDemo} />
        </div>
      </div>

      <div className={cn(COLUMN, 'mt-14 animate-rise lg:mt-16')} style={rise(3)}>
        <div className="[mask-image:linear-gradient(to_bottom,black_62%,transparent)]">
          <ProductShot
            name="dashboard"
            priority
            alt="The SportVenue dashboard for a padel club: revenue, bookings, utilization and average booking for this week, with revenue by day and by court."
            className="max-h-[640px]"
          />
        </div>
      </div>
    </div>
  );
}

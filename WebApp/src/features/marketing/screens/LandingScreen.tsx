'use client';

import { useMemo } from 'react';

import { routes } from '@/navigation/routes';
import { useReducedMotion } from '@/ui/useReducedMotion';

import { Features } from '../components/landing/Features';
import { Footer } from '../components/landing/Footer';
import { ForFacilityOwners } from '../components/landing/ForFacilityOwners';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { LandingScrollProvider, type LandingLinks, type SectionId } from '../components/landing/LandingScroll';
import { Nav } from '../components/landing/Nav';
import { Pricing } from '../components/landing/Pricing';

/**
 * Marketing page for signed-out visitors: sticky nav, hero with the real
 * dashboard, a product tour of real screens, how it works, the owner section,
 * pricing (quote or demo) and the footer. Stats and testimonials are left out
 * until there are real numbers and real quotes to show.
 */
/** Real links (not router pushes), so they open in a new tab and crawlers can follow them. */
const LINKS: LandingLinks = {
  getStarted: routes.requestDemo(),
  bookDemo: routes.requestDemo('demo'),
  getQuote: routes.requestDemo('quote'),
  login: routes.signIn,
};

/** The tab title comes from the page's metadata (app/(public)/welcome/page.tsx); nothing here overrides it. */
export function LandingScreen() {
  const reduced = useReducedMotion();

  const api = useMemo(
    () => ({
      scrollTo: (id: SectionId) => document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }),
    }),
    [reduced],
  );

  return (
    <LandingScrollProvider value={api}>
      <div className="min-h-dvh bg-background">
        <Nav links={LINKS} />
        <main>
          <Hero links={LINKS} />
          <Features />
          <HowItWorks />
          <ForFacilityOwners />
          <Pricing links={LINKS} />
        </main>
        <Footer links={LINKS} />
      </div>
    </LandingScrollProvider>
  );
}

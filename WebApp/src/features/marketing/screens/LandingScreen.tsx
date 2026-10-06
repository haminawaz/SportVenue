'use client';

import { useMemo } from 'react';

import { routes, type Href } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { useDocumentTitle } from '@/ui/Page';
import { useReducedMotion } from '@/ui/useReducedMotion';

import { Features } from '../components/landing/Features';
import { Footer } from '../components/landing/Footer';
import { ForFacilityOwners } from '../components/landing/ForFacilityOwners';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { LandingScrollProvider, type SectionId } from '../components/landing/LandingScroll';
import { Nav } from '../components/landing/Nav';
import { Pricing } from '../components/landing/Pricing';

/**
 * Marketing page for signed-out visitors: sticky nav, hero with the real
 * dashboard, a product tour of real screens, how it works, the owner section,
 * pricing (quote or demo) and the footer. Stats and testimonials are left out
 * until there are real numbers and real quotes to show.
 */
export function LandingScreen() {
  const router = useAppRouter();
  const reduced = useReducedMotion();
  useDocumentTitle(undefined);

  const api = useMemo(
    () => ({
      scrollTo: (id: SectionId) => document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }),
    }),
    [reduced],
  );

  const go = (href: Href) => () => router.push(href);
  const getStarted = go(routes.requestDemo());
  const bookDemo = go(routes.requestDemo('demo'));
  const getQuote = go(routes.requestDemo('quote'));
  const login = go(routes.signIn);

  return (
    <LandingScrollProvider value={api}>
      <div className="min-h-dvh bg-background">
        <Nav onLogin={login} onGetStarted={getStarted} />
        <main>
          <Hero onGetStarted={getStarted} onBookDemo={bookDemo} />
          <Features />
          <HowItWorks />
          <ForFacilityOwners />
          <Pricing onGetQuote={getQuote} onBookDemo={bookDemo} />
        </main>
        <Footer onLogin={login} onGetStarted={getStarted} onBookDemo={bookDemo} onGetQuote={getQuote} />
      </div>
    </LandingScrollProvider>
  );
}

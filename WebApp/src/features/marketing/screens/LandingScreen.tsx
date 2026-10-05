'use client';

import { useMemo } from 'react';

import { routes, type Href } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { useDocumentTitle } from '@/ui/LargeTitle';

import { CTASection } from '../components/landing/CTASection';
import { Features } from '../components/landing/Features';
import { Footer } from '../components/landing/Footer';
import { ForFacilityOwners } from '../components/landing/ForFacilityOwners';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { LandingScrollProvider, type SectionId } from '../components/landing/LandingScroll';
import { NAV_HEIGHT, Nav } from '../components/landing/Nav';
import { Pricing } from '../components/landing/Pricing';

/** Section bands start with 80px of padding above their heading. */
const SECTION_PAD = 80;

/**
 * Marketing page for signed-out visitors: nav, hero with a live calendar
 * preview, features, how it works, the owner section, pricing (quote), a
 * closing call to action and the footer. Stats and testimonials are left out
 * until there are real numbers and real quotes to show.
 */
export function LandingScreen() {
  const router = useAppRouter();
  useDocumentTitle(undefined);

  const api = useMemo(
    () => ({
      scrollTo: (id: SectionId) => {
        const el = document.getElementById(id);
        if (!el) return;
        const y = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.max(0, y + SECTION_PAD - NAV_HEIGHT - 16), behavior: 'smooth' });
      },
    }),
    [],
  );

  const go = (href: Href) => () => router.push(href);
  const getStarted = go(routes.requestDemo());
  const bookDemo = go(routes.requestDemo('demo'));
  const getQuote = go(routes.requestDemo('quote'));
  const login = go(routes.signIn);

  return (
    <LandingScrollProvider value={api}>
      <main className="min-h-dvh bg-background">
        <Hero topInset={NAV_HEIGHT} onGetStarted={getStarted} onHowItWorks={() => api.scrollTo('how')} />
        <Features />
        <HowItWorks />
        <ForFacilityOwners onBookDemo={bookDemo} />
        <Pricing onGetQuote={getQuote} />
        <CTASection onGetStarted={getStarted} />
        <Footer onLogin={login} onGetStarted={getStarted} onBookDemo={bookDemo} />
      </main>
      <Nav onLogin={login} onGetStarted={getStarted} />
    </LandingScrollProvider>
  );
}

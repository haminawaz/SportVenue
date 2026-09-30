import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

import { CTASection } from '../components/landing/CTASection';
import { Features } from '../components/landing/Features';
import { Footer } from '../components/landing/Footer';
import { ForFacilityOwners } from '../components/landing/ForFacilityOwners';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { LandingScrollProvider, type SectionId } from '../components/landing/LandingScroll';
import { NAV_HEIGHT, Nav } from '../components/landing/Nav';
import { Pricing } from '../components/landing/Pricing';

/** Sections reveal when their top passes this share of the screen height. */
const REVEAL_AT = 0.88;
/** Section bands start with 80pt of padding above their heading. */
const SECTION_PAD = 80;

/**
 * Marketing page for signed-out visitors: nav, hero with a live calendar
 * preview, features, how it works, the owner section, pricing (quote), a
 * closing call to action and the footer. Stats and testimonials are left out
 * until there are real numbers and real quotes to show.
 */
export function LandingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const blurTarget = useRef<View>(null);
  const [scrollY] = useState(() => new Animated.Value(0));
  const offset = useRef(0);
  const sectionY = useRef<Partial<Record<SectionId, number>>>({});
  const revealers = useRef(new Set<{ y: number; show: () => void; shown: boolean }>());
  const navHeight = insets.top + NAV_HEIGHT;

  const reveal = useCallback(() => {
    const line = offset.current + height * REVEAL_AT;
    revealers.current.forEach((r) => {
      if (!r.shown && r.y < line) {
        r.shown = true;
        r.show();
      }
    });
  }, [height]);

  const api = useMemo(
    () => ({
      scrollTo: (id: SectionId) => {
        const y = sectionY.current[id];
        if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y + SECTION_PAD - navHeight - 16), animated: true });
      },
      setSectionY: (id: SectionId, y: number) => {
        sectionY.current[id] = y;
      },
      register: (r: { y: number; show: () => void; shown: boolean }) => {
        revealers.current.add(r);
        reveal();
        return () => {
          revealers.current.delete(r);
        };
      },
    }),
    [navHeight, reveal],
  );

  // A plain JS scroll handler (not the native driver): every scroll event reliably
  // reaches JS on all devices, so the header state and section reveals never miss one.
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      offset.current = y;
      scrollY.setValue(y);
      reveal();
    },
    [scrollY, reveal],
  );

  const go = (href: Href) => () => router.push(href);
  const getStarted = go('/request-demo');
  const bookDemo = go('/request-demo?intent=demo');
  const getQuote = go('/request-demo?intent=quote');
  const login = go('/sign-in');

  return (
    <LandingScrollProvider value={api}>
      {/* Android blurs only what sits inside the target; the header stays outside it. */}
      <BlurTargetView ref={blurTarget} style={[styles.fill, { backgroundColor: colors.background }]}>
        <ScrollView
          ref={scrollRef}
          style={styles.fill}
          onScroll={onScroll}
          onScrollEndDrag={onScroll}
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={16}
        >
          <Hero topInset={navHeight} onGetStarted={getStarted} onHowItWorks={() => api.scrollTo('how')} />
          <Features />
          <HowItWorks />
          <ForFacilityOwners onBookDemo={bookDemo} />
          <Pricing onGetQuote={getQuote} />
          <CTASection onGetStarted={getStarted} />
          <Footer onLogin={login} onGetStarted={getStarted} onBookDemo={bookDemo} />
        </ScrollView>
      </BlurTargetView>
      <Nav scrollY={scrollY} blurTarget={blurTarget} onLogin={login} onGetStarted={getStarted} />
    </LandingScrollProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

import { useCallback, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { routes } from '@/navigation/routes';
import { useTheme } from '@/theme/ThemeProvider';
import { useReducedMotion } from '@/ui/useReducedMotion';

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

/**
 * Marketing screen for signed-out visitors, matching the web landing page:
 * fixed header, hero with the real dashboard, a product tour of real screens,
 * how it works, the owner section, pricing (quote or demo) and the footer.
 * Stats and testimonials are left out until there are real numbers and real
 * quotes to show.
 */
export function LandingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const scrollRef = useRef<ScrollView>(null);
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
        if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - navHeight), animated: !reduced });
      },
      scrollToTop: () => scrollRef.current?.scrollTo({ y: 0, animated: !reduced }),
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
    [navHeight, reveal, reduced],
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current = e.nativeEvent.contentOffset.y;
      reveal();
    },
    [reveal],
  );

  const getStarted = () => router.push(routes.requestDemo());
  const bookDemo = () => router.push(routes.requestDemo('demo'));
  const getQuote = () => router.push(routes.requestDemo('quote'));
  const login = () => router.push(routes.signIn);

  return (
    <LandingScrollProvider value={api}>
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <ScrollView ref={scrollRef} style={styles.fill} onScroll={onScroll} onScrollEndDrag={onScroll} onMomentumScrollEnd={onScroll} scrollEventThrottle={16}>
          <Hero topInset={navHeight} onGetStarted={getStarted} onBookDemo={bookDemo} />
          <Features />
          <HowItWorks />
          <ForFacilityOwners />
          <Pricing onGetQuote={getQuote} onBookDemo={bookDemo} />
          <Footer onLogin={login} onGetStarted={getStarted} onBookDemo={bookDemo} onGetQuote={getQuote} />
        </ScrollView>
        <Nav onLogin={login} onGetStarted={getStarted} />
      </View>
    </LandingScrollProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

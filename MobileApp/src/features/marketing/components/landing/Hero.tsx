import { useEffect, useState } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ArrowRight } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { useReducedMotion } from '@/ui/useReducedMotion';

import { LANDING_MAX, WIDE_AT } from './LandingScroll';
import { BottomFade, ProductShot, SHOT_RATIO, useShotFrame } from './ProductShot';

type HeroProps = { topInset: number; onGetStarted: () => void; onBookDemo: () => void };

/**
 * Left-aligned copy with one action pair, then the real dashboard screen.
 * Phones stack them; tablets put the screen beside the copy. The screen is
 * cropped and fades into the page so the next section follows on naturally.
 */
export function Hero({ topInset, onGetStarted, onBookDemo }: HeroProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_AT;
  const reduced = useReducedMotion();
  const [intro] = useState(() => [0, 1, 2, 3].map(() => new Animated.Value(0)));

  // Staggered entrance: headline, subtext, actions, then the screen.
  useEffect(() => {
    if (reduced) {
      intro.forEach((v) => v.setValue(1));
      return;
    }
    const a = Animated.stagger(
      90,
      intro.map((v) => Animated.spring(v, { toValue: 1, stiffness: 110, damping: 20, mass: 1, useNativeDriver: true })),
    );
    a.start();
    return () => a.stop();
  }, [intro, reduced]);

  const rise = (i: number) => ({ opacity: intro[i], transform: [{ translateY: intro[i].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] });

  const column = Math.min(width, LANDING_MAX + spacing.xl * 2) - spacing.xl * 2;
  const shotWidth = wide ? Math.min(340, column * 0.42) : Math.min(320, column - spacing.xxl * 2);
  const cropHeight = Math.min(shotWidth * SHOT_RATIO, wide ? 620 : 520);
  const frame = useShotFrame();

  return (
    <View style={[styles.band, { paddingTop: topInset + (wide ? 64 : spacing.huge) }]}>
      <View style={[styles.inner, wide && styles.innerWide]}>
        <View style={[styles.copy, wide && styles.copyWide]}>
          <Animated.View style={rise(0)}>
            <AppText role="heading" aria-level={1} style={[typography['display-mega'], wide && styles.h1Wide, { color: colors.text }]}>
              The back office for your sports facility.
            </AppText>
          </Animated.View>
          <Animated.View style={rise(1)}>
            <AppText tone="muted" style={styles.lead}>
              Bookings, payments and customers for every court, in one place. Built for padel, tennis, futsal and squash venues.
            </AppText>
          </Animated.View>
          <Animated.View style={[styles.ctas, rise(2)]}>
            <Button label="Get started" variant="accent" trailingIcon={ArrowRight} onPress={onGetStarted} />
            <Button label="Book a demo" variant="secondary" onPress={onBookDemo} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.shotWrap, wide && styles.shotWrapWide, rise(3)]}>
          <View style={[frame, { width: shotWidth, height: cropHeight }]}>
            <ProductShot
              name="dashboard"
              width={shotWidth}
              alt="The SportVenue dashboard for a padel club: revenue, bookings, utilization and average booking for today, with revenue over time below."
            />
            <BottomFade height={cropHeight * 0.32} color={colors.background} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { paddingHorizontal: spacing.xl },
  inner: { width: '100%', maxWidth: LANDING_MAX, alignSelf: 'center', gap: spacing.huge + spacing.sm },
  innerWide: { flexDirection: 'row', alignItems: 'center', gap: 56 },
  copy: { gap: spacing.xl },
  copyWide: { flex: 1 },
  h1Wide: { fontSize: 56, lineHeight: 58, letterSpacing: -1.6 },
  lead: { maxWidth: 520, fontSize: 17, lineHeight: 26 },
  // Both actions share one line from 360pt up; they wrap only on smaller screens.
  ctas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingTop: spacing.xs },
  shotWrap: { alignItems: 'center' },
  shotWrapWide: { flexShrink: 0 },
});

import { useEffect, useState, type RefObject } from 'react';
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';

import { BrandMark } from '../BrandMark';

import { LANDING_MAX, useLandingScroll, type SectionId } from './LandingScroll';

const PILL_HEIGHT = 60;
const PILL_TOP = spacing.sm;
/** Space the header takes at the top of the page, below the safe area. */
export const NAV_HEIGHT = PILL_HEIGHT + PILL_TOP;
/** Scroll distance after which the frosted header appears. */
const SOLID_AT = 12;

const LINKS: { id: SectionId; label: string }[] = [
  { id: 'features', label: 'Features' },
  { id: 'how', label: 'How it works' },
  { id: 'owners', label: 'For facility owners' },
  { id: 'pricing', label: 'Pricing' },
];

type NavProps = {
  scrollY: Animated.Value;
  /** The scroll content, wrapped in a BlurTargetView (Android blurs only what it wraps). */
  blurTarget: RefObject<View | null>;
  onLogin: () => void;
  onGetStarted: () => void;
};

/**
 * Sticky header. Transparent over the hero; once the page scrolls, the top
 * strip (status bar down to the middle of the header) turns into a frosted
 * band and the header sits on a frosted pill rounded at both ends.
 *
 * The blur views stay mounted for the life of the page (a remounted blur view
 * can stay unblurred on Android) and switch intensity each time the page
 * leaves or returns to the top. Only the tint layers fade with scroll, and the
 * header re-renders only when it crosses the top.
 */
export function Nav({ scrollY, blurTarget, onLogin, onGetStarted }: NavProps) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { scrollTo } = useLandingScroll();
  const [scrolled, setScrolled] = useState(false);
  const wide = width >= 1024;
  const mid = width >= 640;

  // React skips the re-render when the value is unchanged, so this only renders on crossings.
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => setScrolled(value > SOLID_AT));
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const tint = scrollY.interpolate({ inputRange: [0, 48], outputRange: [0, 1], extrapolate: 'clamp' });
  const blurTint = scheme === 'dark' ? 'dark' : 'light';

  return (
    <View style={[styles.host, { paddingTop: insets.top + PILL_TOP }]} pointerEvents="box-none">
      {/* Full-width frosted band from the status bar to the pill's middle: nothing scrolls by sharply above or beside the header, and nothing below it is blurred. */}
      <View pointerEvents="none" style={[styles.band, { height: insets.top + PILL_TOP + PILL_HEIGHT / 2 }]}>
        <BlurView intensity={scrolled ? 30 : 0} tint={blurTint} blurMethod="dimezisBlurViewSdk31Plus" blurTarget={blurTarget} style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassBand, opacity: tint }]} />
      </View>

      <View style={styles.pill}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.pillClip, { borderColor: scrolled ? colors.border : 'transparent' }]}>
          <BlurView intensity={scrolled ? 40 : 0} tint={blurTint} blurMethod="dimezisBlurViewSdk31Plus" blurTarget={blurTarget} style={StyleSheet.absoluteFill} />
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass, opacity: tint }]} />
        </View>
        <BrandMark size={32} />
        {wide && (
          <View style={styles.links}>
            {LINKS.map((l) => (
              <Pressable key={l.id} role="link" aria-label={l.label} onPress={() => scrollTo(l.id)} hitSlop={8} style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}>
                <AppText variant="nav-link">{l.label}</AppText>
              </Pressable>
            ))}
          </View>
        )}
        <View style={styles.actions}>
          <Button label="Log in" size="sm" onPress={onLogin} />
          {mid && <Button label="Get started" variant="accent" size="sm" onPress={onGetStarted} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.md },
  band: { position: 'absolute', top: 0, left: 0, right: 0 },
  pill: {
    height: PILL_HEIGHT,
    width: '100%',
    maxWidth: LANDING_MAX + spacing.xl * 2,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.md,
    paddingRight: spacing.sm + 2,
    gap: spacing.md,
  },
  // The blur ignores borderRadius, so the pill shape comes from clipping.
  pillClip: { borderRadius: radius.full, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  links: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxl },
  link: { minHeight: 44, justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
});

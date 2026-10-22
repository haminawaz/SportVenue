import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { useReducedMotion } from '@/ui/useReducedMotion';

export type SectionId = 'features' | 'how' | 'owners' | 'pricing';

type Revealer = { y: number; show: () => void; shown: boolean };

type LandingScrollApi = {
  /** Scroll the page so a section sits just below the header. */
  scrollTo: (id: SectionId) => void;
  /** Back to the top of the page (the logo). */
  scrollToTop: () => void;
  setSectionY: (id: SectionId, y: number) => void;
  /** Register a section that fades up the first time it enters the viewport. */
  register: (r: Revealer) => () => void;
};

const LandingScrollContext = createContext<LandingScrollApi | null>(null);

export function LandingScrollProvider({ value, children }: { value: LandingScrollApi; children: ReactNode }) {
  return <LandingScrollContext.Provider value={value}>{children}</LandingScrollContext.Provider>;
}

export function useLandingScroll() {
  const v = useContext(LandingScrollContext);
  if (!v) throw new Error('useLandingScroll must be used inside <LandingScrollProvider>');
  return v;
}

/** The page column: hero, sections and footer all line up on it. */
export const LANDING_MAX = 1120;
/** Tablets and up get the two-column layouts. */
export const WIDE_AT = 768;

type SectionProps = {
  id?: SectionId;
  children: ReactNode;
  /** Inner column style. */
  style?: StyleProp<ViewStyle>;
  /** Outer band style (backgrounds and borders that run edge to edge). */
  bandStyle?: StyleProp<ViewStyle>;
  /** Called once, when the section first scrolls into view. */
  onReveal?: () => void;
};

/**
 * One landing-page section: a band with the page column inside, which fades
 * up once the first time it scrolls into view (400ms, ease-out). Static under
 * reduced motion. Must be a direct child of the page's scroll content so its
 * layout y is the scroll position.
 */
export function Section({ id, children, style, bandStyle, onReveal }: SectionProps) {
  const { register, setSectionY } = useLandingScroll();
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const unregister = useRef<(() => void) | null>(null);
  const revealed = useRef(false);
  const revealCb = useRef(onReveal);
  useEffect(() => {
    revealCb.current = onReveal;
  });

  useEffect(() => () => unregister.current?.(), []);
  useEffect(() => {
    if (reduced) progress.setValue(1);
  }, [reduced, progress]);

  const onLayout = (e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.y;
    if (id) setSectionY(id, y);
    unregister.current?.();
    unregister.current = register({
      y,
      shown: false,
      show: () => {
        if (!revealed.current) {
          revealed.current = true;
          revealCb.current?.();
        }
        Animated.timing(progress, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      },
    });
  };

  const anim = { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] };

  return (
    <View onLayout={onLayout} style={[styles.band, bandStyle]}>
      <Animated.View style={[styles.inner, style, anim]}>{children}</Animated.View>
    </View>
  );
}

/** Section headline on the marketing scale (larger from tablet width). */
export function SectionTitle({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const wide = useWindowDimensions().width >= WIDE_AT;
  return (
    <AppText role="heading" aria-level={2} style={[typography['display-xl'], wide && styles.titleWide, { color: colors.text }]}>
      {children}
    </AppText>
  );
}

/** Body copy under a section headline. */
export function Lede({ children }: { children: ReactNode }) {
  return (
    <AppText tone="muted" style={styles.lede}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  band: { paddingHorizontal: spacing.xl, paddingVertical: 64 },
  inner: { width: '100%', maxWidth: LANDING_MAX, alignSelf: 'center', gap: spacing.xxl },
  titleWide: { fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  lede: { maxWidth: 560, fontSize: 17, lineHeight: 26 },
});

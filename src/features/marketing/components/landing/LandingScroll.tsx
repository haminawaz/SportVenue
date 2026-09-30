import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { spacing } from '@/theme/tokens';
import { useReducedMotion } from '@/ui/useReducedMotion';

export type SectionId = 'features' | 'how' | 'owners' | 'pricing';

type Revealer = { y: number; show: () => void; shown: boolean };

type LandingScrollApi = {
  /** Scroll the page so a section sits just below the header. */
  scrollTo: (id: SectionId) => void;
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

type SectionProps = {
  id?: SectionId;
  children: ReactNode;
  /** Inner content style (the max-width column). */
  style?: StyleProp<ViewStyle>;
  /** Outer band style (backgrounds that bleed edge to edge). */
  bandStyle?: StyleProp<ViewStyle>;
  tight?: boolean;
};

/**
 * One landing-page section: a centered column that fades up once, the first
 * time it scrolls into view (400ms, ease-out, no bounce). Static under
 * reduced motion. Must be a direct child of the page's scroll content so its
 * layout y is the scroll position.
 */
export function Section({ id, children, style, bandStyle, tight }: SectionProps) {
  const { register, setSectionY } = useLandingScroll();
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const unregister = useRef<(() => void) | null>(null);

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
      show: () => Animated.timing(progress, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(),
    });
  };

  const anim = { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] };

  return (
    <View onLayout={onLayout} style={[styles.band, tight && styles.tight, bandStyle]}>
      <Animated.View style={[styles.inner, style, anim]}>{children}</Animated.View>
    </View>
  );
}

export const LANDING_MAX = 1160;

const styles = StyleSheet.create({
  band: { paddingHorizontal: spacing.xl, paddingTop: 80 },
  tight: { paddingTop: spacing.huge },
  inner: { width: '100%', maxWidth: LANDING_MAX, alignSelf: 'center', gap: spacing.xxl },
});

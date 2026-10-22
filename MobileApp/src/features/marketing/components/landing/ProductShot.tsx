import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

/**
 * Real screens of the SportVenue app (seeded sample facility), captured at
 * phone size (390x844 points, 2x) in light and dark. The visitor sees the one
 * matching their theme.
 */
const SHOTS = {
  dashboard: { light: require('../../../../../assets/landing/dashboard-light.webp'), dark: require('../../../../../assets/landing/dashboard-dark.webp') },
  schedule: { light: require('../../../../../assets/landing/schedule-light.webp'), dark: require('../../../../../assets/landing/schedule-dark.webp') },
  payments: { light: require('../../../../../assets/landing/payments-light.webp'), dark: require('../../../../../assets/landing/payments-dark.webp') },
  customers: { light: require('../../../../../assets/landing/customers-light.webp'), dark: require('../../../../../assets/landing/customers-dark.webp') },
  pricing: { light: require('../../../../../assets/landing/pricing-light.webp'), dark: require('../../../../../assets/landing/pricing-dark.webp') },
  insights: { light: require('../../../../../assets/landing/insights-light.webp'), dark: require('../../../../../assets/landing/insights-dark.webp') },
} as const;

export type ShotName = keyof typeof SHOTS;

/** Height over width of a captured screen. */
export const SHOT_RATIO = 844 / 390;

type ProductShotProps = {
  name: ShotName;
  /** Rendered width; the height follows the screen's ratio. */
  width: number;
  /** What the screen shows, for screen readers. Empty for a copy that is leaving (hidden from assistive tech). */
  alt: string;
  style?: StyleProp<ViewStyle>;
};

/** One screen, full height, no frame (the caller frames and crops it). */
export function ProductShot({ name, width, alt, style }: ProductShotProps) {
  const { scheme } = useTheme();
  return (
    <View style={style}>
      <Image
        source={SHOTS[name][scheme === 'dark' ? 'dark' : 'light']}
        accessible={!!alt}
        accessibilityLabel={alt || undefined}
        accessibilityRole={alt ? 'image' : undefined}
        resizeMode="cover"
        style={{ width, height: width * SHOT_RATIO }}
      />
    </View>
  );
}

/** The frame around a cropped screen: hairline edge and the card radius. */
export function useShotFrame() {
  const { colors } = useTheme();
  return [styles.frame, { borderColor: colors.borderStrong, backgroundColor: colors.surface }];
}

/**
 * A soft fade from transparent to the page colour, laid over the bottom of a
 * cropped screen so it trails off instead of ending on a hard edge. Built from
 * stacked strips because the app has no gradient dependency.
 */
export function BottomFade({ height, color }: { height: number; color: string }) {
  const steps = 12;
  return (
    <View pointerEvents="none" style={[styles.fade, { height }]}>
      {Array.from({ length: steps }, (_, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: color, opacity: ((i + 1) / steps) ** 1.6 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderRadius: 28, borderWidth: StyleSheet.hairlineWidth * 2 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});

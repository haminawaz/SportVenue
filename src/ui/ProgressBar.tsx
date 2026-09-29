import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/** Horizontal meter. `value` is 0-100 and is clamped. Decorative: pair it with a text value. */
export function ProgressBar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'onHero' }) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View
      style={[styles.track, { backgroundColor: tone === 'onHero' ? 'rgba(255,255,255,0.18)' : colors.track }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: tone === 'onHero' ? colors.heroText : colors.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
});

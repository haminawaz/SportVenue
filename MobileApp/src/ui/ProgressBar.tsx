import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/** Horizontal meter. `value` is 0-100 and is clamped. Decorative: pair it with a text value. */
export function ProgressBar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'onInk' }) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View
      style={[styles.track, { backgroundColor: tone === 'onInk' ? colors.inkLine : colors.track }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: tone === 'onInk' ? colors.inkAccent : colors.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
});

import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

/** Simple geometric mark plus wordmark. Decorative for screen readers when a label sits beside it. */
export function BrandMark({ size = 36, withName = true, onDark }: { size?: number; withName?: boolean; onDark?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessible aria-label="CoyoteOS">
      <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: onDark ? colors.heroText : colors.accent }]}>
        <View style={[styles.inner, { width: size * 0.42, height: size * 0.42, borderColor: onDark ? colors.accentStrong : colors.onAccent, borderWidth: Math.max(2, size * 0.09) }]} />
      </View>
      {withName && (
        <AppText variant="heading" style={{ color: onDark ? colors.heroText : colors.text, fontFamily: 'Geist_700Bold', letterSpacing: -0.4 }}>
          CoyoteOS
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { alignItems: 'center', justifyContent: 'center' },
  inner: { borderRadius: radius.full },
});

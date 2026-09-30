import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from '@/ui/AppText';

/**
 * SportVenue mark: a court seen from above (outline plus net line) on a green
 * tile, built from plain shapes. The wordmark sits beside it.
 */
export function BrandMark({ size = 36, withName = true }: { size?: number; withName?: boolean }) {
  const { colors } = useTheme();
  const line = Math.max(2, Math.round(size * 0.07));
  return (
    <View style={styles.row} accessible aria-label="SportVenue">
      <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: colors.accent }]}>
        <View style={[styles.court, { width: size * 0.5, height: size * 0.64, borderWidth: line, borderColor: colors.onAccent, borderRadius: size * 0.06 }]}>
          <View style={{ width: '100%', height: line, backgroundColor: colors.onAccent }} />
        </View>
      </View>
      {withName && (
        <AppText variant="title-md" style={{ color: colors.text }} maxFontSizeMultiplier={1.2}>
          SportVenue
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { alignItems: 'center', justifyContent: 'center' },
  court: { alignItems: 'center', justifyContent: 'center' },
});

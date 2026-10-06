import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

/** Logo-only face for the wordmark, loaded in app/_layout.tsx. */
const LOGO_FONT = 'BricolageGrotesque-ExtraBold';

/** The app icon artwork (same as the store icon and favicon), on a transparent rounded tile. */
const MARK = require('../../../../assets/brand-mark.png');

type BrandMarkProps = {
  size?: number;
  withName?: boolean;
  /** On the ink surface (or dark mode): the tile gets a faint edge and the wordmark turns cream. */
  onInk?: boolean;
};

/** SportVenue logo: the app icon image beside the wordmark. */
export function BrandMark({ size = 36, withName = true, onInk }: BrandMarkProps) {
  const { colors, scheme } = useTheme();
  const raised = onInk || scheme === 'dark';

  return (
    <View style={styles.row} accessible aria-label="SportVenue">
      {/* In dark mode the tile gets a faint edge so it reads on any dark surface, including ones the same tone as the tile. */}
      <Image source={MARK} accessibilityIgnoresInvertColors style={[{ width: size, height: size, borderRadius: size * 0.24 }, raised && styles.edge]} />
      {withName && (
        <Text style={[styles.name, { color: onInk ? colors.onInk : colors.text, fontSize: Math.round(size * 0.5) }]} maxFontSizeMultiplier={1.2}>
          SPORTVENUE
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  edge: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(243, 241, 238, 0.22)' },
  name: { fontFamily: LOGO_FONT, letterSpacing: 0.4 },
});

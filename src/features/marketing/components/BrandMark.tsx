import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

/** Logo-only face: the wordmark and scoreboard letters, loaded in app/_layout.tsx. */
const LOGO_FONT = 'BricolageGrotesque-ExtraBold';

/** Brand colours, fixed so the logo looks the same in every theme. */
const BRAND = { ink: '#141413', flap: '#2A2927', green: '#0B7A4B', lime: '#4ADE9A', cream: '#F3F1EE' };

type BrandMarkProps = {
  size?: number;
  withName?: boolean;
  /** On the ink surface (or dark mode): the tile lifts to a lighter step and the wordmark turns cream. */
  onInk?: boolean;
};

/**
 * SportVenue scoreboard mark: S and V on split-flap tiles, the V in court
 * green. Built from views (not an image) so it stays crisp at every size.
 * The flap split line is dropped below 36pt, where it would only blur.
 */
export function BrandMark({ size = 36, withName = true, onInk }: BrandMarkProps) {
  const { colors, scheme } = useTheme();
  const raised = onInk || scheme === 'dark';
  const tile = raised ? BRAND.flap : BRAND.ink;
  const leftFlap = raised ? BRAND.ink : BRAND.flap;
  const s = size / 100;

  return (
    <View style={styles.row} accessible aria-label="SportVenue">
      <View style={{ width: size, height: size, borderRadius: 26 * s, backgroundColor: tile }}>
        <Flap left={15 * s} scale={s} color={leftFlap} letter="S" letterColor={BRAND.cream} />
        <Flap left={52 * s} scale={s} color={BRAND.green} letter="V" letterColor={BRAND.lime} />
        {size >= 36 && <View style={{ position: 'absolute', left: 15 * s, width: 70 * s, top: 48.5 * s, height: 3 * s, backgroundColor: tile }} />}
      </View>
      {withName && (
        <Text style={[styles.name, { color: onInk ? colors.onInk : colors.text, fontSize: Math.round(size * 0.5) }]} maxFontSizeMultiplier={1.2}>
          SPORTVENUE
        </Text>
      )}
    </View>
  );
}

function Flap({ left, scale: s, color, letter, letterColor }: { left: number; scale: number; color: string; letter: string; letterColor: string }) {
  return (
    <View style={[styles.flap, { left, top: 22 * s, width: 33 * s, height: 56 * s, borderRadius: 7 * s, backgroundColor: color }]}>
      <Text allowFontScaling={false} style={{ fontFamily: LOGO_FONT, color: letterColor, fontSize: 40 * s, lineHeight: 48 * s, includeFontPadding: false }}>
        {letter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: LOGO_FONT, letterSpacing: 0.4 },
});

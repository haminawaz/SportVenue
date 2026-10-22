import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Button } from '@/ui/Button';

import { Lede, Section, SectionTitle, WIDE_AT } from './LandingScroll';

/**
 * Pricing and the closing call to action in one place: plans are quoted per
 * facility, so the section offers a quote or a demo instead of a price table.
 */
export function Pricing({ onGetQuote, onBookDemo }: { onGetQuote: () => void; onBookDemo: () => void }) {
  const { colors } = useTheme();
  const wide = useWindowDimensions().width >= WIDE_AT;

  return (
    <Section id="pricing">
      <View style={[styles.card, wide && styles.cardWide, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.copy, wide && styles.flex]}>
          <SectionTitle>Pricing that fits your facility.</SectionTitle>
          <Lede>Plans depend on how many courts you run. Tell us about your facility and we will send you a quote, or book a demo first.</Lede>
        </View>
        <View style={styles.ctas}>
          <Button label="Get a quote" variant="accent" onPress={onGetQuote} />
          <Button label="Book a demo" variant="secondary" onPress={onBookDemo} />
        </View>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.hero, borderWidth: StyleSheet.hairlineWidth * 2, padding: spacing.xxl + spacing.xs, gap: spacing.xxl },
  cardWide: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.huge + spacing.sm, gap: spacing.huge },
  copy: { gap: spacing.lg },
  flex: { flex: 1 },
  ctas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});

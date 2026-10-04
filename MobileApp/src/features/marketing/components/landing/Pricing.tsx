import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Receipt } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { useSurface } from '@/ui/surface';

import { Section } from './LandingScroll';

/** Pricing tiers are not published yet, so this section asks for a quote instead. */
export function Pricing({ onGetQuote }: { onGetQuote: () => void }) {
  const { colors } = useTheme();
  const surface = useSurface();
  const row = useWindowDimensions().width >= 768;
  return (
    <Section id="pricing">
      <View style={[surface, styles.card, row && styles.cardRow]}>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <Receipt size={26} color={colors.accent} weight="bold" />
        </View>
        <View style={[styles.text, row && styles.flex]}>
          <AppText role="heading" variant="display-lg">
            Pricing that fits your facility.
          </AppText>
          <AppText tone="muted">Plans depend on how many courts you run. Tell us about your facility and we will send you a quote.</AppText>
        </View>
        <Button label="Get a quote" variant="secondary" size="lg" onPress={onGetQuote} />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.xxl, gap: spacing.xl, alignItems: 'flex-start' },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.xxxl },
  icon: { width: 56, height: 56, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  text: { gap: spacing.sm },
  flex: { flex: 1 },
});

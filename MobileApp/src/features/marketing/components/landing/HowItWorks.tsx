import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

import { Lede, Section, SectionTitle, WIDE_AT } from './LandingScroll';

const STEPS = [
  { title: 'Add your courts', body: 'Enter each court with its sport, opening hours, base rate and any peak or off-peak pricing. You do this once.' },
  { title: 'Take bookings', body: 'Book customers into open slots from the calendar. A slot can only be sold once, so busy evenings stop getting double-booked.' },
  { title: 'Collect and grow', body: 'Record payments as they come in, follow up on what is still owed, and use analytics to fill the hours that sit empty.' },
];

/** Headline, then the three steps under one rule each: stacked on phones, in a row on tablets. */
export function HowItWorks() {
  const { colors } = useTheme();
  const wide = useWindowDimensions().width >= WIDE_AT;

  return (
    <Section id="how" style={styles.section}>
      <View style={styles.head}>
        <SectionTitle>Set up in an afternoon.</SectionTitle>
        <Lede>We set it up with your courts and prices, then walk you through it.</Lede>
      </View>
      <View role="list" style={[styles.steps, wide && styles.stepsWide]}>
        {STEPS.map((s, i) => (
          <View key={s.title} role="listitem" style={[styles.step, wide && styles.stepWide, { borderTopColor: colors.borderStrong }]}>
            <AppText aria-hidden style={[typography['display-xl'], styles.number, { color: colors.accent }]}>
              {i + 1}
            </AppText>
            <AppText variant="title-md" aria-label={`Step ${i + 1}: ${s.title}`}>
              {s.title}
            </AppText>
            <AppText tone="muted">{s.body}</AppText>
          </View>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.huge },
  head: { gap: spacing.lg },
  steps: { gap: 0 },
  stepsWide: { flexDirection: 'row', gap: spacing.huge },
  step: { borderTopWidth: StyleSheet.hairlineWidth * 2, paddingVertical: spacing.xxl, gap: spacing.sm },
  stepWide: { flex: 1, paddingBottom: 0 },
  number: { fontSize: 40, lineHeight: 44, marginBottom: spacing.xs },
});

import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

import { Section } from './LandingScroll';

const STEPS = [
  { title: 'Add your courts', body: 'Set opening hours, base rates and peak pricing once.' },
  { title: 'Manage bookings', body: 'Book customers into open slots and see every court at a glance.' },
  { title: 'Grow revenue', body: 'Collect what you are owed and fill the hours that sit empty.' },
];

/** Three numbered steps: a row from 768pt, a connected vertical list on phones. */
export function HowItWorks() {
  const { colors } = useTheme();
  const row = useWindowDimensions().width >= 768;
  return (
    <Section id="how">
      <AppText role="heading" variant="display-xl">
        Up and running in an afternoon.
      </AppText>
      <View style={[styles.steps, row && styles.stepsRow]}>
        {STEPS.map((s, i) => {
          const last = i === STEPS.length - 1;
          return (
            <View key={s.title} style={[styles.step, row && styles.stepRow]} accessible aria-label={`Step ${i + 1}: ${s.title}. ${s.body}`}>
              <View style={[styles.rail, row && styles.railRow]}>
                <View style={[styles.number, { borderColor: colors.accent }]}>
                  <AppText variant="display-md" style={{ color: colors.accent }}>
                    {i + 1}
                  </AppText>
                </View>
                {!last && <View style={[row ? styles.lineRow : styles.line, { backgroundColor: colors.border }]} />}
              </View>
              <View style={[styles.text, !row && !last && styles.textGap]}>
                <AppText variant="title-md">{s.title}</AppText>
                <AppText tone="muted">{s.body}</AppText>
              </View>
            </View>
          );
        })}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  steps: {},
  stepsRow: { flexDirection: 'row', gap: spacing.xxl },
  step: { flexDirection: 'row', gap: spacing.lg },
  stepRow: { flex: 1, flexDirection: 'column' },
  rail: { alignItems: 'center' },
  railRow: { flexDirection: 'row', alignSelf: 'stretch' },
  number: { width: 52, height: 52, borderRadius: radius.full, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  line: { width: 1.5, flex: 1, marginVertical: spacing.sm },
  lineRow: { height: 1.5, flex: 1, marginHorizontal: spacing.md },
  text: { flex: 1, gap: spacing.xs, paddingTop: spacing.md },
  textGap: { paddingBottom: spacing.xxxl },
});

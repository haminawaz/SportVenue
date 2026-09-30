import { StyleSheet, View } from 'react-native';
import { ArrowRight } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';

import { Section } from './LandingScroll';

/** Closing band: one headline, one action, nothing else. */
export function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  const { colors } = useTheme();
  return (
    <Section bandStyle={styles.band} style={[styles.panel, { backgroundColor: colors.ink }]}>
      <AppText role="heading" variant="display-xl" style={[styles.center, { color: colors.onInk }]}>
        Put your facility on SportVenue.
      </AppText>
      <AppText style={[styles.center, styles.sub, { color: colors.onInkMuted }]}>We set it up with your courts and prices, then walk you through it.</AppText>
      <View style={styles.action}>
        <Button label="Get started" variant="accent" size="lg" trailingIcon={ArrowRight} onPress={onGetStarted} />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  band: { paddingHorizontal: spacing.md },
  panel: { borderRadius: radius.hero, paddingHorizontal: spacing.xxl, paddingVertical: 56, gap: spacing.lg, alignItems: 'center' },
  center: { textAlign: 'center' },
  sub: { maxWidth: 480 },
  action: { marginTop: spacing.sm },
});

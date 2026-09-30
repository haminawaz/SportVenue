import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

import { BrandMark } from '../BrandMark';

import { LANDING_MAX, useLandingScroll, type SectionId } from './LandingScroll';

type Link = { label: string; onPress: () => void };

type FooterProps = { onLogin: () => void; onGetStarted: () => void; onBookDemo: () => void };

/**
 * Raised footer with only links that work today: page sections and account
 * actions. Company and legal columns join once those pages exist.
 */
export function Footer({ onLogin, onGetStarted, onBookDemo }: FooterProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { scrollTo } = useLandingScroll();
  const row = useWindowDimensions().width >= 600;
  const to = (id: SectionId) => () => scrollTo(id);

  const columns: { title: string; links: Link[] }[] = [
    {
      title: 'Product',
      links: [
        { label: 'Features', onPress: to('features') },
        { label: 'How it works', onPress: to('how') },
        { label: 'For facility owners', onPress: to('owners') },
        { label: 'Pricing', onPress: to('pricing') },
      ],
    },
    {
      title: 'Get in touch',
      links: [
        { label: 'Get started', onPress: onGetStarted },
        { label: 'Book a demo', onPress: onBookDemo },
        { label: 'Log in', onPress: onLogin },
      ],
    },
  ];

  return (
    <View style={[styles.band, { backgroundColor: colors.surfaceRaised, borderTopColor: colors.border, paddingBottom: insets.bottom + spacing.xxl }]}>
      <View style={styles.inner}>
        <View style={[styles.top, row && styles.topRow]}>
          <View style={styles.brand}>
            <BrandMark size={32} />
            <AppText tone="muted" style={styles.tagline}>
              Software for sports facility owners.
            </AppText>
          </View>
          <View style={[styles.columns, row && styles.columnsRow]}>
            {columns.map((c) => (
              <View key={c.title} style={styles.column}>
                <AppText variant="caption-uppercase" tone="muted">
                  {c.title}
                </AppText>
                {c.links.map((l) => (
                  <Pressable key={l.label} role="link" aria-label={l.label} onPress={l.onPress} hitSlop={4} style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}>
                    <AppText variant="body-md">{l.label}</AppText>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.bottom, { borderTopColor: colors.border }]}>
          <AppText variant="body-sm" tone="muted">
            © 2026 SportVenue
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { marginTop: 80, paddingHorizontal: spacing.xl, paddingTop: spacing.huge + spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  inner: { width: '100%', maxWidth: LANDING_MAX, alignSelf: 'center', gap: spacing.xxxl },
  top: { gap: spacing.xxxl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  brand: { gap: spacing.md },
  tagline: { maxWidth: 260 },
  columns: { flexDirection: 'row', gap: spacing.huge, flexWrap: 'wrap' },
  columnsRow: { gap: 72 },
  column: { gap: spacing.xs, minWidth: 140 },
  link: { minHeight: 44, justifyContent: 'center' },
  bottom: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.xl },
});

import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRIVACY_CHOICES_LABEL, useOpenPrivacyChoices } from '@/features/legal/PrivacyChoices';
import { routes } from '@/navigation/routes';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

import { BrandMark } from '../BrandMark';

import { LANDING_MAX, useLandingScroll, type SectionId } from './LandingScroll';

type Link = { label: string; onPress: () => void };

type FooterProps = { onLogin: () => void; onGetStarted: () => void; onBookDemo: () => void; onGetQuote: () => void };

/** Footer with only links that work today: page sections, account actions and the legal pages. */
export function Footer({ onLogin, onGetStarted, onBookDemo, onGetQuote }: FooterProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const openChoices = useOpenPrivacyChoices();
  const { scrollTo, scrollToTop } = useLandingScroll();
  const row = useWindowDimensions().width >= 600;
  const to = (id: SectionId) => () => scrollTo(id);

  const columns: { title: string; links: Link[] }[] = [
    {
      title: 'Product',
      links: [
        { label: 'Product tour', onPress: to('features') },
        { label: 'How it works', onPress: to('how') },
        { label: 'For owners', onPress: to('owners') },
        { label: 'Pricing', onPress: to('pricing') },
      ],
    },
    {
      title: 'Get in touch',
      links: [
        { label: 'Get started', onPress: onGetStarted },
        { label: 'Book a demo', onPress: onBookDemo },
        { label: 'Get a quote', onPress: onGetQuote },
        { label: 'Log in', onPress: onLogin },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', onPress: () => router.push(routes.privacy) },
        { label: 'Terms and Conditions', onPress: () => router.push(routes.terms) },
        { label: 'Cookie Policy', onPress: () => router.push(routes.cookies) },
        { label: PRIVACY_CHOICES_LABEL, onPress: openChoices },
      ],
    },
  ];

  return (
    // Extra bottom room keeps the floating privacy badge clear of the last line.
    <View style={[styles.band, { borderTopColor: colors.border, paddingBottom: insets.bottom + 72 }]}>
      <View style={styles.inner}>
        <View style={[styles.top, row && styles.topRow]}>
          <View style={styles.brand}>
            <Pressable role="link" aria-label="SportVenue, back to top" onPress={scrollToTop} hitSlop={8} style={({ pressed }) => [styles.logo, pressed && styles.pressed]}>
              <BrandMark size={30} />
            </Pressable>
            <AppText variant="body-sm" tone="muted" style={styles.tagline}>
              Bookings, payments and customers for sports facility owners.
            </AppText>
          </View>
          <View style={[styles.columns, row && styles.columnsRow]}>
            {columns.map((c) => (
              <View key={c.title} style={styles.column}>
                <AppText variant="nav-link" tone="subtle" role="heading" style={styles.columnTitle}>
                  {c.title}
                </AppText>
                {c.links.map((l) => (
                  <Pressable key={l.label} role="link" onPress={l.onPress} hitSlop={4} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                    <AppText variant="body-sm" tone="muted">
                      {l.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.bottom, { borderTopColor: colors.border }]}>
          <AppText variant="caption" tone="subtle">
            © {new Date().getFullYear()} SportVenue
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { paddingHorizontal: spacing.xl, paddingTop: spacing.huge + spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  inner: { width: '100%', maxWidth: LANDING_MAX, alignSelf: 'center', gap: spacing.xxxl },
  top: { gap: spacing.xxxl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  brand: { gap: spacing.md },
  logo: { alignSelf: 'flex-start' },
  tagline: { maxWidth: 280 },
  columns: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.huge, rowGap: spacing.xxl },
  columnsRow: { columnGap: 56 },
  column: { minWidth: 130, gap: 2 },
  columnTitle: { marginBottom: spacing.xs },
  link: { minHeight: 40, justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  bottom: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.xl },
});

import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { List } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';

import { BrandMark } from '../BrandMark';

import { LANDING_MAX, useLandingScroll, type SectionId } from './LandingScroll';

/** Height of the header below the safe area. */
export const NAV_HEIGHT = 64;

const LINKS: { id: SectionId; label: string }[] = [
  { id: 'features', label: 'Product' },
  { id: 'how', label: 'How it works' },
  { id: 'owners', label: 'For owners' },
  { id: 'pricing', label: 'Pricing' },
];

type NavProps = { onLogin: () => void; onGetStarted: () => void };

/**
 * Fixed header on a solid page-colour bar with a hairline under it, so content
 * never scrolls behind the status bar or the actions. The logo scrolls back to
 * the top. Section links show inline from 1024pt; below that they move into a
 * menu sheet with the two account actions.
 */
export function Nav({ onLogin, onGetStarted }: NavProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { scrollTo, scrollToTop } = useLandingScroll();
  const [menu, setMenu] = useState(false);
  const wide = width >= 1024;

  // Close the sheet first, then act once it has gone.
  const after = (fn: () => void) => () => {
    setMenu(false);
    setTimeout(fn, 250);
  };

  return (
    <View style={[styles.host, { paddingTop: insets.top, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.bar}>
        <Pressable role="link" aria-label="SportVenue, back to top" onPress={scrollToTop} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
          <BrandMark size={30} />
        </Pressable>
        {wide && (
          <View style={styles.links}>
            {LINKS.map((l) => (
              <Pressable key={l.id} role="link" onPress={() => scrollTo(l.id)} hitSlop={8} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                <AppText variant="nav-link" tone="muted">
                  {l.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}
        <View style={styles.actions}>
          <Button label="Log in" variant="ghost" size="sm" onPress={onLogin} />
          {width >= 480 && <Button label="Get started" variant="accent" size="sm" onPress={onGetStarted} />}
          {!wide && (
            <Pressable
              role="button"
              aria-label="Menu"
              aria-expanded={menu}
              aria-haspopup="dialog"
              onPress={() => setMenu(true)}
              hitSlop={6}
              style={({ pressed }) => [styles.menuButton, pressed && { backgroundColor: colors.surfaceMuted }]}
            >
              <List size={22} color={colors.text} weight="bold" />
            </Pressable>
          )}
        </View>
      </View>

      <BottomSheet visible={menu} title="Menu" onClose={() => setMenu(false)}>
        <View role="list" aria-label="Sections">
          {LINKS.map((l) => (
            <Pressable
              key={l.id}
              role="link"
              onPress={after(() => scrollTo(l.id))}
              style={({ pressed }) => [styles.sheetLink, pressed && { backgroundColor: colors.surfaceMuted }]}
            >
              <AppText variant="body-strong">{l.label}</AppText>
            </Pressable>
          ))}
        </View>
        <View style={styles.sheetActions}>
          <Button label="Get started" variant="accent" size="lg" block onPress={after(onGetStarted)} />
          <Button label="Log in" variant="secondary" size="lg" block onPress={after(onLogin)} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.xl, borderBottomWidth: StyleSheet.hairlineWidth },
  bar: { height: NAV_HEIGHT, width: '100%', maxWidth: LANDING_MAX, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  links: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxl },
  link: { minHeight: 44, justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  menuButton: { width: 44, height: 44, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.sm },
  sheetLink: { minHeight: 52, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.control },
  sheetActions: { gap: spacing.sm, marginTop: spacing.lg },
});

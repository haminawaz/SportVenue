import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { List, X } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { IconButton } from '@/ui/IconButton';
import { useReducedMotion } from '@/ui/useReducedMotion';

import { BrandMark } from '../BrandMark';

import { LANDING_MAX, useLandingScroll, type SectionId } from './LandingScroll';

export const NAV_HEIGHT = 64;

const LINKS: { id: SectionId; label: string }[] = [
  { id: 'features', label: 'Features' },
  { id: 'how', label: 'How it works' },
  { id: 'owners', label: 'For facility owners' },
  { id: 'pricing', label: 'Pricing' },
];

type NavProps = { scrollY: Animated.Value; onLogin: () => void; onGetStarted: () => void };

/**
 * Sticky header. Transparent over the hero, then a solid raised surface with a
 * hairline once the page scrolls (driven by the native scroll value, so no
 * re-renders per frame). Phones get Log in plus a menu drawer; wide screens
 * show the section links inline.
 */
export function Nav({ scrollY, onLogin, onGetStarted }: NavProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { scrollTo } = useLandingScroll();
  const [menuOpen, setMenuOpen] = useState(false);
  const wide = width >= 1024;
  const mid = width >= 640;

  const solid = scrollY.interpolate({ inputRange: [0, 48], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={[styles.host, { paddingTop: insets.top }]}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceRaised, borderBottomColor: colors.border, opacity: solid }, styles.backdrop]}
      />
      <View style={styles.bar}>
        <BrandMark size={32} />
        {wide && (
          <View style={styles.links}>
            {LINKS.map((l) => (
              <Pressable key={l.id} role="link" aria-label={l.label} onPress={() => scrollTo(l.id)} hitSlop={8} style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}>
                <AppText variant="nav-link">{l.label}</AppText>
              </Pressable>
            ))}
          </View>
        )}
        <View style={styles.actions}>
          <Button label="Log in" variant="secondary" size="sm" onPress={onLogin} />
          {mid && <Button label="Get started" variant="accent" size="sm" onPress={onGetStarted} />}
          {!wide && <IconButton icon={List} label="Open menu" onPress={() => setMenuOpen(true)} />}
        </View>
      </View>
      <MenuDrawer
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLink={(id) => {
          setMenuOpen(false);
          // Let the drawer close before the page moves.
          setTimeout(() => scrollTo(id), 220);
        }}
        onLogin={() => {
          setMenuOpen(false);
          onLogin();
        }}
        onGetStarted={() => {
          setMenuOpen(false);
          onGetStarted();
        }}
      />
    </View>
  );
}

type DrawerProps = { visible: boolean; onClose: () => void; onLink: (id: SectionId) => void; onLogin: () => void; onGetStarted: () => void };

/** Slides in from the right over a backdrop. Closes on a link tap, the close button, the backdrop or the back gesture. */
function MenuDrawer({ visible, onClose, onLink, onLogin, onGetStarted }: DrawerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const panel = Math.min(width * 0.86, 380);
  const [progress] = useState(() => new Animated.Value(0));
  const [mounted, setMounted] = useState(visible);

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return;
    const a = Animated.timing(progress, { toValue: visible ? 1 : 0, duration: reduced ? 0 : 240, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    a.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => a.stop();
  }, [visible, mounted, progress, reduced]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop, opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} aria-label="Close menu" role="button" />
      </Animated.View>
      <Animated.View
        role="dialog"
        aria-modal
        aria-label="Menu"
        style={[
          styles.drawer,
          {
            width: panel,
            backgroundColor: colors.surfaceRaised,
            paddingTop: insets.top + spacing.md,
            paddingBottom: Math.max(insets.bottom, spacing.xl),
            transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [panel, 0] }) }],
          },
        ]}
      >
        <View style={styles.drawerHead}>
          <BrandMark size={30} />
          <IconButton icon={X} label="Close menu" onPress={onClose} variant="filled" />
        </View>
        <View style={styles.drawerLinks}>
          {LINKS.map((l) => (
            <Pressable
              key={l.id}
              role="link"
              aria-label={l.label}
              onPress={() => onLink(l.id)}
              style={({ pressed }) => [styles.drawerLink, { borderBottomColor: colors.border }, pressed && { backgroundColor: colors.surfaceMuted }]}
            >
              <AppText variant="display-sm">{l.label}</AppText>
            </Pressable>
          ))}
        </View>
        <View style={styles.drawerActions}>
          <Button label="Get started" variant="accent" size="lg" block onPress={onGetStarted} />
          <Button label="Log in" variant="secondary" size="lg" block onPress={onLogin} />
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', top: 0, left: 0, right: 0 },
  backdrop: { borderBottomWidth: StyleSheet.hairlineWidth },
  bar: {
    height: NAV_HEIGHT,
    width: '100%',
    maxWidth: LANDING_MAX + spacing.xl * 2,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.xl,
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  links: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxl },
  link: { minHeight: 44, justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  drawer: { position: 'absolute', top: 0, right: 0, bottom: 0, borderTopLeftRadius: radius.hero, borderBottomLeftRadius: radius.hero, paddingHorizontal: spacing.xl, gap: spacing.xxl },
  drawerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  drawerLinks: { flex: 1 },
  drawerLink: { minHeight: 64, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.xs, borderRadius: radius.badge },
  drawerActions: { gap: spacing.sm },
});

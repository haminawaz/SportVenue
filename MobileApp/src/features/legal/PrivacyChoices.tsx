import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cookie } from 'phosphor-react-native';

import { consentStore, type ConsentChoices } from '@/lib/consent';
import { routes } from '@/navigation/routes';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { SwitchRow } from '@/ui/Fields';

/** "Cookie settings" in a browser, "Privacy choices" in the native app (which has no cookies). */
export const PRIVACY_CHOICES_LABEL = Platform.OS === 'web' ? 'Cookie settings' : 'Privacy choices';

/**
 * Signed-out screens that show the floating badge. In the signed-in app the
 * badge would sit on the tab bar and the save bars, so the same choices live
 * under Settings instead.
 */
const BADGE_PATHS = ['/welcome', '/sign-in', '/request-demo', '/forgot-password', '/reset-password', '/privacy', '/terms', '/cookies'];

const OpenChoicesContext = createContext<(() => void) | null>(null);

/** Opens the privacy choices sheet (footer links, Settings, the Cookie Policy). */
export function useOpenPrivacyChoices() {
  const open = useContext(OpenChoicesContext);
  if (!open) throw new Error('useOpenPrivacyChoices must be used inside <PrivacyChoicesProvider>');
  return open;
}

/**
 * Consent for optional storage, the mobile twin of the web cookie banner: a
 * banner on first launch (reject and accept side by side, equally weighted), a
 * sheet to choose, and a floating badge on signed-out screens to change or
 * withdraw the choice later. Nothing optional runs today; any tool added later
 * must check hasConsent() from lib/consent.
 */
export function PrivacyChoicesProvider({ children }: { children: ReactNode }) {
  const record = useSyncExternalStore(consentStore.subscribe, consentStore.get);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const openChoices = useCallback(() => setOpen(true), []);

  useEffect(() => {
    void consentStore.load();
  }, []);

  const decide = (choices: ConsentChoices) => {
    void consentStore.set(choices);
    setOpen(false);
  };

  return (
    <OpenChoicesContext.Provider value={openChoices}>
      <View style={styles.root}>
        {children}
        {record === null && !open && <ConsentBanner onReject={() => decide({ analytics: false })} onAccept={() => decide({ analytics: true })} onChoose={openChoices} />}
        {record && BADGE_PATHS.includes(pathname) && <ChoicesBadge onPress={openChoices} />}
      </View>
      {open && <ChoicesSheet initial={record ? record.choices : { analytics: false }} onSave={decide} onClose={() => setOpen(false)} />}
    </OpenChoicesContext.Provider>
  );
}

function ConsentBanner({ onReject, onAccept, onChoose }: { onReject: () => void; onAccept: () => void; onChoose: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View
      role="region"
      aria-label="Privacy choices"
      style={[
        styles.banner,
        { backgroundColor: colors.surface, borderColor: colors.borderStrong, shadowColor: colors.shadow, bottom: insets.bottom + spacing.md, left: insets.left + spacing.md, right: insets.right + spacing.md },
      ]}
    >
      <View style={styles.bannerRow}>
        <Cookie size={22} color={colors.accent} weight="duotone" />
        <View style={styles.bannerText}>
          <AppText variant="body-strong" role="heading">
            {Platform.OS === 'web' ? 'Cookies and storage' : 'Your privacy choices'}
          </AppText>
          <AppText variant="body-sm" tone="muted">
            SportVenue only stores what it needs to work, like keeping you signed in. We don’t use advertising cookies, and analytics stays off unless you allow it.{' '}
            <AppText variant="body-sm" tone="accent" role="link" onPress={() => router.push(routes.cookies)} style={styles.link}>
              Cookie Policy
            </AppText>
          </AppText>
        </View>
      </View>
      <View style={styles.bannerButtons}>
        <View style={styles.flex}>
          <Button label="Reject optional" variant="secondary" size="sm" block onPress={onReject} />
        </View>
        <View style={styles.flex}>
          <Button label="Accept all" variant="secondary" size="sm" block onPress={onAccept} />
        </View>
      </View>
      <Button label="Choose what to allow" variant="tertiary" size="sm" onPress={onChoose} />
    </View>
  );
}

function ChoicesBadge({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      role="button"
      aria-label={PRIVACY_CHOICES_LABEL}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.badge,
        { backgroundColor: colors.surface, borderColor: colors.borderStrong, shadowColor: colors.shadow, bottom: insets.bottom + spacing.lg, left: insets.left + spacing.lg },
        pressed && styles.pressed,
      ]}
    >
      <Cookie size={20} color={colors.textMuted} weight="duotone" />
    </Pressable>
  );
}

function ChoicesSheet({ initial, onSave, onClose }: { initial: ConsentChoices; onSave: (c: ConsentChoices) => void; onClose: () => void }) {
  const { colors } = useTheme();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(initial.analytics);
  return (
    <BottomSheet visible title={PRIVACY_CHOICES_LABEL} onClose={onClose}>
      <View style={styles.sheet}>
        <AppText variant="body-sm" tone="muted">
          Choose what SportVenue may store on this device. You can change this at any time.
        </AppText>
        <View style={[styles.necessary, { borderBottomColor: colors.border }]}>
          <View style={styles.flex}>
            <AppText variant="body-strong">Strictly necessary</AppText>
            <AppText variant="body-sm" tone="muted">
              Keeps you signed in and remembers choices you make, like your theme and these settings.
            </AppText>
          </View>
          <AppText variant="body-sm" tone="muted">
            Always on
          </AppText>
        </View>
        {/* SwitchRow carries list-card padding; cancel it so it lines up with the row above. */}
        <View style={styles.bleed}>
          <SwitchRow
            label="Analytics"
            description="Helps us understand how SportVenue is used. We don’t use any analytics tools today. If we add one, it only runs while this is on."
            value={analytics}
            onChange={setAnalytics}
          />
        </View>
        <AppText variant="body-sm" tone="muted">
          Everything we store is listed in our{' '}
          <AppText
            variant="body-sm"
            tone="accent"
            role="link"
            onPress={() => {
              onClose();
              router.push(routes.cookies);
            }}
            style={styles.link}
          >
            Cookie Policy
          </AppText>
          .
        </AppText>
        <View style={styles.sheetButtons}>
          <Button label="Save choices" block onPress={() => onSave({ analytics })} />
          <View style={styles.bannerButtons}>
            <View style={styles.flex}>
              <Button label="Reject optional" variant="secondary" block onPress={() => onSave({ analytics: false })} />
            </View>
            <View style={styles.flex}>
              <Button label="Accept all" variant="secondary" block onPress={() => onSave({ analytics: true })} />
            </View>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  banner: {
    position: 'absolute',
    maxWidth: 440,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  bannerRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  bannerText: { flex: 1, gap: spacing.xs },
  bannerButtons: { flexDirection: 'row', gap: spacing.sm },
  link: { textDecorationLine: 'underline' },
  badge: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pressed: { opacity: 0.7 },
  sheet: { gap: spacing.md },
  bleed: { marginHorizontal: -spacing.xl },
  necessary: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start', paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetButtons: { gap: spacing.sm, paddingTop: spacing.sm },
});

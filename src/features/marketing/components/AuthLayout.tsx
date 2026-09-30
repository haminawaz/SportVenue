import { useEffect, useState, type ReactNode } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { useReducedMotion } from '@/ui/useReducedMotion';

import { BrandMark } from './BrandMark';

type AuthLayoutProps = {
  /** Small label above the title (with the landing page's accent dot). */
  eyebrow?: string;
  title?: string;
  lead?: string;
  /** Up to three short points shown in the panel, for example what happens after signing up. */
  points?: string[];
  children: ReactNode;
};

/**
 * Shared frame for the signed-out screens (Log in, Get started), in the landing
 * page's language: a soft grey panel (the same tone as the page's secondary
 * cards) with the brand, title and optional points, then the form card
 * overlapping its bottom edge.
 */
export function AuthLayout({ eyebrow, title, lead, points, children }: AuthLayoutProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [intro] = useState(() => new Animated.Value(0));
  const back = () => (router.canGoBack() ? router.back() : router.replace('/welcome'));

  // The form card rises in once; static under reduced motion.
  useEffect(() => {
    if (reduced) {
      intro.setValue(1);
      return;
    }
    const a = Animated.spring(intro, { toValue: 1, stiffness: 120, damping: 20, mass: 1, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [intro, reduced]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]} keyboardShouldPersistTaps="handled">
        <View style={[styles.panel, { backgroundColor: colors.surfaceMuted, paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.inner}>
            <View style={styles.top}>
              <Pressable role="button" aria-label="Back to home" onPress={back} hitSlop={8} style={({ pressed }) => [styles.back, { backgroundColor: colors.surface }, pressed && { opacity: 0.7 }]}>
                <ArrowLeft size={20} color={colors.text} weight="bold" />
              </Pressable>
              <BrandMark size={30} />
              <View style={styles.spacer} />
            </View>

            {title && (
              <View style={styles.titles}>
                {eyebrow && (
                  <View style={styles.eyebrow}>
                    <View style={[styles.dot, { backgroundColor: colors.accentDecor }]} />
                    <AppText variant="caption-uppercase" tone="muted">
                      {eyebrow}
                    </AppText>
                  </View>
                )}
                <AppText variant="display-xl" role="heading">
                  {title}
                </AppText>
                {lead && (
                  <AppText tone="muted" style={styles.lead}>
                    {lead}
                  </AppText>
                )}
                {points && points.length > 0 && (
                  <View style={styles.points} role="list">
                    {points.slice(0, 3).map((p) => (
                      <View key={p} style={styles.point} role="listitem">
                        <CheckCircle size={20} color={colors.accent} weight="fill" />
                        <AppText variant="body-sm" style={styles.flex}>
                          {p}
                        </AppText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <Animated.View
          style={[
            styles.inner,
            styles.body,
            { opacity: intro, transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] },
          ]}
        >
          {children}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  panel: { borderBottomLeftRadius: radius.hero, borderBottomRightRadius: radius.hero, paddingHorizontal: spacing.xl, paddingBottom: 64 },
  inner: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
  back: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  spacer: { width: 44 },
  titles: { gap: spacing.md, marginTop: spacing.xxl },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  lead: { maxWidth: 440 },
  points: { gap: spacing.sm + 2, marginTop: spacing.sm },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1 },
  // The form card overlaps the panel's rounded bottom edge.
  body: { marginTop: -40, paddingHorizontal: spacing.lg, gap: spacing.xl },
});

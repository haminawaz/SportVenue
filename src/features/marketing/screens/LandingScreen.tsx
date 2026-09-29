import { useEffect, useState, type ComponentType } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarCheck, CaretDown, ChartLineUp, CourtBasketball, Lightbulb, Receipt, SignIn, type IconProps } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardMetricGrid } from '@/features/dashboard/components/DashboardMetricGrid';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { useSurface } from '@/ui/surface';
import { useReducedMotion } from '@/ui/useReducedMotion';

import { BrandMark } from '../components/BrandMark';

const MAX = 1120;

/** Sample figures for the product preview only. */
const PREVIEW = {
  revenue: { amount: 138250, changePercent: 12.4 },
  bookings: { count: 16, change: 5 },
  utilization: { percentage: 64, bookedSlots: 31, totalSlots: 48, changePercent: null },
  outstanding: { amount: 21500, bookingCount: 4 },
};

const FEATURES: { key: string; title: string; body: string; icon: ComponentType<IconProps>; tone: 'hero' | 'accent' | 'warning' | 'surface' }[] = [
  { key: 'schedule', title: 'Every court, every hour', body: 'See who is playing where, spot free slots and book them in a few taps.', icon: CourtBasketball, tone: 'hero' },
  { key: 'payments', title: 'Know who owes you', body: 'Record cash, card or transfer payments and send reminders for unpaid balances.', icon: Receipt, tone: 'warning' },
  { key: 'opportunities', title: 'Fill the quiet hours', body: 'CoyoteOS flags empty afternoons and lapsed regulars, with a suggested next step.', icon: Lightbulb, tone: 'accent' },
  { key: 'analytics', title: 'Numbers you can act on', body: 'Revenue, utilization and peak hours by court, for any period you choose.', icon: ChartLineUp, tone: 'surface' },
];

const STEPS: { title: string; body: string; icon: ComponentType<IconProps> }[] = [
  { title: 'Add your courts', body: 'Set opening hours, base rates and peak pricing once.', icon: CourtBasketball },
  { title: 'Take bookings', body: 'Book customers into open slots from your phone, even at the front desk.', icon: CalendarCheck },
  { title: 'Get paid, then grow', body: 'Track every balance and act on the opportunities CoyoteOS finds.', icon: ChartLineUp },
];

const FAQ = [
  { q: 'Which sports does it work for?', a: 'Any court or pitch you rent by the hour: padel, tennis, futsal, squash, badminton, cricket nets and more.' },
  { q: 'Can I use my own currency and timezone?', a: 'Yes. Prices, payments and booking times all follow your facility settings, not the phone you are holding.' },
  { q: 'What happens if my connection drops?', a: 'You still see the data you last loaded. Changes like new bookings need a connection so two people never take the same slot.' },
  { q: 'Who can see my facility data?', a: 'Only your owner account. Each facility is kept separate.' },
];

export function LandingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const reduced = useReducedMotion();
  const [intro] = useState(() => new Animated.Value(reduced ? 1 : 0));

  useEffect(() => {
    if (reduced) {
      intro.setValue(1);
      return;
    }
    const a = Animated.timing(intro, { toValue: 1, duration: 520, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [intro, reduced]);

  const rise = { opacity: intro, transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] };
  const demo = () => router.push('/request-demo');
  const login = () => router.push('/sign-in');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}>
      {/* Navigation */}
      <View style={[styles.nav, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.navInner}>
          <BrandMark />
          <Button label="Log in" icon={SignIn} variant="ghost" size="sm" onPress={login} />
        </View>
      </View>

      {/* Hero */}
      <View style={[styles.section, styles.heroSection]}>
        <View style={[styles.heroGrid, wide && styles.heroGridWide]}>
          <Animated.View style={[styles.heroCopy, wide && styles.heroCopyWide, rise]}>
            <AppText role="heading" style={[styles.h1, { color: colors.text }, wide && styles.h1Wide]}>
              Run your sports facility from your phone.
            </AppText>
            <AppText style={[styles.lead, { color: colors.textMuted }]}>
              Bookings, payments and court schedules in one app, with clear next steps to fill empty slots.
            </AppText>
            <View style={styles.ctaRow}>
              <Button label="Request a demo" size="lg" onPress={demo} />
            </View>
          </Animated.View>

          <Animated.View style={[styles.previewWrap, wide && styles.previewWrapWide, rise]} accessible aria-label="Preview of the CoyoteOS home screen with sample figures">
            <View style={[styles.phone, { backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.shadow }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <View style={styles.phoneHead}>
                <AppText variant="label" tone="muted">
                  Good evening, Hamid
                </AppText>
                <AppText variant="title">Baseline Padel Club</AppText>
              </View>
              <DashboardMetricGrid summary={PREVIEW} currency="PKR" preset="today" />
            </View>
          </Animated.View>
        </View>
      </View>

      {/* What it does */}
      <View style={styles.section}>
        <View style={styles.inner}>
          <AppText role="heading" style={[styles.h2, { color: colors.text }]}>
            Everything the front desk needs, none of the spreadsheets.
          </AppText>
          <View style={[styles.bento, wide && styles.bentoWide]}>
            {FEATURES.map((f, i) => (
              <FeatureCell key={f.key} feature={f} wide={wide} span={wide && (i === 0 || i === 3)} />
            ))}
          </View>
        </View>
      </View>

      {/* How it works */}
      <View style={styles.section}>
        <View style={styles.inner}>
          <AppText role="heading" style={[styles.h2, { color: colors.text }]}>
            Up and running in an afternoon.
          </AppText>
          <View style={[styles.steps, wide && styles.stepsWide]}>
            {STEPS.map((s) => (
              <StepRow key={s.title} step={s} />
            ))}
          </View>
        </View>
      </View>

      {/* FAQ */}
      <View style={styles.section}>
        <View style={styles.inner}>
          <AppText role="heading" style={[styles.h2, { color: colors.text }]}>
            Questions owners ask
          </AppText>
          <FaqList />
        </View>
      </View>

      {/* Closing CTA */}
      <View style={styles.section}>
        <View style={[styles.inner, styles.closing, { backgroundColor: colors.accentStrong }]}>
          <AppText role="heading" style={[styles.h2, { color: colors.heroText, textAlign: 'center' }]}>
            See CoyoteOS running your own courts.
          </AppText>
          <AppText style={[styles.lead, { color: colors.heroMuted, textAlign: 'center' }]}>We set it up with your courts and prices, then walk you through it.</AppText>
          <Button label="Request a demo" size="lg" variant="inverse" onPress={demo} />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.section}>
        <View style={[styles.inner, styles.footer, { borderTopColor: colors.border }]}>
          <BrandMark size={28} />
          <View style={styles.footerRow}>
            <AppText variant="caption" tone="muted" style={styles.flex}>
              © 2026 CoyoteOS. Sports facility management.
            </AppText>
            <Pressable role="link" aria-label="Log in" onPress={login} hitSlop={12}>
              <AppText variant="bodyStrong" tone="accent">
                Log in
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function FeatureCell({ feature: f, wide, span }: { feature: (typeof FEATURES)[number]; wide: boolean; span: boolean }) {
  const { colors } = useTheme();
  const surface = useSurface();
  const bg = f.tone === 'hero' ? colors.accentStrong : f.tone === 'accent' ? colors.accentSoft : f.tone === 'warning' ? colors.warningSoft : undefined;
  const fg = f.tone === 'hero' ? colors.heroText : colors.text;
  const muted = f.tone === 'hero' ? colors.heroMuted : colors.textMuted;
  const iconBg = f.tone === 'hero' ? 'rgba(255,255,255,0.14)' : f.tone === 'surface' ? colors.accentSoft : colors.surface;
  const iconFg = f.tone === 'hero' ? colors.heroText : f.tone === 'warning' ? colors.warning : colors.accent;
  const Icon = f.icon;
  return (
    <View style={[f.tone === 'surface' ? surface : { backgroundColor: bg, borderRadius: radius.card }, styles.cell, wide && (span ? styles.cellWide : styles.cellNarrow)]}>
      <View style={[styles.cellIcon, { backgroundColor: iconBg }]}>
        <Icon size={30} color={iconFg} weight="bold" />
      </View>
      <AppText variant="title" style={{ color: fg, fontSize: 24, lineHeight: 30 }}>
        {f.title}
      </AppText>
      <AppText style={{ color: muted }}>{f.body}</AppText>
    </View>
  );
}

function StepRow({ step: s }: { step: (typeof STEPS)[number] }) {
  const { colors } = useTheme();
  const Icon = s.icon;
  return (
    <View style={styles.step}>
      <View style={[styles.stepIcon, { backgroundColor: colors.accent }]}>
        <Icon size={26} color={colors.onAccent} weight="bold" />
      </View>
      <View style={styles.flex}>
        <AppText variant="heading">{s.title}</AppText>
        <AppText tone="muted">{s.body}</AppText>
      </View>
    </View>
  );
}

function FaqList() {
  const { colors } = useTheme();
  const surface = useSurface();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <View style={[surface, styles.faq]}>
      {FAQ.map((item, i) => {
        const on = open === i;
        return (
          <View key={item.q} style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
            <Pressable role="button" aria-expanded={on} aria-label={item.q} onPress={() => setOpen(on ? null : i)} style={styles.faqQ}>
              <AppText variant="bodyStrong" style={styles.flex}>
                {item.q}
              </AppText>
              <View style={{ transform: [{ rotate: on ? '180deg' : '0deg' }] }}>
                <CaretDown size={20} color={colors.textMuted} weight="bold" />
              </View>
            </Pressable>
            {on && (
              <AppText tone="muted" style={styles.faqA}>
                {item.a}
              </AppText>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  navInner: { width: '100%', maxWidth: MAX, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
  section: { paddingHorizontal: spacing.xl, marginTop: spacing.huge + spacing.lg },
  heroSection: { marginTop: spacing.xl },
  inner: { width: '100%', maxWidth: MAX, alignSelf: 'center', gap: spacing.xxl },
  heroGrid: { width: '100%', maxWidth: MAX, alignSelf: 'center', gap: spacing.huge },
  heroGridWide: { flexDirection: 'row', alignItems: 'center' },
  heroCopy: { gap: spacing.xl },
  heroCopyWide: { flex: 1.1, paddingRight: spacing.xl },
  h1: { ...typography.display, fontSize: 42, lineHeight: 48, letterSpacing: -1.4 },
  h1Wide: { fontSize: 60, lineHeight: 66, letterSpacing: -2 },
  h2: { ...typography.title, fontSize: 30, lineHeight: 36, letterSpacing: -0.8 },
  lead: { ...typography.body, fontSize: 19, lineHeight: 28, maxWidth: 560 },
  ctaRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap', marginTop: spacing.xs },
  previewWrap: { alignItems: 'center' },
  previewWrapWide: { flex: 1 },
  phone: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 36,
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: spacing.lg,
    shadowOpacity: 0.16,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
  phoneHead: { gap: spacing.xxs, paddingHorizontal: spacing.xs, paddingTop: spacing.sm },
  bento: { gap: spacing.md },
  bentoWide: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { padding: spacing.xxl, gap: spacing.md, minHeight: 220 },
  cellWide: { flexBasis: '58%', flexGrow: 1 },
  cellNarrow: { flexBasis: '38%', flexGrow: 1 },
  cellIcon: { width: 56, height: 56, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  steps: { gap: spacing.xxl },
  stepsWide: { flexDirection: 'row' },
  step: { flexDirection: 'row', gap: spacing.lg, flex: 1 },
  stepIcon: { width: 52, height: 52, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  faq: { overflow: 'hidden' },
  faqQ: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, minHeight: 68, paddingVertical: spacing.md },
  faqA: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  closing: { borderRadius: radius.card, padding: spacing.xxxl, alignItems: 'center' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.xxl, gap: spacing.lg },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' },
  flex: { flex: 1 },
});


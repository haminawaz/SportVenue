import { useEffect, useState } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { CaretLeft, CaretRight } from 'phosphor-react-native';

import type { AvailabilitySlot } from '@/domain/types';
import { DayTimeline } from '@/features/bookings/components/DayTimeline';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { useReducedMotion } from '@/ui/useReducedMotion';

import { LANDING_MAX } from './LandingScroll';

const SPORTS = ['Padel', 'Tennis', 'Futsal', 'Squash', 'Badminton', 'Pickleball', 'Cricket nets'];

/** Sample day for the preview only (announced as a sample to screen readers). */
const DAY = '2026-10-02';
const slot = (h: number, status: AvailabilitySlot['status'], customerName?: string, bookingId?: string): AvailabilitySlot => ({
  startAt: `${DAY}T${String(h).padStart(2, '0')}:00:00`,
  endAt: `${DAY}T${String(h + 1).padStart(2, '0')}:00:00`,
  status,
  customerName,
  bookingId,
});
const SAMPLE_SLOTS: AvailabilitySlot[] = [
  slot(16, 'BOOKED', 'Zara Qureshi', 'b1'),
  slot(17, 'FREE'),
  slot(18, 'BOOKED', 'Bilal Siddiqui', 'b2'),
  slot(19, 'BOOKED', 'Bilal Siddiqui', 'b2'),
  slot(20, 'FREE'),
  slot(21, 'BOOKED', 'Ahmed Khan', 'b3'),
];

type HeroProps = { topInset: number; onGetStarted: () => void; onHowItWorks: () => void };

export function Hero({ topInset, onGetStarted, onHowItWorks }: HeroProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const reduced = useReducedMotion();
  const [intro] = useState(() => [0, 1, 2, 3].map(() => new Animated.Value(0)));

  // Staggered entrance: headline, subtext, actions, then the phone.
  useEffect(() => {
    if (reduced) {
      intro.forEach((v) => v.setValue(1));
      return;
    }
    const a = Animated.stagger(
      80,
      intro.map((v) => Animated.spring(v, { toValue: 1, stiffness: 110, damping: 20, mass: 1, useNativeDriver: true })),
    );
    a.start();
    return () => a.stop();
  }, [intro, reduced]);

  const rise = (i: number) => ({ opacity: intro[i], transform: [{ translateY: intro[i].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] });

  return (
    <View style={[styles.band, { paddingTop: topInset + spacing.xxxl }]}>
      <View style={[styles.inner, wide && styles.innerWide]}>
        <View style={[styles.copy, wide && styles.copyWide]}>
          <Animated.View style={[styles.textBlock, rise(0)]}>
            <View style={styles.eyebrow}>
              <View style={[styles.dot, { backgroundColor: colors.accentDecor }]} />
              <AppText variant="caption-uppercase" tone="muted">
                For sports facility owners
              </AppText>
            </View>
            <AppText role="heading" aria-level={1} style={[typography['display-mega'], { color: colors.text }]}>
              Run your <AppText style={[typography['display-mega'], { color: colors.accent }]}>courts</AppText>, not your spreadsheets.
            </AppText>
          </Animated.View>
          <Animated.View style={rise(1)}>
            <AppText tone="muted" style={styles.lead}>
              Bookings, payments and customers for your whole facility, in one app built for owners.
            </AppText>
          </Animated.View>
          <Animated.View style={[styles.ctas, rise(2)]}>
            <Button label="Get started" variant="accent" onPress={onGetStarted} />
            <Button label="See how it works" variant="secondary" onPress={onHowItWorks} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.phoneWrap, wide && styles.phoneWrapWide, rise(3)]}>
          <PhonePreview />
        </Animated.View>
      </View>

      <View style={[styles.inner, styles.strip]}>
        <AppText variant="body-strong" tone="muted">
          Built for
        </AppText>
        <View style={styles.pills} role="list">
          {SPORTS.map((s) => (
            <View key={s} role="listitem" style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <AppText variant="nav-link">{s}</AppText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/** The real court-day timeline component in a phone frame, with sample bookings. Not interactive. */
function PhonePreview() {
  const { colors } = useTheme();
  return (
    <View accessible aria-label="Preview of the SportVenue court calendar with sample bookings" style={styles.phoneHost}>
      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[styles.phone, { backgroundColor: colors.background, borderColor: colors.borderStrong }]}
      >
        <View style={[styles.notch, { backgroundColor: colors.borderStrong }]} />
        <View style={styles.phoneHead}>
          <AppText variant="body-sm" tone="muted">
            Court 1 · Padel
          </AppText>
          <View style={styles.dayRow}>
            <CaretLeft size={18} color={colors.textMuted} weight="bold" />
            <AppText variant="display-md" style={styles.flex}>
              Today
            </AppText>
            <CaretRight size={18} color={colors.textMuted} weight="bold" />
          </View>
        </View>
        <View style={styles.summary}>
          <SummaryPill label="Booked" value="4 of 6" tone="accent" />
          <SummaryPill label="Free" value="2 slots" tone="muted" />
        </View>
        <DayTimeline slots={SAMPLE_SLOTS} />
      </View>
    </View>
  );
}

function SummaryPill({ label, value, tone }: { label: string; value: string; tone: 'accent' | 'muted' }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.summaryPill, { backgroundColor: tone === 'accent' ? colors.accentSoft : colors.surfaceMuted }]}>
      <AppText variant="caption-uppercase" style={{ color: tone === 'accent' ? colors.accent : colors.textMuted }}>
        {label}
      </AppText>
      <AppText variant="title-sm">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { paddingHorizontal: spacing.xl },
  inner: { width: '100%', maxWidth: LANDING_MAX, alignSelf: 'center', gap: spacing.huge },
  innerWide: { flexDirection: 'row', alignItems: 'center', gap: 56 },
  copy: { gap: spacing.xxl },
  copyWide: { flex: 1.1 },
  textBlock: { gap: spacing.lg },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  lead: { maxWidth: 520 },
  // Both actions share one line from 360pt up; they wrap only on smaller screens.
  ctas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  phoneWrap: { alignItems: 'center' },
  phoneWrapWide: { flex: 1 },
  phoneHost: { width: '100%', maxWidth: 340 },
  phone: { borderRadius: 44, borderWidth: 1.5, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  notch: { alignSelf: 'center', width: 96, height: 6, borderRadius: radius.full, opacity: 0.6 },
  phoneHead: { gap: spacing.xs, paddingHorizontal: spacing.xs },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  summary: { flexDirection: 'row', gap: spacing.sm },
  summaryPill: { flex: 1, borderRadius: radius.control, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, gap: 2 },

  strip: { gap: spacing.md, marginTop: spacing.huge + spacing.sm },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: { borderRadius: radius.full, borderWidth: 1, paddingHorizontal: spacing.lg + 2, minHeight: 44, justifyContent: 'center' },
});

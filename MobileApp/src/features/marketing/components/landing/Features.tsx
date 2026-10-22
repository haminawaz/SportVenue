import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { useReducedMotion } from '@/ui/useReducedMotion';

import { LANDING_MAX, Lede, Section, SectionTitle, WIDE_AT } from './LandingScroll';
import { ProductShot, SHOT_RATIO, useShotFrame, type ShotName } from './ProductShot';

type Feature = { key: ShotName; tab: string; title: string; body: string; alt: string };

/** One point per job an owner does, each shown with the real screen that does it (same copy as the web landing). */
const FEATURES: Feature[] = [
  {
    key: 'schedule',
    tab: 'Bookings',
    title: 'Every court on one calendar',
    body: 'See each court’s day at a glance: booked hours, free slots and what has passed. A free slot is one tap from a new booking.',
    alt: 'The court calendar for Court 1: a week strip, booked hours with customer names and free slots to book.',
  },
  {
    key: 'payments',
    tab: 'Payments',
    title: 'Know exactly who owes you',
    body: 'Every unpaid booking with the customer, the court and how long it has been due. Record cash, card or bank transfer payments against the booking in a few taps.',
    alt: 'The payments screen: the total owed and a list of unpaid bookings with amounts.',
  },
  {
    key: 'customers',
    tab: 'Customers',
    title: 'A record for every regular',
    body: 'Phone numbers, booking history, total paid and open balance for each customer. Filter to your regulars or to everyone who still owes money.',
    alt: 'The customers list with phone numbers, number of bookings and balances.',
  },
  {
    key: 'pricing',
    tab: 'Pricing',
    title: 'Peak rates and discounts, set once',
    body: 'A base rate per court, time-based rates for evenings and weekends, and discounts as a percentage or fixed amount, with or without a code. Every booking is priced from these rules.',
    alt: 'The pricing screen with base rates per court and time-based rates.',
  },
  {
    key: 'insights',
    tab: 'Analytics',
    title: 'See which hours make money',
    body: 'Revenue, bookings and utilization by court and by hour, for any period, compared with the period before.',
    alt: 'The dashboard report: peak and off-peak hours by weekday and hour, with the busiest and quietest times.',
  },
];

/** How long each point stays open before the tour moves on. */
const SLIDE_MS = 5000;
const SWAP_MS = 650;

/**
 * Product tour. Phones: a scrolling tab row with a bar under the active tab
 * that fills over five seconds, then the screen and its description. Tablets:
 * the points run down the left with a line beside the active one that fills
 * from top to bottom, and the screen sits on the right.
 *
 * When the time runs out the screens swap like a vertical carousel: the old
 * one slides up and out while the new one rises from the bottom. Autoplay
 * starts when the section first comes into view, restarts when a point is
 * chosen by hand, and is off under reduced motion.
 */
export function Features() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_AT;
  const reduced = useReducedMotion();
  const frame = useShotFrame();

  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));
  const [swap] = useState(() => new Animated.Value(1));
  const tabRow = useRef<ScrollView>(null);
  const tabX = useRef<number[]>([]);
  const autoplay = started && !reduced;

  const column = Math.min(width, LANDING_MAX + spacing.xl * 2) - spacing.xl * 2;
  const shotWidth = wide ? Math.min(320, column * 0.42) : Math.min(320, column - spacing.xxl * 2);
  const cropHeight = Math.min(shotWidth * SHOT_RATIO, wide ? 600 : 560);

  const go = (i: number) => {
    if (i === active) return;
    setLeaving(active);
    setActive(i);
  };

  // The screens swap upwards each time the active point changes.
  useEffect(() => {
    if (leaving === null) return;
    swap.setValue(0);
    const a = Animated.timing(swap, { toValue: 1, duration: reduced ? 0 : SWAP_MS, easing: Easing.inOut(Easing.cubic), useNativeDriver: true });
    a.start(({ finished }) => finished && setLeaving(null));
    return () => a.stop();
  }, [active, leaving, reduced, swap]);

  // The progress line is the timer: when it fills, the next point opens.
  useEffect(() => {
    progress.setValue(0);
    if (!autoplay) return;
    const a = Animated.timing(progress, { toValue: 1, duration: SLIDE_MS, easing: Easing.linear, useNativeDriver: false });
    a.start(({ finished }) => {
      if (finished) {
        setLeaving(active);
        setActive((active + 1) % FEATURES.length);
      }
    });
    return () => a.stop();
  }, [active, autoplay, progress]);

  // Keep the active tab in view on the phone tab row.
  useEffect(() => {
    if (wide) return;
    const x = tabX.current[active];
    if (x !== undefined) tabRow.current?.scrollTo({ x: Math.max(0, x - spacing.xl), animated: !reduced });
  }, [active, wide, reduced]);

  const current = FEATURES[active];
  const incoming = { transform: [{ translateY: swap.interpolate({ inputRange: [0, 1], outputRange: [cropHeight, 0] }) }] };
  const outgoing = { transform: [{ translateY: swap.interpolate({ inputRange: [0, 1], outputRange: [0, -cropHeight] }) }] };

  const screen = (
    <View style={[frame, { width: shotWidth, height: cropHeight }]}>
      {leaving !== null && (
        <Animated.View style={[StyleSheet.absoluteFill, outgoing]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <ProductShot name={FEATURES[leaving].key} width={shotWidth} alt="" />
        </Animated.View>
      )}
      <Animated.View key={current.key} style={leaving !== null ? incoming : undefined}>
        <ProductShot name={current.key} width={shotWidth} alt={current.alt} />
      </Animated.View>
    </View>
  );

  return (
    <Section id="features" onReveal={() => setStarted(true)} style={styles.section}>
      <View style={styles.head}>
        <SectionTitle>One app for the courts, the counter and the books.</SectionTitle>
        <Lede>Each part of SportVenue does one job you already do today, without the spreadsheet or the chat thread.</Lede>
      </View>

      {wide ? (
        <View style={styles.wideRow}>
          <View role="tablist" aria-label="Product areas" style={styles.list}>
            {FEATURES.map((f, i) => {
              const selected = i === active;
              return (
                <Pressable key={f.key} role="tab" aria-selected={selected} onPress={() => go(i)} style={styles.item}>
                  {/* Rail: grey track on every point; on the active one it fills from top to bottom. */}
                  <View style={[styles.rail, { backgroundColor: colors.border }]}>
                    {selected && (
                      <Animated.View
                        style={[
                          styles.railFill,
                          { backgroundColor: colors.accent, height: autoplay ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) : '100%' },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.itemText}>
                    <AppText variant="title-sm" tone={selected ? 'default' : 'muted'}>
                      {f.title}
                    </AppText>
                    {selected && (
                      <AppText variant="body-sm" tone="muted">
                        {f.body}
                      </AppText>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
          {screen}
        </View>
      ) : (
        <View style={styles.phone}>
          <ScrollView ref={tabRow} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabRow} role="tablist" aria-label="Product areas">
            {FEATURES.map((f, i) => {
              const selected = i === active;
              return (
                <Pressable
                  key={f.key}
                  role="tab"
                  aria-selected={selected}
                  onLayout={(e) => {
                    tabX.current[i] = e.nativeEvent.layout.x;
                  }}
                  onPress={() => go(i)}
                  style={({ pressed }) => [styles.tab, { backgroundColor: selected ? colors.surfaceMuted : 'transparent' }, pressed && styles.pressed]}
                >
                  <AppText variant="nav-link" tone={selected ? 'default' : 'muted'}>
                    {f.tab}
                  </AppText>
                  {selected && autoplay && (
                    <View style={[styles.bar, { backgroundColor: colors.accentSoft }]}>
                      <Animated.View style={[styles.barFill, { backgroundColor: colors.accent, width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.center}>{screen}</View>
          <View key={current.key} style={styles.caption}>
            <AppText variant="title-md">{current.title}</AppText>
            <AppText tone="muted">{current.body}</AppText>
          </View>
        </View>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.huge },
  head: { gap: spacing.lg },
  wideRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.huge },
  list: { flex: 1, maxWidth: 380 },
  item: { flexDirection: 'row', gap: spacing.xl, paddingVertical: spacing.lg + 2 },
  rail: { width: 2, borderRadius: 1, overflow: 'hidden' },
  railFill: { position: 'absolute', top: 0, left: 0, right: 0 },
  itemText: { flex: 1, gap: spacing.sm },
  phone: { gap: spacing.xxl },
  // The tab row bleeds to the screen edges so tabs can scroll past the gutter.
  tabRow: { marginHorizontal: -spacing.xl },
  tabs: { paddingHorizontal: spacing.xl, gap: spacing.xs },
  tab: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radius.full, overflow: 'hidden' },
  bar: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 6, height: 2, borderRadius: 1, overflow: 'hidden' },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  pressed: { opacity: 0.7 },
  center: { alignItems: 'center' },
  caption: { gap: spacing.sm },
});

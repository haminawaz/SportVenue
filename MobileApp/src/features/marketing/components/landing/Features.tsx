import { useState, type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { AddressBook, CalendarCheck, ChartLineUp, CourtBasketball, Wallet, type IconProps } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

import { Section } from './LandingScroll';

type Feature = { key: string; title: string; body: string; icon: ComponentType<IconProps> };

/** Five cards, one per job an owner does. No staff management: SportVenue has one owner account. */
const FEATURES: Feature[] = [
  { key: 'calendar', title: 'Booking calendar', body: 'Every court, every hour on one screen. Spot free slots and book them in a few taps.', icon: CalendarCheck },
  { key: 'courts', title: 'Courts and hours', body: 'Set opening hours, base rates and peak pricing for each court once.', icon: CourtBasketball },
  { key: 'customers', title: 'Customer records', body: 'Phone numbers, booking history and balances for every regular in one place.', icon: AddressBook },
  { key: 'payments', title: 'Payments and balances', body: 'Record cash, card or transfer payments and remind anyone who still owes you.', icon: Wallet },
  { key: 'analytics', title: 'Revenue analytics', body: 'Revenue, utilization and peak hours by court, for any period you choose.', icon: ChartLineUp },
];

/**
 * 1 column on phones, 2 from 520pt, 3 from 900pt. The first card is featured
 * and spans two columns so five cards always fill the grid with no gaps.
 */
export function Features() {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const cols = width >= 900 ? 3 : width >= 520 ? 2 : 1;
  const gap = spacing.md;
  const cell = cols === 1 ? width : (width - gap * (cols - 1)) / cols;

  return (
    <Section id="features">
      <View style={styles.head}>
        <AppText role="heading" variant="display-xl">
          Everything your facility runs on.
        </AppText>
        <AppText tone="muted" style={styles.sub}>
          One app for the front counter, the courts and the books.
        </AppText>
      </View>
      <View style={styles.grid} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 &&
          FEATURES.map((f, i) => {
            const featured = i === 0 && cols > 1;
            const Icon = f.icon;
            return (
              <View
                key={f.key}
                style={[
                  styles.card,
                  { width: featured ? cell * 2 + gap : cell, backgroundColor: featured ? colors.accentSoft : colors.surface, borderColor: featured ? 'transparent' : colors.border },
                ]}
              >
                <View style={[styles.icon, { backgroundColor: featured ? colors.surface : colors.surfaceMuted }]}>
                  <Icon size={24} color={colors.accent} weight="bold" />
                </View>
                <AppText variant={featured ? 'display-md' : 'title-md'}>{f.title}</AppText>
                <AppText tone="muted">{f.body}</AppText>
              </View>
            );
          })}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.md },
  sub: { maxWidth: 520 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, padding: spacing.xxl, gap: spacing.md, minHeight: 200 },
  icon: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
});

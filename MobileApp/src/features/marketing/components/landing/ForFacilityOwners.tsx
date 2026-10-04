import type { ComponentType } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { CheckCircle, XCircle, type IconProps } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';

import { Section } from './LandingScroll';

const BEFORE = ['Bookings buried in WhatsApp chats', 'Balances tracked in Excel, or not at all', 'Double-booked courts on busy evenings', 'No idea which hours make money'];
const AFTER = ['Every booking on one calendar', 'Outstanding balances with a reminder button', 'Slots that can only be sold once', 'Revenue and utilization by court and hour'];

/** The owner-to-owner section: an ink panel naming the daily mess, then what changes. */
export function ForFacilityOwners({ onBookDemo }: { onBookDemo: () => void }) {
  const { colors } = useTheme();
  const split = useWindowDimensions().width >= 768;
  return (
    <Section id="owners" bandStyle={styles.band} style={[styles.panel, { backgroundColor: colors.ink }]}>
      <View style={styles.head}>
        <AppText role="heading" variant="display-xl" style={{ color: colors.onInk }}>
          Built for the people who run the venue.
        </AppText>
        <AppText style={[styles.sub, { color: colors.onInkMuted }]}>Players get a booking app. You get the back office that keeps the courts full and the books straight.</AppText>
      </View>
      <View style={[styles.lists, split && styles.listsSplit]}>
        <Column title="Without SportVenue" items={BEFORE} icon={XCircle} tone="muted" />
        <Column title="With SportVenue" items={AFTER} icon={CheckCircle} tone="accent" />
      </View>
      <View style={styles.cta}>
        <Button label="Book a demo" variant="inverse" size="lg" onPress={onBookDemo} />
      </View>
    </Section>
  );
}

function Column({ title, items, icon: Icon, tone }: { title: string; items: string[]; icon: ComponentType<IconProps>; tone: 'muted' | 'accent' }) {
  const { colors } = useTheme();
  const iconColor = tone === 'accent' ? colors.inkAccent : colors.onInkMuted;
  return (
    <View style={[styles.column, { borderColor: colors.inkLine }]}>
      <AppText variant="caption-uppercase" style={{ color: tone === 'accent' ? colors.inkAccent : colors.onInkMuted }}>
        {title}
      </AppText>
      <View style={styles.items} role="list">
        {items.map((t) => (
          <View key={t} style={styles.item} role="listitem">
            <Icon size={22} color={iconColor} weight={tone === 'accent' ? 'fill' : 'regular'} style={styles.itemIcon} />
            <AppText style={[styles.flex, { color: tone === 'accent' ? colors.onInk : colors.onInkMuted }]}>{t}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { paddingHorizontal: spacing.md },
  panel: { borderRadius: radius.hero, paddingHorizontal: spacing.xxl, paddingVertical: spacing.huge, gap: spacing.xxxl },
  head: { gap: spacing.md },
  sub: { maxWidth: 560 },
  lists: { gap: spacing.lg },
  listsSplit: { flexDirection: 'row' },
  column: { flex: 1, borderWidth: 1, borderRadius: radius.card, padding: spacing.xl, gap: spacing.lg },
  items: { gap: spacing.md },
  item: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  itemIcon: { marginTop: 1 },
  flex: { flex: 1 },
  cta: { alignItems: 'flex-start' },
});

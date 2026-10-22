import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { ArrowRight } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

import { Lede, Section, SectionTitle, WIDE_AT } from './LandingScroll';

/** The daily problems an owner names first, and what SportVenue replaces each one with. */
const CHANGES = [
  { before: 'Bookings buried in WhatsApp chats', after: 'Every booking on one calendar, for every court' },
  { before: 'Balances tracked in Excel, or not at all', after: 'Outstanding balances per customer, with a reminder button' },
  { before: 'Double-booked courts on busy evenings', after: 'Slots that can only be sold once' },
  { before: 'No idea which hours make money', after: 'Revenue and utilization by court and by hour' },
];

const SPORTS = 'padel, tennis, futsal, squash, badminton, pickleball and cricket nets';

/** Raised band: who it is for, then the before-and-after list (side by side on tablets). */
export function ForFacilityOwners() {
  const { colors } = useTheme();
  const wide = useWindowDimensions().width >= WIDE_AT;

  return (
    <Section
      id="owners"
      bandStyle={[styles.band, { backgroundColor: colors.surface, borderColor: colors.border }]}
      style={[styles.section, wide && styles.sectionWide]}
    >
      <View style={[styles.head, wide && styles.flex]}>
        <SectionTitle>Built for the people who run the venue.</SectionTitle>
        <Lede>Players get a booking app. You get the back office that keeps the courts full and the books straight.</Lede>
        <AppText variant="body-sm" tone="subtle">
          Made for facilities with {SPORTS}. One owner account runs the whole venue.
        </AppText>
      </View>
      <View role="list" style={wide && styles.flex}>
        {CHANGES.map((c, i) => (
          <View
            key={c.before}
            role="listitem"
            accessible
            aria-label={`Today: ${c.before}. With SportVenue: ${c.after}.`}
            style={[styles.row, i > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth * 2 }]}
          >
            <AppText variant="body-sm" tone="subtle">
              {c.before}
            </AppText>
            <View style={styles.after}>
              <ArrowRight size={16} color={colors.accent} weight="bold" style={styles.arrow} />
              <AppText variant="body-strong" style={styles.flex}>
                {c.after}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  band: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  section: { gap: spacing.huge },
  sectionWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 56 },
  head: { gap: spacing.lg },
  flex: { flex: 1 },
  row: { paddingVertical: spacing.lg + 2, gap: spacing.xs },
  after: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  arrow: { marginTop: 4 },
});

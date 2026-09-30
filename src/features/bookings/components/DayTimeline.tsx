import { Pressable, StyleSheet, View } from 'react-native';
import { Plus, Prohibit } from 'phosphor-react-native';

import type { AvailabilitySlot } from '@/domain/types';
import { formatTime } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type DayTimelineProps = {
  slots: AvailabilitySlot[];
  onBook?: (slot: AvailabilitySlot) => void;
  onOpenBooking?: (bookingId: string) => void;
};

/**
 * A court's day, slot by slot. Consecutive slots of the same booking are
 * merged into one block so a 90-minute game reads as one item.
 */
export function DayTimeline({ slots, onBook, onOpenBooking }: DayTimelineProps) {
  const { colors } = useTheme();
  const f = useFormat();

  const blocks: (AvailabilitySlot & { endAt: string })[] = [];
  for (const s of slots) {
    const last = blocks[blocks.length - 1];
    if (last && s.status === 'BOOKED' && last.status === 'BOOKED' && last.bookingId === s.bookingId) last.endAt = s.endAt;
    else blocks.push({ ...s });
  }

  return (
    <View style={styles.list} role="list">
      {blocks.map((s) => {
        const time = formatTime(s.startAt, f.timeZone);
        const range = `${time} - ${formatTime(s.endAt, f.timeZone)}`;
        if (s.status === 'BOOKED') {
          return (
            <Pressable
              key={s.startAt}
              role="button"
              aria-label={`Booked, ${range}, ${s.customerName ?? ''}`}
              disabled={!onOpenBooking || !s.bookingId}
              onPress={() => s.bookingId && onOpenBooking?.(s.bookingId)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
            >
              <AppText variant="body-sm" tone="muted" numeric style={styles.time}>
                {time}
              </AppText>
              <View style={[styles.block, styles.booked, { backgroundColor: colors.accentSoft, borderLeftColor: colors.accent }]}>
                <AppText variant="body-strong" numberOfLines={1}>
                  {s.customerName ?? 'Booked'}
                </AppText>
                <AppText variant="body-sm" tone="muted" numeric>
                  {range}
                </AppText>
              </View>
            </Pressable>
          );
        }
        if (s.status === 'FREE') {
          return (
            <Pressable
              key={s.startAt}
              role="button"
              aria-label={`Free, ${range}${s.rate ? `, ${f.moneyA11y(s.rate)} per hour` : ''}. Book this slot`}
              disabled={!onBook}
              onPress={() => onBook?.(s)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            >
              <AppText variant="body-sm" tone="muted" numeric style={styles.time}>
                {time}
              </AppText>
              <View style={[styles.block, styles.free, { borderColor: colors.border }]}>
                <AppText variant="nav-link" tone="muted" style={styles.flex}>
                  Free{s.rate ? ` · ${f.money(s.rate)}/h` : ''}
                </AppText>
                {onBook && (
                  <View style={styles.bookHint}>
                    <Plus size={14} color={colors.accent} weight="bold" />
                    <AppText variant="nav-link" tone="accent">
                      Book
                    </AppText>
                  </View>
                )}
              </View>
            </Pressable>
          );
        }
        return (
          <View key={s.startAt} style={styles.row} accessible aria-label={`${s.status === 'CLOSED' ? 'Closed' : 'Past'}, ${range}`}>
            <AppText variant="body-sm" tone="subtle" numeric style={styles.time}>
              {time}
            </AppText>
            <View style={[styles.block, styles.muted, { backgroundColor: colors.surfaceMuted }]}>
              {s.status === 'CLOSED' && <Prohibit size={14} color={colors.textSubtle} />}
              <AppText variant="body-sm" tone="subtle">
                {s.status === 'CLOSED' ? 'Closed' : 'Passed'}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs + 2 },
  row: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.md },
  time: { width: 64, paddingTop: spacing.sm + 2, textAlign: 'right' },
  block: { flex: 1, borderRadius: radius.control, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 44, justifyContent: 'center' },
  booked: { borderLeftWidth: 3 },
  free: { borderWidth: 1, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center' },
  muted: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, minHeight: 36 },
  flex: { flex: 1 },
  bookHint: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});

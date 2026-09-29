import { useEffect, useMemo, useRef } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { addDays, formatCalendarDate, type CalendarDate } from '@/lib/datetime';
import { WEEKDAY_SHORT } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { GUTTER } from '@/ui/surface';

const ITEM = 60;
const GAP = spacing.sm;

type DateStripProps = { value: CalendarDate; today: CalendarDate; onChange: (d: CalendarDate) => void; daysBefore?: number; daysAfter?: number };

/** Horizontal day picker. Today is marked with text, not just colour. */
export function DateStrip({ value, today, onChange, daysBefore = 14, daysAfter = 30 }: DateStripProps) {
  const { colors } = useTheme();
  const ref = useRef<FlatList<CalendarDate>>(null);
  const days = useMemo(() => Array.from({ length: daysBefore + daysAfter + 1 }, (_, i) => addDays(today, i - daysBefore)), [today, daysBefore, daysAfter]);
  const index = Math.max(0, days.indexOf(value));

  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollToIndex({ index, viewPosition: 0.5, animated: false }), 0);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <FlatList
      ref={ref}
      data={days}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(d) => d}
      style={{ marginHorizontal: -GUTTER, flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: GUTTER, gap: GAP }}
      getItemLayout={(_d, i) => ({ length: ITEM + GAP, offset: GUTTER + (ITEM + GAP) * i, index: i })}
      onScrollToIndexFailed={() => {}}
      renderItem={({ item }) => {
        const on = item === value;
        const isToday = item === today;
        const weekday = WEEKDAY_SHORT[new Date(`${item}T00:00:00Z`).getUTCDay()];
        return (
          <Pressable
            role="radio"
            aria-checked={on}
            aria-label={`${isToday ? 'Today, ' : ''}${formatCalendarDate(item)}`}
            onPress={() => onChange(item)}
            style={[styles.day, { backgroundColor: on ? colors.accent : colors.surface, borderColor: on ? colors.accent : colors.border }]}
          >
            <AppText variant="badge" style={{ color: on ? colors.onAccent : colors.textMuted }}>
              {isToday ? 'TODAY' : weekday.toUpperCase()}
            </AppText>
            <AppText variant="heading" numeric style={{ color: on ? colors.onAccent : colors.text }}>
              {item.slice(8, 10)}
            </AppText>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  day: { width: ITEM, height: 76, borderRadius: radius.card, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 2 },
});

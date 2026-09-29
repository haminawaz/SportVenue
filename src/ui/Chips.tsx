import type { ComponentType, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CaretDown, type IconProps } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { GUTTER } from './surface';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** Shows a caret: the chip opens a picker rather than toggling. */
  dropdown?: boolean;
  icon?: ComponentType<IconProps>;
  count?: number;
};

export function Chip({ label, selected, onPress, dropdown, icon: Icon, count }: ChipProps) {
  const { colors } = useTheme();
  const fg = selected ? colors.onAccent : colors.text;
  return (
    <Pressable
      role={dropdown ? 'button' : 'checkbox'}
      aria-checked={dropdown ? undefined : !!selected}
      aria-label={count !== undefined ? `${label}, ${count}` : label}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? colors.accent : colors.surface, borderColor: selected ? colors.accent : colors.border },
        pressed && styles.pressed,
      ]}
    >
      {Icon && <Icon size={17} color={fg} weight="bold" />}
      <AppText variant="label" style={{ color: fg }} numberOfLines={1}>
        {label}
      </AppText>
      {count !== undefined && (
        <View style={[styles.count, { backgroundColor: selected ? 'rgba(255,255,255,0.22)' : colors.surfaceMuted }]}>
          <AppText variant="badge" numeric style={{ color: selected ? colors.onAccent : colors.textMuted }}>
            {count}
          </AppText>
        </View>
      )}
      {dropdown && <CaretDown size={14} color={fg} weight="bold" />}
    </Pressable>
  );
}

/** Horizontally scrolling chip row that bleeds to the screen edge. */
export function ChipRow({ children, bleed = true }: { children: ReactNode; bleed?: boolean }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={bleed ? { marginHorizontal: -GUTTER, flexGrow: 0 } : { flexGrow: 0 }}
      contentContainerStyle={[styles.row, bleed && { paddingHorizontal: GUTTER }]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

type SegmentedProps<V extends string> = { value: V; options: { value: V; label: string }[]; onChange: (v: V) => void; label: string };

export function SegmentedControl<V extends string>({ value, options, onChange, label }: SegmentedProps<V>) {
  const { colors } = useTheme();
  return (
    <View role="tablist" aria-label={label} style={[styles.segmented, { backgroundColor: colors.surfaceMuted }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            role="tab"
            aria-selected={on}
            aria-label={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.segment, on && [styles.segmentOn, { backgroundColor: colors.surface, shadowColor: colors.shadow }]]}
          >
            <AppText variant="label" tone={on ? 'default' : 'muted'} numberOfLines={1} style={on && styles.segmentOnText}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Weekday toggles for pricing and discounts. */
export function DayToggles({ value, onChange, label }: { value: number[]; onChange: (v: number[]) => void; label: string }) {
  const { colors } = useTheme();
  const days = [1, 2, 3, 4, 5, 6, 0];
  const names = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const long = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return (
    <View style={styles.days} role="group" aria-label={label}>
      {days.map((d) => {
        const on = value.includes(d);
        return (
          <Pressable
            key={d}
            role="checkbox"
            aria-checked={on}
            aria-label={long[d]}
            onPress={() => onChange(on ? value.filter((x) => x !== d) : [...value, d])}
            style={[styles.day, { backgroundColor: on ? colors.accent : colors.surface, borderColor: on ? colors.accent : colors.border }]}
          >
            <AppText variant="label" style={{ color: on ? colors.onAccent : colors.text }}>
              {names[d]}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, alignItems: 'center', paddingVertical: 2 },
  chip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  count: { borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 1, minWidth: 24, alignItems: 'center' },
  pressed: { transform: [{ scale: 0.97 }] },
  segmented: { flexDirection: 'row', borderRadius: radius.full, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, paddingHorizontal: spacing.md },
  segmentOn: { shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  segmentOnText: { fontFamily: 'Geist_600SemiBold' },
  days: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  day: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
});

import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { CalendarBlank, CaretDown, CaretRight, Check } from 'phosphor-react-native';

import { addDays, calendarDateFromPicker, formatCalendarDate, pickerValueFromCalendarDate, type CalendarDate } from '@/lib/datetime';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { InlineDatePicker } from '@/ui/InlineDatePicker';

import type { DateRange, DateRangePreset } from '../types/facilityDashboard.types';
import { buildCustomRange, buildPresetRange, PRESET_TITLES, rangeLabel, RANGE_RULES, validateRange } from '../utils/dashboardFormatters';

type DateRangeSelectorProps = {
  value: DateRange;
  today: CalendarDate;
  onChange: (range: DateRange) => void;
};

type Preset = Exclude<DateRangePreset, 'custom'>;
const PRESETS = Object.keys(PRESET_TITLES) as Preset[];

type End = 'start' | 'end';

/**
 * Period filter: a chip showing the period, opening a sheet with Today, This
 * week, This month, This quarter, This year and a custom date range (from and
 * to). On iOS the range is picked with an inline calendar per end; on Android
 * each end opens the system date picker.
 */
export function DateRangeSelector({ value, today, onChange }: DateRangeSelectorProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [pickingCustom, setPickingCustom] = useState(false);
  const [draft, setDraft] = useState({ start: value.startDate, end: value.endDate });
  const [editing, setEditing] = useState<End>('start');
  const [error, setError] = useState<string | null>(null);

  const label = rangeLabel(value);
  const maxDate = RANGE_RULES.allowFuture ? addDays(today, 365) : today;

  const close = () => {
    setOpen(false);
    setPickingCustom(false);
    setError(null);
  };

  const apply = (range: DateRange) => {
    const result = validateRange(range, today);
    if (!result.valid) {
      setError(result.reason);
      return;
    }
    close();
    onChange(range);
  };

  const openCustom = () => {
    setError(null);
    setDraft(value.preset === 'custom' ? { start: value.startDate, end: value.endDate } : { start: addDays(today, -6), end: today });
    setEditing('start');
    setPickingCustom(true);
  };

  const setEnd = (which: End, d: CalendarDate) => {
    setError(null);
    setDraft((cur) => {
      const next = { ...cur, [which]: d };
      // Keep the range the right way round while picking.
      if (which === 'start' && next.end < d) next.end = d;
      if (which === 'end' && next.start > d) next.start = d;
      return next;
    });
  };

  const pickEnd = (which: End) => {
    setEditing(which);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickerValueFromCalendarDate(draft[which]),
        mode: 'date',
        maximumDate: pickerValueFromCalendarDate(maxDate),
        onValueChange: (_event, date) => setEnd(which, calendarDateFromPicker(date)),
      });
    }
  };

  const draftRange = buildCustomRange(draft.start, draft.end);

  return (
    <>
      <Pressable
        role="button"
        aria-label={`Showing ${label.title}${label.detail ? `, ${label.detail}` : ''}. Change period`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
      >
        <CalendarBlank size={20} color={colors.accent} weight="bold" />
        <AppText variant="body-strong" numberOfLines={1} style={styles.chipText}>
          {label.title}
          {label.detail ? <AppText variant="body-md" tone="muted">{`  ${label.detail}`}</AppText> : null}
        </AppText>
        <CaretDown size={16} color={colors.textMuted} weight="bold" />
      </Pressable>

      <BottomSheet visible={open} title={pickingCustom ? 'Date range' : 'Show period'} onClose={close}>
        {pickingCustom ? (
          <View style={styles.custom}>
            <View style={styles.ends}>
              {(['start', 'end'] as const).map((which) => {
                const active = editing === which && Platform.OS !== 'android';
                return (
                  <Pressable
                    key={which}
                    role="button"
                    aria-label={`${which === 'start' ? 'From' : 'To'} ${formatCalendarDate(draft[which])}. Change`}
                    onPress={() => pickEnd(which)}
                    style={({ pressed }) => [
                      styles.end,
                      { borderColor: active ? colors.accent : colors.border, backgroundColor: colors.surface },
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText variant="caption-uppercase" tone="muted">
                      {which === 'start' ? 'From' : 'To'}
                    </AppText>
                    <AppText variant="body-strong">{formatCalendarDate(draft[which])}</AppText>
                  </Pressable>
                );
              })}
            </View>
            {Platform.OS !== 'android' && (
              <InlineDatePicker
                key={editing}
                value={draft[editing]}
                minimumDate={editing === 'end' ? draft.start : undefined}
                maximumDate={editing === 'start' ? draft.end : maxDate}
                accentColor={colors.accent}
                onChange={(d) => setEnd(editing, d)}
              />
            )}
            {error && (
              <AppText variant="body-sm" tone="danger" role="alert">
                {error}
              </AppText>
            )}
            <View style={styles.customActions}>
              <Button label="Back" variant="secondary" onPress={() => setPickingCustom(false)} />
              <Button label={`Show ${rangeLabel(draftRange).title}`} block onPress={() => apply(draftRange)} />
            </View>
          </View>
        ) : (
          <View role="radiogroup">
            {PRESETS.map((preset) => {
              const selected = value.preset === preset;
              const text = PRESET_TITLES[preset];
              return (
                <Pressable
                  key={preset}
                  role="radio"
                  aria-checked={selected}
                  aria-label={text}
                  onPress={() => apply(buildPresetRange(preset, today))}
                  style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.surfaceMuted }]}
                >
                  <AppText variant="body-strong">{text}</AppText>
                  {selected && <Check size={18} color={colors.accent} weight="bold" />}
                </Pressable>
              );
            })}
            <Pressable
              role="button"
              aria-label="Pick a date range"
              onPress={openCustom}
              style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.surfaceMuted }]}
            >
              <View style={styles.flex}>
                <AppText variant="body-strong">Date range</AppText>
                {value.preset === 'custom' && (
                  <AppText variant="body-sm" tone="muted">
                    {label.title}
                  </AppText>
                )}
              </View>
              {value.preset === 'custom' ? <Check size={18} color={colors.accent} weight="bold" /> : <CaretRight size={16} color={colors.textMuted} />}
            </Pressable>
            {error && (
              <AppText variant="body-sm" tone="danger" role="alert" style={styles.error}>
                {error}
              </AppText>
            )}
          </View>
        )}
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
    flexShrink: 1,
  },
  chipText: { flexShrink: 1 },
  pressed: { transform: [{ scale: 0.98 }] },
  option: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.control,
  },
  flex: { flex: 1 },
  custom: { gap: spacing.md },
  ends: { flexDirection: 'row', gap: spacing.sm },
  end: { flex: 1, gap: 2, borderWidth: 1.5, borderRadius: radius.control, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: touchTarget },
  customActions: { flexDirection: 'row', gap: spacing.sm },
  error: { paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
});

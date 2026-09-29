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

import type { DateRange } from '../types/facilityDashboard.types';
import { buildCustomDayRange, buildPresetRange, rangeLabel, RANGE_RULES, validateRange } from '../utils/dashboardFormatters';

type DateRangeSelectorProps = {
  value: DateRange;
  today: CalendarDate;
  onChange: (range: DateRange) => void;
};

const PRESETS = [
  { preset: 'today', label: 'Today' },
  { preset: 'yesterday', label: 'Yesterday' },
  { preset: 'this_week', label: 'This week' },
] as const;

export function DateRangeSelector({ value, today, onChange }: DateRangeSelectorProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [pickingCustom, setPickingCustom] = useState(false);
  const [draftDate, setDraftDate] = useState<CalendarDate>(value.endDate);
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
    if (Platform.OS === 'android') {
      // Android shows its own modal calendar; close the sheet first so they do not stack.
      close();
      DateTimePickerAndroid.open({
        value: pickerValueFromCalendarDate(value.endDate),
        mode: 'date',
        maximumDate: pickerValueFromCalendarDate(maxDate),
        onValueChange: (_event, date) => apply(buildCustomDayRange(calendarDateFromPicker(date))),
      });
      return;
    }
    setDraftDate(value.endDate);
    setPickingCustom(true);
  };

  return (
    <>
      <Pressable
        role="button"
        aria-label={`Showing ${label.title}${label.detail ? `, ${label.detail}` : ''}. Change period`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
      >
        <CalendarBlank size={20} color={colors.accent} weight="bold" />
        <AppText variant="bodyStrong" numberOfLines={1} style={styles.chipText}>
          {label.title}
          {label.detail ? <AppText variant="body" tone="muted">{`  ${label.detail}`}</AppText> : null}
        </AppText>
        <CaretDown size={16} color={colors.textMuted} weight="bold" />
      </Pressable>

      <BottomSheet visible={open} title={pickingCustom ? 'Pick a date' : 'Show period'} onClose={close}>
        {pickingCustom ? (
          <View style={styles.custom}>
            <InlineDatePicker value={draftDate} maximumDate={maxDate} accentColor={colors.accent} onChange={setDraftDate} />
            {error && (
              <AppText variant="caption" tone="danger" role="alert">
                {error}
              </AppText>
            )}
            <View style={styles.customActions}>
              <Button label="Back" variant="secondary" onPress={() => setPickingCustom(false)} />
              <Button label={`Show ${formatCalendarDate(draftDate)}`} block onPress={() => apply(buildCustomDayRange(draftDate))} />
            </View>
          </View>
        ) : (
          <View role="radiogroup">
            {PRESETS.map(({ preset, label: text }) => {
              const selected = value.preset === preset;
              return (
                <Pressable
                  key={preset}
                  role="radio"
                  aria-checked={selected}
                  aria-label={text}
                  onPress={() => apply(buildPresetRange(preset, today))}
                  style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.surfaceMuted }]}
                >
                  <AppText variant="bodyStrong">{text}</AppText>
                  {selected && <Check size={18} color={colors.accent} weight="bold" />}
                </Pressable>
              );
            })}
            <Pressable
              role="button"
              aria-label="Pick a specific date"
              onPress={openCustom}
              style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.surfaceMuted }]}
            >
              <View>
                <AppText variant="bodyStrong">Pick a date</AppText>
                {value.preset === 'custom' && (
                  <AppText variant="caption" tone="muted">
                    {formatCalendarDate(value.startDate)}
                  </AppText>
                )}
              </View>
              {value.preset === 'custom' ? <Check size={18} color={colors.accent} weight="bold" /> : <CaretRight size={16} color={colors.textMuted} />}
            </Pressable>
            {error && (
              <AppText variant="caption" tone="danger" role="alert" style={styles.error}>
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
    paddingHorizontal: spacing.md,
    borderRadius: radius.control,
  },
  custom: { gap: spacing.md },
  customActions: { flexDirection: 'row', gap: spacing.sm },
  error: { paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
});

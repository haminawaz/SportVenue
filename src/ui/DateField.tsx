import { useEffect, useEffectEvent, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { CalendarBlank } from 'phosphor-react-native';

import { calendarDateFromPicker, formatCalendarDate, pickerValueFromCalendarDate, type CalendarDate } from '@/lib/datetime';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { PickerField } from './Fields';
import { InlineDatePicker } from './InlineDatePicker';

type DatePickerSheetProps = {
  visible: boolean;
  title: string;
  value: CalendarDate;
  minimumDate?: CalendarDate;
  maximumDate?: CalendarDate;
  onPick: (d: CalendarDate) => void;
  onClose: () => void;
  onClear?: () => void;
};

/** A date picker on its own: Android's native dialog, otherwise a sheet with an inline calendar. */
export function DatePickerSheet({ visible, title, value, minimumDate, maximumDate, onPick, onClose, onClear }: DatePickerSheetProps) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState(value);

  // Android: hand straight over to the native dialog, once per opening.
  const openAndroid = useEffectEvent(() => {
    DateTimePickerAndroid.open({
      value: pickerValueFromCalendarDate(value),
      mode: 'date',
      minimumDate: minimumDate ? pickerValueFromCalendarDate(minimumDate) : undefined,
      maximumDate: maximumDate ? pickerValueFromCalendarDate(maximumDate) : undefined,
      onValueChange: (_e, d) => onPick(calendarDateFromPicker(d)),
    });
    onClose();
  });

  useEffect(() => {
    if (visible && Platform.OS === 'android') openAndroid();
  }, [visible]);

  if (Platform.OS === 'android') return null;

  return (
    <BottomSheet visible={visible} title={title} onClose={onClose} onShow={() => setDraft(value)}>
      <View style={styles.body}>
        <InlineDatePicker value={draft} minimumDate={minimumDate} maximumDate={maximumDate} accentColor={colors.accent} onChange={setDraft} />
        <View style={styles.actions}>
          {onClear ? (
            <Button
              label="Clear"
              variant="secondary"
              onPress={() => {
                onClear();
                onClose();
              }}
            />
          ) : (
            <Button label="Cancel" variant="secondary" onPress={onClose} />
          )}
          <Button
            label="Done"
            block
            onPress={() => {
              onPick(draft);
              onClose();
            }}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

type DateFieldProps = {
  label: string;
  value: CalendarDate | undefined;
  onChange: (d: CalendarDate) => void;
  minimumDate?: CalendarDate;
  maximumDate?: CalendarDate;
  helper?: string;
  error?: string;
  optional?: boolean;
  placeholder?: string;
  /** Lets an optional date be cleared. */
  onClear?: () => void;
};

export function DateField({ label, value, onChange, minimumDate, maximumDate, onClear, placeholder = 'Choose a date', ...rest }: DateFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const start = value ?? minimumDate ?? calendarDateFromPicker(new Date());

  return (
    <>
      <PickerField
        label={label}
        value={value ? formatCalendarDate(value) : undefined}
        placeholder={placeholder}
        onPress={() => setOpen(true)}
        leading={<CalendarBlank size={18} color={colors.textMuted} />}
        {...rest}
      />
      <DatePickerSheet
        visible={open}
        title={label}
        value={start}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onPick={onChange}
        onClose={() => setOpen(false)}
        onClear={value ? onClear : undefined}
      />
    </>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
});

import DateTimePicker from '@react-native-community/datetimepicker';

import { calendarDateFromPicker, pickerValueFromCalendarDate, type CalendarDate } from '@/lib/datetime';

export type InlineDatePickerProps = {
  value: CalendarDate;
  minimumDate?: CalendarDate;
  maximumDate?: CalendarDate;
  accentColor: string;
  onChange: (date: CalendarDate) => void;
};

/** iOS inline calendar. Android opens its own dialog instead (callers use DateTimePickerAndroid); web uses InlineDatePicker.web.tsx. */
export function InlineDatePicker({ value, minimumDate, maximumDate, accentColor, onChange }: InlineDatePickerProps) {
  return (
    <DateTimePicker
      value={pickerValueFromCalendarDate(value)}
      mode="date"
      display="inline"
      minimumDate={minimumDate ? pickerValueFromCalendarDate(minimumDate) : undefined}
      maximumDate={maximumDate ? pickerValueFromCalendarDate(maximumDate) : undefined}
      accentColor={accentColor}
      onValueChange={(_event, date) => onChange(calendarDateFromPicker(date))}
    />
  );
}

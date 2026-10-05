'use client';

import { useState } from 'react';
import { CalendarBlank } from '@phosphor-icons/react';

import { calendarDateFromPicker, formatCalendarDate, type CalendarDate } from '@/lib/datetime';

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

/** A date picker on its own: a sheet with the browser's date input and Done. */
export function DatePickerSheet({ visible, title, value, minimumDate, maximumDate, onPick, onClose, onClear }: DatePickerSheetProps) {
  const [draft, setDraft] = useState(value);

  return (
    <BottomSheet visible={visible} title={title} onClose={onClose} onShow={() => setDraft(value)}>
      <div className="flex flex-col gap-3">
        <InlineDatePicker value={draft} minimumDate={minimumDate} maximumDate={maximumDate} onChange={setDraft} />
        <div className="flex gap-2">
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
        </div>
      </div>
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
  const [open, setOpen] = useState(false);
  const start = value ?? minimumDate ?? calendarDateFromPicker(new Date());

  return (
    <>
      <PickerField
        label={label}
        value={value ? formatCalendarDate(value) : undefined}
        placeholder={placeholder}
        onPress={() => setOpen(true)}
        leading={<CalendarBlank size={18} className="shrink-0 text-text-muted" aria-hidden />}
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

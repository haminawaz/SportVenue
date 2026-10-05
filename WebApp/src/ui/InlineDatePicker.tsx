'use client';

import type { CalendarDate } from '@/lib/datetime';

export type InlineDatePickerProps = {
  value: CalendarDate;
  minimumDate?: CalendarDate;
  maximumDate?: CalendarDate;
  onChange: (date: CalendarDate) => void;
};

/**
 * The browser's own date input (the mobile app uses the native calendar on
 * iOS/Android and this same input on web). Values are plain "YYYY-MM-DD"
 * calendar dates, so the device timezone never shifts the day.
 */
export function InlineDatePicker({ value, minimumDate, maximumDate, onChange }: InlineDatePickerProps) {
  return (
    <input
      type="date"
      aria-label="Date"
      data-autofocus
      value={value}
      min={minimumDate}
      max={maximumDate}
      onChange={(e) => e.target.value && onChange(e.target.value)}
      className="t-body-md min-h-[52px] w-full rounded-control border border-border bg-surface px-3 text-text accent-accent"
    />
  );
}

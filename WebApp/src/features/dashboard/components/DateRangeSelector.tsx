'use client';

import { useState } from 'react';
import { CalendarBlank } from '@phosphor-icons/react';

import { addDays, type CalendarDate } from '@/lib/datetime';
import { AppText } from '@/ui/AppText';
import { cn } from '@/ui/cn';
import { SegmentedControl } from '@/ui/Tabs';

import type { DateRange, DateRangePreset } from '../types/facilityDashboard.types';
import { buildCustomDayRange, buildPresetRange, RANGE_RULES, validateRange } from '../utils/dashboardFormatters';

type DateRangeSelectorProps = {
  value: DateRange;
  today: CalendarDate;
  onChange: (range: DateRange) => void;
};

const PRESETS: { value: Exclude<DateRangePreset, 'custom'>; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This week' },
];

/** Period filter: the three presets as a segmented control, plus a specific day. */
export function DateRangeSelector({ value, today, onChange }: DateRangeSelectorProps) {
  const [error, setError] = useState<string | null>(null);
  const maxDate = RANGE_RULES.allowFuture ? addDays(today, 365) : today;

  const apply = (range: DateRange) => {
    const result = validateRange(range, today);
    if (!result.valid) {
      setError(result.reason);
      return;
    }
    setError(null);
    onChange(range);
  };

  return (
    <div className="flex flex-col items-start gap-1 md:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          label="Period"
          value={value.preset === 'custom' ? ('' as Exclude<DateRangePreset, 'custom'>) : value.preset}
          options={PRESETS}
          onChange={(p) => apply(buildPresetRange(p, today))}
        />
        <label
          className={cn(
            'flex h-9 items-center gap-2 rounded-control border bg-surface px-2.5 transition-colors focus-within:ring-3 focus-within:ring-text/10',
            value.preset === 'custom' ? 'border-text' : 'border-border-strong',
          )}
        >
          <CalendarBlank size={16} className="text-text-subtle" aria-hidden />
          <span className="sr-only">Pick a date</span>
          <input
            type="date"
            value={value.preset === 'custom' ? value.startDate : ''}
            max={maxDate}
            onChange={(e) => e.target.value && apply(buildCustomDayRange(e.target.value))}
            className="t-label w-[124px] bg-transparent text-text outline-none"
          />
        </label>
      </div>
      {error && (
        <AppText variant="small" tone="danger" role="alert">
          {error}
        </AppText>
      )}
    </div>
  );
}

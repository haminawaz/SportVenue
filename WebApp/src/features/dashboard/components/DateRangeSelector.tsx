'use client';

import { useState } from 'react';
import { CalendarBlank } from '@phosphor-icons/react';

import { addDays, type CalendarDate } from '@/lib/datetime';
import { AppText } from '@/ui/AppText';
import { cn } from '@/ui/cn';
import { SegmentedControl } from '@/ui/Tabs';

import type { DateRange, DateRangePreset } from '../types/facilityDashboard.types';
import { buildCustomRange, buildPresetRange, PRESET_TITLES, RANGE_RULES, validateRange } from '../utils/dashboardFormatters';

type DateRangeSelectorProps = {
  value: DateRange;
  today: CalendarDate;
  onChange: (range: DateRange) => void;
};

type Preset = Exclude<DateRangePreset, 'custom'>;
const PRESETS = (Object.keys(PRESET_TITLES) as Preset[]).map((p) => ({ value: p, label: PRESET_TITLES[p] }));

const dateInput = 't-label w-[118px] bg-transparent text-text outline-none';

/**
 * Period filter: Today, This week, This month, This quarter and This year as
 * a segmented control, plus a custom range (from and to dates). The custom
 * range applies once both ends are set and valid.
 */
export function DateRangeSelector({ value, today, onChange }: DateRangeSelectorProps) {
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ start: CalendarDate | ''; end: CalendarDate | '' }>(() =>
    value.preset === 'custom' ? { start: value.startDate, end: value.endDate } : { start: '', end: '' },
  );
  const maxDate = RANGE_RULES.allowFuture ? addDays(today, 365) : today;
  const custom = value.preset === 'custom';

  const apply = (range: DateRange) => {
    const result = validateRange(range, today);
    if (!result.valid) {
      setError(result.reason);
      return false;
    }
    setError(null);
    onChange(range);
    return true;
  };

  const pickPreset = (p: Preset) => {
    if (apply(buildPresetRange(p, today))) setDraft({ start: '', end: '' });
  };

  const pickDate = (which: 'start' | 'end', d: CalendarDate | '') => {
    const next = { ...draft, [which]: d };
    setDraft(next);
    if (next.start && next.end) apply(buildCustomRange(next.start, next.end));
    else setError(null);
  };

  return (
    <div className="flex min-w-0 max-w-full flex-col items-start gap-1 lg:items-end">
      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 lg:justify-end">
        <SegmentedControl label="Period" value={custom ? ('' as Preset) : (value.preset as Preset)} options={PRESETS} onChange={pickPreset} />
        <fieldset
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-control border bg-surface px-2.5 transition-colors focus-within:ring-3 focus-within:ring-text/10',
            custom ? 'border-text' : 'border-border-strong',
          )}
        >
          <legend className="sr-only">Custom date range</legend>
          <CalendarBlank size={16} className="shrink-0 text-text-subtle" aria-hidden />
          <input type="date" aria-label="From" value={draft.start} max={draft.end || maxDate} onChange={(e) => pickDate('start', e.target.value)} className={dateInput} />
          <span aria-hidden className="t-label text-text-subtle">
            -
          </span>
          <input type="date" aria-label="To" value={draft.end} min={draft.start || undefined} max={maxDate} onChange={(e) => pickDate('end', e.target.value)} className={dateInput} />
        </fieldset>
      </div>
      {error && (
        <AppText variant="small" tone="danger" role="alert">
          {error}
        </AppText>
      )}
    </div>
  );
}

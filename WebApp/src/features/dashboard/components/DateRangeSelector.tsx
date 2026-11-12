'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CalendarBlank, CaretDown } from '@phosphor-icons/react';

import { addDays, daysBetween, formatCalendarDate, type CalendarDate } from '@/lib/datetime';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Portal } from '@/ui/Overlay';
import { RangeCalendar } from '@/ui/RangeCalendar';
import { SegmentedControl } from '@/ui/Tabs';

import type { DateRange, DateRangePreset } from '../types/facilityDashboard.types';
import { buildCustomRange, buildPresetRange, DEFAULT_PRESET, PRESET_TITLES, RANGE_RULES, rangeLabel, validateRange } from '../utils/dashboardFormatters';

type DateRangeSelectorProps = {
  value: DateRange;
  today: CalendarDate;
  onChange: (range: DateRange) => void;
};

type Preset = Exclude<DateRangePreset, 'custom'>;
const PRESETS = (Object.keys(PRESET_TITLES) as Preset[]).map((p) => ({ value: p, label: PRESET_TITLES[p] }));

type Draft = { start: CalendarDate | null; end: CalendarDate | null };
type Place = { top: number; left: number; width: number; months: 1 | 2; maxHeight: number };

const GUTTER = 16;
const FOCUSABLE = 'button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Period filter: Today, This week, This month, This quarter and This year as
 * a segmented control, plus a custom range picked on a calendar. The first
 * click sets the first day, the second the last day (an earlier day starts
 * over), and Apply shows that range.
 */
export function DateRangeSelector({ value, today, onChange }: DateRangeSelectorProps) {
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({ start: null, end: null });
  const [place, setPlace] = useState<Place | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
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
    if (apply(buildPresetRange(p, today))) close(false);
  };

  const openPicker = () => {
    setDraft(custom ? { start: value.startDate, end: value.endDate } : { start: null, end: null });
    setError(null);
    setOpen(true);
  };

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    setPlace(null);
    setError(null);
    if (refocus) trigger.current?.focus();
  }, []);

  // A third click, or one before the first day, starts a new range.
  const pickDay = (d: CalendarDate) => {
    setError(null);
    setDraft((cur) => (!cur.start || cur.end || d < cur.start ? { start: d, end: null } : { start: cur.start, end: d }));
  };

  // Empties the picked days; an applied custom range goes too, back to the default period.
  const clear = () => {
    setDraft({ start: null, end: null });
    setError(null);
    if (custom) onChange(buildPresetRange(DEFAULT_PRESET, today));
    // Clear disables itself, so keep focus on the calendar.
    panel.current?.querySelector<HTMLElement>('[data-date][tabindex="0"]')?.focus();
  };

  const applyDraft = () => {
    if (draft.start && draft.end && apply(buildCustomRange(draft.start, draft.end))) close(true);
  };

  // Below the trigger, right edges aligned, kept inside the window; two months when there is room.
  const measure = useCallback(() => {
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = window.innerHeight;
    const months = vw >= 680 ? 2 : 1;
    const width = months === 2 ? 620 : Math.min(340, vw - GUTTER * 2);
    const left = Math.max(GUTTER, Math.min(r.right - width, vw - width - GUTTER));
    setPlace({ top: r.bottom + 6, left, width, months, maxHeight: Math.max(280, vh - r.bottom - 6 - GUTTER) });
  }, []);

  useLayoutEffect(() => {
    if (open) measure();
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !trigger.current?.contains(t)) close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(true);
        return;
      }
      // Tab stays inside the panel while it is open.
      if (e.key === 'Tab' && panel.current) {
        const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!items.length) return;
        const [first, last] = [items[0], items[items.length - 1]];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, close, measure]);

  const hint = error
    ? error
    : !draft.start
      ? 'Pick the first day.'
      : !draft.end
        ? `From ${formatCalendarDate(draft.start)}. Now pick the last day.`
        : `${formatCalendarDate(draft.start)} - ${formatCalendarDate(draft.end)} · ${daysBetween(draft.start, draft.end) + 1} ${daysBetween(draft.start, draft.end) === 0 ? 'day' : 'days'}`;

  return (
    <div className="flex min-w-0 max-w-full flex-col items-start gap-1 lg:items-end">
      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 lg:justify-end">
        <SegmentedControl label="Period" value={custom ? ('' as Preset) : (value.preset as Preset)} options={PRESETS} onChange={pickPreset} />
        <button
          ref={trigger}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={custom ? `Custom range, ${rangeLabel(value).title}. Change` : 'Custom range'}
          onClick={() => (open ? close(false) : openPicker())}
          className={cn(
            't-label flex h-9 max-w-full items-center gap-2 rounded-control border bg-surface px-3 whitespace-nowrap transition-colors hover:border-text',
            custom || open ? 'border-text text-text' : 'border-border-strong text-text-muted',
          )}
        >
          <CalendarBlank size={16} className="shrink-0 text-text-subtle" aria-hidden />
          <span className="truncate">{custom ? rangeLabel(value).title : 'Custom range'}</span>
          <CaretDown size={13} weight="bold" className="shrink-0" aria-hidden />
        </button>
      </div>
      {error && !open && (
        <AppText variant="small" tone="danger" role="alert">
          {error}
        </AppText>
      )}

      {open && (
        <Portal>
          <div
            ref={panel}
            role="dialog"
            aria-label="Pick a date range"
            className="fixed z-50 flex flex-col overflow-y-auto rounded-card border border-border bg-surface-raised shadow-raised animate-fade-in"
            style={place ? { top: place.top, left: place.left, width: place.width, maxHeight: place.maxHeight } : { visibility: 'hidden' }}
          >
            {/* Mounted once placed, so it can take focus on its first day. */}
            <div className="p-4 pb-3">{place && <RangeCalendar start={draft.start} end={draft.end} max={maxDate} today={today} months={place.months} onPick={pickDay} />}</div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
              <AppText variant="small" tone={error ? 'danger' : 'muted'} role={error ? 'alert' : undefined} aria-live="polite" className="min-w-0 flex-1">
                {hint}
              </AppText>
              <div className="flex shrink-0 gap-2">
                <Button label="Clear" variant="ghost" size="sm" disabled={!draft.start && !custom} onPress={clear} />
                <Button label="Cancel" variant="secondary" size="sm" onPress={() => close(true)} />
                <Button label="Apply" size="sm" disabled={!draft.start || !draft.end} onPress={applyDraft} />
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

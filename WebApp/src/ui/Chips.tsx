'use client';

import type { ReactNode } from 'react';
import { CaretDown } from '@phosphor-icons/react';

import { WEEKDAY_LONG } from '@/lib/format';

import { AppText } from './AppText';
import { cn } from './cn';
import type { IconType } from './icon';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** Shows a caret: the chip opens a picker rather than toggling. */
  dropdown?: boolean;
  icon?: IconType;
  count?: number;
};

export function Chip({ label, selected, onPress, dropdown, icon: Icon, count }: ChipProps) {
  return (
    <button
      type="button"
      role={dropdown ? undefined : 'checkbox'}
      aria-checked={dropdown ? undefined : !!selected}
      aria-haspopup={dropdown ? 'dialog' : undefined}
      aria-label={count !== undefined ? `${label}, ${count}` : label}
      onClick={onPress}
      className={cn(
        'flex min-h-[46px] shrink-0 items-center gap-2 rounded-full border px-[18px] transition-transform duration-100 active:scale-[0.97] motion-reduce:active:scale-100',
        selected ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface text-text hover:bg-surface-muted',
      )}
    >
      {Icon && <Icon size={17} weight="bold" className="shrink-0" />}
      <AppText variant="nav-link" lines={1} className="text-current">
        {label}
      </AppText>
      {count !== undefined && (
        <span className={cn('min-w-6 rounded-full px-[7px] py-px text-center', selected ? 'bg-ink-line text-on-primary' : 'bg-surface-muted text-text-muted')}>
          <AppText variant="caption-uppercase" numeric className="text-current">
            {count}
          </AppText>
        </span>
      )}
      {dropdown && <CaretDown size={14} weight="bold" className="shrink-0" />}
    </button>
  );
}

/** Horizontally scrolling chip row that bleeds to the screen edge on phones. */
export function ChipRow({ children, bleed = true }: { children: ReactNode; bleed?: boolean }) {
  return (
    <div className={cn('scrollbar-none flex items-center gap-2 overflow-x-auto py-0.5', bleed && '-mx-5 px-5')}>
      {children}
    </div>
  );
}

type SegmentedProps<V extends string> = { value: V; options: { value: V; label: string }[]; onChange: (v: V) => void; label: string };

export function SegmentedControl<V extends string>({ value, options, onChange, label }: SegmentedProps<V>) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-full bg-surface-muted p-[5px]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex min-h-[46px] min-w-0 flex-1 items-center justify-center rounded-full px-3 transition-colors',
              on ? 'bg-surface shadow-[0_2px_6px_rgba(42,33,23,0.1)]' : 'hover:bg-surface/50',
            )}
          >
            <AppText variant="nav-link" tone={on ? 'default' : 'muted'} lines={1}>
              {o.label}
            </AppText>
          </button>
        );
      })}
    </div>
  );
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Weekday toggles for pricing and discounts. */
export function DayToggles({ value, onChange, label }: { value: number[]; onChange: (v: number[]) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {DAY_ORDER.map((d) => {
        const on = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            role="checkbox"
            aria-checked={on}
            aria-label={WEEKDAY_LONG[d]}
            onClick={() => onChange(on ? value.filter((x) => x !== d) : [...value, d])}
            className={cn(
              'flex h-[46px] w-[46px] items-center justify-center rounded-full border transition-colors',
              on ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface text-text hover:bg-surface-muted',
            )}
          >
            <AppText variant="nav-link" className="text-current">
              {DAY_SHORT[d]}
            </AppText>
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { useRef, type KeyboardEvent } from 'react';

import { cn } from './cn';

export type TabItem<V extends string> = { value: V; label: string; count?: number };

/**
 * Underline tabs for switching views within a page (List / Schedule,
 * Outstanding / Received, opportunity statuses). Arrow keys move between tabs.
 */
export function Tabs<V extends string>({ value, items, onChange, label, className }: { value: V; items: TabItem<V>[]; onChange: (v: V) => void; label: string; className?: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (i + d + items.length) % items.length;
    refs.current[next]?.focus();
    onChange(items[next].value);
  };
  return (
    <div role="tablist" aria-label={label} className={cn('scrollbar-none flex gap-1 overflow-x-auto border-b border-border', className)}>
      {items.map((t, i) => {
        const on = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              't-text-strong -mb-px flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 whitespace-nowrap transition-colors',
              on ? 'border-text text-text' : 'border-transparent text-text-muted hover:text-text',
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn('t-mini rounded-full px-1.5 py-px font-semibold tabular-nums', on ? 'bg-primary text-on-primary' : 'bg-surface-muted text-text-muted')}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Compact segmented buttons for a small, exclusive choice (period, view, type). */
export function SegmentedControl<V extends string>({ value, options, onChange, label, size = 'md' }: { value: V; options: { value: V; label: string }[]; onChange: (v: V) => void; label: string; size?: 'sm' | 'md' }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-control border border-border bg-surface-muted p-0.5 scrollbar-none">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              't-label flex shrink-0 grow items-center justify-center rounded-[8px] px-3 whitespace-nowrap transition-colors',
              size === 'sm' ? 'h-7' : 'h-8',
              on ? 'bg-surface text-text shadow-[0_1px_2px_rgba(42,33,23,0.12)]' : 'text-text-muted hover:text-text',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

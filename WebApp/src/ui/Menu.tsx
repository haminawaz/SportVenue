'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { CaretDown, Check, DotsThree } from '@phosphor-icons/react';

import { buttonClass, type ButtonSize, type ButtonVariant } from './Button';
import { cn } from './cn';
import type { IconType } from './icon';

/** Closes a popover on outside click and Escape, and returns focus to its trigger. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  // Focus the selected (or first) item once, when the popover opens.
  useEffect(() => {
    if (!open) return;
    const el = panel.current;
    (el?.querySelector<HTMLElement>('[aria-selected="true"]') ?? el?.querySelector<HTMLElement>('[data-menu-item]'))?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return { open, setOpen, root, trigger, panel };
}

/** Moves focus between menu items with the arrow keys. */
function onListKey(e: KeyboardEvent<HTMLDivElement>) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-menu-item]:not([disabled])'));
  const i = items.indexOf(document.activeElement as HTMLElement);
  const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
  items[next]?.focus();
}

const PANEL = 'absolute z-50 mt-1.5 min-w-[200px] overflow-hidden rounded-card border border-border bg-surface-raised p-1 shadow-raised animate-fade-in';
const ITEM = 't-text flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left outline-none hover:bg-surface-muted focus-visible:bg-surface-muted disabled:opacity-45';

export type MenuAction = { key: string; label: string; icon?: IconType; onSelect: () => void; destructive?: boolean; disabled?: boolean; description?: string };

type MenuProps = {
  label: string;
  actions: (MenuAction | 'divider')[];
  /** Text on the trigger; omit for a "more" (three dots) icon button. */
  triggerLabel?: string;
  triggerIcon?: IconType;
  /** Custom trigger content, for example an avatar. */
  triggerContent?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  align?: 'start' | 'end';
};

/** A button that opens a list of actions (row "more" menus, status changes, user menu). */
export function Menu({ label, actions, triggerLabel, triggerIcon: TriggerIcon, triggerContent, variant = 'secondary', size = 'md', align = 'end' }: MenuProps) {
  const { open, setOpen, root, trigger, panel } = usePopover();
  const id = useId();
  const items = actions.filter((a) => a !== 'divider');
  if (items.length === 0) return null;
  return (
    <div ref={root} className="relative inline-flex">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={label}
        title={triggerLabel ? undefined : label}
        onClick={() => setOpen((o) => !o)}
        className={buttonClass({ variant, size, iconOnly: !triggerLabel })}
      >
        {triggerContent}
        {TriggerIcon && <TriggerIcon size={16} weight="bold" aria-hidden />}
        {triggerLabel ? (
          <>
            <span>{triggerLabel}</span>
            <CaretDown size={13} weight="bold" aria-hidden />
          </>
        ) : (
          !TriggerIcon && !triggerContent && <DotsThree size={20} weight="bold" aria-hidden />
        )}
      </button>
      {open && (
        <div
          id={id}
          role="menu"
          aria-label={label}
          onKeyDown={onListKey}
          className={cn(PANEL, 'top-full', align === 'end' ? 'right-0' : 'left-0')}
          ref={panel}
        >
          {actions.map((a, i) =>
            a === 'divider' ? (
              <div key={`d${i}`} role="separator" className="my-1 h-px bg-border" />
            ) : (
              <button
                key={a.key}
                type="button"
                role="menuitem"
                data-menu-item
                disabled={a.disabled}
                onClick={() => {
                  setOpen(false);
                  a.onSelect();
                }}
                className={cn(ITEM, a.destructive && 'text-danger')}
              >
                {a.icon && <a.icon size={17} aria-hidden className={a.destructive ? 'text-danger' : 'text-text-muted'} />}
                <span className="flex min-w-0 flex-col">
                  <span className="whitespace-nowrap">{a.label}</span>
                  {a.description && <span className="t-mini text-text-muted">{a.description}</span>}
                </span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export type FilterOption<V extends string> = { value: V; label: string; description?: string };

type FilterSelectProps<V extends string> = {
  /** What is being filtered, for example "Court". */
  label: string;
  value: V;
  options: FilterOption<V>[];
  onChange: (v: V) => void;
  icon?: IconType;
  /** Highlight the trigger when the filter is not at its default. */
  active?: boolean;
  /** Text shown on the trigger; defaults to the selected option's label. */
  display?: string;
};

/** A toolbar dropdown for a single-choice filter. */
export function FilterSelect<V extends string>({ label, value, options, onChange, icon: Icon, active, display }: FilterSelectProps<V>) {
  const { open, setOpen, root, trigger, panel } = usePopover();
  const id = useId();
  const selected = options.find((o) => o.value === value);
  return (
    <div ref={root} className="relative inline-flex">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={`${label}: ${display ?? selected?.label ?? ''}`}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          't-label inline-flex h-9 items-center gap-2 rounded-control border px-3 whitespace-nowrap transition-colors',
          active ? 'border-text bg-surface text-text' : 'border-border-strong bg-surface text-text-muted hover:text-text',
        )}
      >
        {Icon && <Icon size={16} aria-hidden />}
        <span className="text-text-subtle">{label}:</span>
        <span className="text-text">{display ?? selected?.label}</span>
        <CaretDown size={13} weight="bold" aria-hidden />
      </button>
      {open && (
        <div id={id} role="listbox" aria-label={label} onKeyDown={onListKey} className={cn(PANEL, 'top-full left-0 max-h-80 overflow-y-auto')} ref={panel}>
          {options.map((o) => {
            const on = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={on}
                data-menu-item
                onClick={() => {
                  setOpen(false);
                  onChange(o.value);
                }}
                className={ITEM}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="whitespace-nowrap">{o.label}</span>
                  {o.description && <span className="t-mini text-text-muted">{o.description}</span>}
                </span>
                {on && <Check size={15} weight="bold" className="text-accent" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type FilterMultiSelectProps<V extends string> = { label: string; value: V[]; options: FilterOption<V>[]; onChange: (v: V[]) => void; allLabel: string };

/** A toolbar dropdown for a multi-choice filter (checkboxes apply immediately). */
export function FilterMultiSelect<V extends string>({ label, value, options, onChange, allLabel }: FilterMultiSelectProps<V>) {
  const { open, setOpen, root, trigger, panel } = usePopover();
  const id = useId();
  const display = value.length === 0 ? allLabel : value.length === 1 ? (options.find((o) => o.value === value[0])?.label ?? '') : `${value.length} selected`;
  return (
    <div ref={root} className="relative inline-flex">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={`${label}: ${display}`}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          't-label inline-flex h-9 items-center gap-2 rounded-control border px-3 whitespace-nowrap transition-colors',
          value.length ? 'border-text bg-surface text-text' : 'border-border-strong bg-surface text-text-muted hover:text-text',
        )}
      >
        <span className="text-text-subtle">{label}:</span>
        <span className="text-text">{display}</span>
        <CaretDown size={13} weight="bold" aria-hidden />
      </button>
      {open && (
        <div id={id} role="listbox" aria-multiselectable aria-label={label} onKeyDown={onListKey} className={cn(PANEL, 'top-full left-0')} ref={panel}>
          {options.map((o) => {
            const on = value.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={on}
                data-menu-item
                onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])}
                className={ITEM}
              >
                <span aria-hidden className={cn('flex h-4 w-4 items-center justify-center rounded-[4px] border', on ? 'border-primary bg-primary text-on-primary' : 'border-border-strong')}>
                  {on && <Check size={11} weight="bold" />}
                </span>
                {o.label}
              </button>
            );
          })}
          {value.length > 0 && (
            <>
              <div role="separator" className="my-1 h-px bg-border" />
              <button type="button" data-menu-item onClick={() => onChange([])} className={cn(ITEM, 'text-text-muted')}>
                Clear selection
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

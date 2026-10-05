'use client';

import { useId, useState, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { CaretUpDown, Eye, EyeSlash, WarningCircle, X } from '@phosphor-icons/react';

import type { CalendarDate } from '@/lib/datetime';

import { AppText } from './AppText';
import { cn } from './cn';
import type { IconType } from './icon';

type FieldShellProps = {
  label: string;
  helper?: string;
  error?: string;
  children: ReactNode;
  optional?: boolean;
  /** The input the label names. */
  htmlFor?: string;
  /** Id for the helper or error text, so the input can reference it with aria-describedby. */
  messageId?: string;
  className?: string;
};

/** Label above, helper or error below. */
export function FieldShell({ label, helper, error, children, optional, htmlFor, messageId, className }: FieldShellProps) {
  const LabelTag = htmlFor ? 'label' : 'span';
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <AppText as={LabelTag} htmlFor={htmlFor} variant="label">
        {label}
        {optional ? (
          <AppText inline variant="mini" tone="subtle" className="ml-1.5">
            Optional
          </AppText>
        ) : null}
      </AppText>
      {children}
      {helper && !error ? (
        <AppText id={messageId} variant="small" tone="muted">
          {helper}
        </AppText>
      ) : null}
      {error ? (
        <div className="flex items-start gap-1.5 text-danger">
          <WarningCircle size={15} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
          <AppText id={messageId} variant="small" tone="danger" role="alert" className="flex-1">
            {error}
          </AppText>
        </div>
      ) : null}
    </div>
  );
}

/** Shared look for text-like controls. */
export const controlClass = (error?: string) =>
  cn(
    'flex min-h-10 w-full items-center gap-2 rounded-control border bg-surface px-3 transition-[border-color,box-shadow]',
    'focus-within:border-text focus-within:ring-3 focus-within:ring-text/10',
    error ? 'border-danger focus-within:border-danger focus-within:ring-danger/15' : 'border-border-strong hover:border-text-subtle',
  );

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  helper?: string;
  error?: string;
  optional?: boolean;
  placeholder?: string;
  /** Fixed text before the input, such as a currency code. */
  prefix?: string;
  suffix?: string;
  /** Decorative icon before the input. */
  icon?: IconType;
  /** Password input with a show/hide toggle. */
  secureTextEntry?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  type?: 'text' | 'email' | 'tel' | 'url' | 'password';
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  enterKeyHint?: InputHTMLAttributes<HTMLInputElement>['enterKeyHint'];
  /** Enter in a single-line field. */
  onSubmitEditing?: () => void;
  className?: string;
};

export function TextField({
  label,
  value,
  onChangeText,
  helper,
  error,
  optional,
  placeholder,
  prefix,
  suffix,
  icon: Icon,
  secureTextEntry,
  multiline,
  rows = 4,
  maxLength,
  type = 'text',
  inputMode,
  autoComplete,
  autoCapitalize,
  enterKeyHint,
  onSubmitEditing,
  className,
}: TextFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const [hidden, setHidden] = useState(!!secureTextEntry);

  const common = {
    id,
    value,
    placeholder,
    maxLength,
    autoComplete,
    autoCapitalize,
    'aria-invalid': !!error || undefined,
    'aria-describedby': helper || error ? helpId : undefined,
    onChange: (e: { target: { value: string } }) => onChangeText(e.target.value),
  };

  return (
    <FieldShell label={label} helper={helper} error={error} optional={optional} htmlFor={id} messageId={helpId} className={className}>
      {multiline ? (
        <div className={cn(controlClass(error), 'items-start py-2')}>
          <textarea {...common} rows={rows} className="t-text min-w-0 flex-1 resize-y bg-transparent text-text outline-none placeholder:text-text-subtle" />
        </div>
      ) : (
        <div className={controlClass(error)}>
          {Icon && <Icon size={17} className="shrink-0 text-text-subtle" aria-hidden />}
          {prefix && (
            <AppText variant="small" tone="muted" aria-hidden className="shrink-0">
              {prefix}
            </AppText>
          )}
          <input
            {...common}
            type={secureTextEntry ? (hidden ? 'password' : 'text') : type}
            inputMode={inputMode}
            enterKeyHint={enterKeyHint}
            spellCheck={type === 'email' || secureTextEntry ? false : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onSubmitEditing) {
                e.preventDefault();
                onSubmitEditing();
              }
            }}
            className="t-text h-10 min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-text-subtle"
          />
          {suffix && (
            <AppText variant="small" tone="muted" aria-hidden className="shrink-0">
              {suffix}
            </AppText>
          )}
          {secureTextEntry && (
            <button type="button" aria-label={hidden ? 'Show password' : 'Hide password'} onClick={() => setHidden((h) => !h)} className="-mr-1 rounded-[6px] p-1 text-text-muted hover:text-text">
              {hidden ? <Eye size={18} /> : <EyeSlash size={18} />}
            </button>
          )}
        </div>
      )}
    </FieldShell>
  );
}

export type Option<V extends string> = { value: V; label: string; description?: string; disabled?: boolean };

type SelectFieldProps<V extends string> = {
  label: string;
  value: V | undefined;
  options: Option<V>[];
  onChange: (v: V) => void;
  placeholder?: string;
  helper?: string;
  error?: string;
  optional?: boolean;
  disabled?: boolean;
  className?: string;
  /** Hide the visible label (still announced); for compact rows such as business hours. */
  hideLabel?: boolean;
};

/** A native select: keyboard type-ahead, the platform picker on touch devices, and full accessibility for free. */
export function SelectField<V extends string>({ label, value, options, onChange, placeholder = 'Choose', helper, error, optional, disabled, className, hideLabel }: SelectFieldProps<V>) {
  const id = useId();
  const helpId = `${id}-help`;
  const known = value !== undefined && options.some((o) => o.value === value);
  const select = (
    <div className={cn(controlClass(error), 'relative p-0', disabled && 'opacity-55')}>
      <select
        id={id}
        value={known ? value : ''}
        disabled={disabled}
        aria-label={hideLabel ? label : undefined}
        aria-invalid={!!error || undefined}
        aria-describedby={helper || error ? helpId : undefined}
        onChange={(e) => onChange(e.target.value as V)}
        className={cn('t-text h-10 w-full min-w-0 cursor-pointer appearance-none bg-transparent pr-9 pl-3 outline-none', known ? 'text-text' : 'text-text-subtle')}
      >
        {!known && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.description ? `${o.label} · ${o.description}` : o.label}
          </option>
        ))}
      </select>
      <CaretUpDown size={15} className="pointer-events-none absolute right-3 text-text-subtle" aria-hidden />
    </div>
  );
  if (hideLabel) return <div className={className}>{select}</div>;
  return (
    <FieldShell label={label} helper={helper} error={error} optional={optional} htmlFor={id} messageId={helpId} className={className}>
      {select}
    </FieldShell>
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
  /** Lets an optional date be cleared. */
  onClear?: () => void;
  className?: string;
};

/** The browser's date input. Values are plain "YYYY-MM-DD" calendar dates, so the device zone never shifts the day. */
export function DateField({ label, value, onChange, minimumDate, maximumDate, helper, error, optional, onClear, className }: DateFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  return (
    <FieldShell label={label} helper={helper} error={error} optional={optional} htmlFor={id} messageId={helpId} className={className}>
      <div className={controlClass(error)}>
        <input
          id={id}
          type="date"
          value={value ?? ''}
          min={minimumDate}
          max={maximumDate}
          aria-invalid={!!error || undefined}
          aria-describedby={helper || error ? helpId : undefined}
          onChange={(e) => (e.target.value ? onChange(e.target.value) : onClear?.())}
          className="t-text h-10 min-w-0 flex-1 bg-transparent text-text outline-none"
        />
        {value && onClear && (
          <button type="button" aria-label={`Clear ${label}`} onClick={onClear} className="rounded-[6px] p-1 text-text-muted hover:text-text">
            <X size={15} />
          </button>
        )}
      </div>
    </FieldShell>
  );
}

type SwitchRowProps = { label: string; description?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean };

/** A labelled on/off switch; the whole row toggles it. */
export function SwitchRow({ label, description, value, onChange, disabled }: SwitchRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn('flex w-full items-center gap-4 py-3 text-left', disabled && 'opacity-50')}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <AppText variant="text-strong">{label}</AppText>
        {description && (
          <AppText variant="small" tone="muted">
            {description}
          </AppText>
        )}
      </span>
      <Switch on={value} />
    </button>
  );
}

/** The visual switch track (decorative; the parent carries the role). */
export function Switch({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={cn('relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors', on ? 'bg-accent' : 'bg-track')}>
      <span className={cn('absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform', on && 'translate-x-4')} />
    </span>
  );
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Weekday toggles for pricing and discounts, as a connected button group. */
export function DayToggles({ value, onChange, label }: { value: number[]; onChange: (v: number[]) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full flex-wrap overflow-hidden rounded-control border border-border-strong">
      {DAY_ORDER.map((d) => {
        const on = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            role="checkbox"
            aria-checked={on}
            aria-label={DAY_LONG[d]}
            onClick={() => onChange(on ? value.filter((x) => x !== d) : [...value, d])}
            className={cn('t-label h-9 min-w-12 flex-1 border-r border-border-strong px-2 last:border-r-0 transition-colors', on ? 'bg-primary text-on-primary' : 'bg-surface text-text-muted hover:bg-surface-muted')}
          >
            {DAY_SHORT[d]}
          </button>
        );
      })}
    </div>
  );
}

/** Toggle buttons for a small set of options (multi or single), for example the courts a discount applies to. */
export function ToggleGroup<V extends string>({ label, options, isOn, onToggle }: { label: string; options: { value: V; label: string }[]; isOn: (v: V) => boolean; onToggle: (v: V) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = isOn(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => onToggle(o.value)}
            className={cn('t-label h-8 rounded-full border px-3 transition-colors', on ? 'border-primary bg-primary text-on-primary' : 'border-border-strong bg-surface text-text-muted hover:text-text')}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

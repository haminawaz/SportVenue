'use client';

import { useMemo, useState } from 'react';
import { Check } from '@phosphor-icons/react';

import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { cn } from './cn';
import { PickerField } from './Fields';
import { SearchBar } from './SearchBar';

export type Option<V extends string> = { value: V; label: string; description?: string; disabled?: boolean };

type OptionSheetProps<V extends string> = {
  visible: boolean;
  title: string;
  options: Option<V>[];
  selected: V[];
  multiple?: boolean;
  searchable?: boolean;
  onClose: () => void;
  onChange: (values: V[]) => void;
};

/** Single select closes on tap. Multi select confirms with a Done button. */
export function OptionSheet<V extends string>({ visible, title, options, selected, multiple, searchable, onClose, onChange }: OptionSheetProps<V>) {
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<V[]>(selected);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const close = () => {
    setQuery('');
    onClose();
  };

  const toggle = (v: V) => {
    if (!multiple) {
      onChange([v]);
      close();
      return;
    }
    setDraft((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));
  };

  const current = multiple ? draft : selected;

  return (
    <BottomSheet visible={visible} title={title} onClose={close} onShow={() => setDraft(selected)}>
      {searchable && (
        <div className="mb-2">
          <SearchBar value={query} onChange={setQuery} placeholder="Search" autoFocus />
        </div>
      )}
      <div role={multiple ? 'group' : 'radiogroup'} aria-label={title} className="flex max-h-[460px] flex-col overflow-y-auto">
        {shown.length === 0 ? (
          <AppText tone="muted" className="p-4 text-center">
            No matches for &ldquo;{query}&rdquo;.
          </AppText>
        ) : (
          shown.map((item) => {
            const on = current.includes(item.value);
            return (
              <button
                key={item.value}
                type="button"
                role={multiple ? 'checkbox' : 'radio'}
                aria-checked={on}
                aria-label={item.description ? `${item.label}, ${item.description}` : item.label}
                disabled={item.disabled}
                data-autofocus={on && !searchable ? true : undefined}
                onClick={() => toggle(item.value)}
                className={cn('flex min-h-[60px] w-full items-center gap-3 rounded-control p-3 text-left transition-colors hover:bg-surface-muted', item.disabled && 'opacity-45 hover:bg-transparent')}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <AppText variant="body-strong">{item.label}</AppText>
                  {item.description && (
                    <AppText variant="body-sm" tone="muted">
                      {item.description}
                    </AppText>
                  )}
                </span>
                {on && <Check size={22} weight="bold" className="shrink-0 text-accent" />}
              </button>
            );
          })
        )}
      </div>
      {multiple && (
        <div className="mt-3 flex gap-2">
          <Button label="Clear" variant="secondary" onPress={() => setDraft([])} />
          <Button
            label="Done"
            block
            onPress={() => {
              onChange(draft);
              close();
            }}
          />
        </div>
      )}
    </BottomSheet>
  );
}

type SelectFieldProps<V extends string> = {
  label: string;
  value: V | undefined;
  options: Option<V>[];
  onChange: (v: V) => void;
  placeholder?: string;
  helper?: string;
  error?: string;
  optional?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  sheetTitle?: string;
};

export function SelectField<V extends string>({ label, value, options, onChange, placeholder = 'Choose', sheetTitle, searchable, ...rest }: SelectFieldProps<V>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <>
      <PickerField label={label} value={selected?.label} placeholder={placeholder} onPress={() => setOpen(true)} {...rest} />
      <OptionSheet
        visible={open}
        title={sheetTitle ?? label}
        options={options}
        selected={value !== undefined ? [value] : []}
        searchable={searchable ?? options.length > 8}
        onClose={() => setOpen(false)}
        onChange={(v) => v[0] !== undefined && onChange(v[0])}
      />
    </>
  );
}

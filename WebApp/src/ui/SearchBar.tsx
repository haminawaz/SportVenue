'use client';

import type { ReactNode } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';

import { cn } from './cn';

type SearchBarProps = { value: string; onChange: (v: string) => void; placeholder: string; label?: string; autoFocus?: boolean; className?: string };

/** Toolbar search input with a clear button. */
export function SearchBar({ value, onChange, placeholder, label, autoFocus, className }: SearchBarProps) {
  return (
    <div role="search" className={cn('flex h-9 min-w-0 items-center gap-2 rounded-control border border-border-strong bg-surface px-3 transition-[border-color,box-shadow] focus-within:border-text focus-within:ring-3 focus-within:ring-text/10', className)}>
      <MagnifyingGlass size={16} className="shrink-0 text-text-subtle" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        enterKeyHint="search"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        data-autofocus={autoFocus || undefined}
        className="t-text min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-text-subtle [&::-webkit-search-cancel-button]:hidden"
      />
      {value.length > 0 && (
        <button type="button" aria-label="Clear search" onClick={() => onChange('')} className="rounded-[6px] p-0.5 text-text-muted hover:text-text">
          <X size={14} weight="bold" />
        </button>
      )}
    </div>
  );
}

/** A row of table/list controls: search first, filters after, actions pushed right. */
export function Toolbar({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center lg:px-5">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

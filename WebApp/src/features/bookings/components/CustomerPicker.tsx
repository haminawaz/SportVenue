'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, UserPlus } from '@phosphor-icons/react';

import { useCustomer, useCustomers } from '@/features/customers/api';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { BottomSheet } from '@/ui/BottomSheet';
import { PickerField } from '@/ui/Fields';
import { SearchBar } from '@/ui/SearchBar';
import { Spinner } from '@/ui/Spinner';

type CustomerPickerProps = {
  value: string | undefined;
  onChange: (customerId: string) => void;
  error?: string;
  disabled?: boolean;
  helper?: string;
  onCreateNew?: () => void;
};

/** Search-as-you-type customer selector, with a shortcut to add someone new. */
export function CustomerPicker({ value, onChange, error, disabled, helper, onCreateNew }: CustomerPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const selected = useCustomer(value ?? '');
  const list = useCustomers({ q: debounced, filter: 'active', sort: 'recent' });
  const items = useMemo(() => list.data?.pages.flatMap((p) => p.items) ?? [], [list.data]);
  const sentinel = useRef<HTMLDivElement>(null);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = list;
  useEffect(() => {
    const el = sentinel.current;
    if (!open || !el || !hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) void fetchNextPage();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);

  return (
    <>
      <PickerField
        label="Customer"
        value={value ? (selected.data ? `${selected.data.name} · ${selected.data.phone}` : 'Loading...') : undefined}
        placeholder="Choose a customer"
        onPress={() => setOpen(true)}
        error={error}
        helper={helper}
        disabled={disabled}
        leading={value && selected.data ? <Avatar name={selected.data.name} size={28} /> : undefined}
      />
      <BottomSheet visible={open} title="Choose a customer" onClose={() => setOpen(false)}>
        <div className="mb-2">
          <SearchBar value={query} onChange={setQuery} placeholder="Search by name or phone" autoFocus />
        </div>
        {onCreateNew && (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onCreateNew();
            }}
            className="flex min-h-[52px] w-full items-center gap-3 rounded-control p-2 text-left transition-colors hover:bg-surface-muted"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
              <UserPlus size={18} aria-hidden />
            </span>
            <AppText variant="body-strong" tone="accent">
              Add a new customer
            </AppText>
          </button>
        )}
        <div role="radiogroup" aria-label="Customers" className="flex max-h-[380px] flex-col overflow-y-auto">
          {items.length === 0 ? (
            list.isPending ? (
              <div className="flex justify-center p-4 text-accent">
                <Spinner label="Loading customers" />
              </div>
            ) : (
              <AppText tone="muted" className="p-4 text-center">
                {debounced ? `No customers match "${debounced}".` : 'No active customers yet.'}
              </AppText>
            )
          ) : (
            items.map((item) => {
              const on = item.id === value;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={`${item.name}, ${item.phone}${item.isRegular ? ', regular' : ''}`}
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className="flex min-h-[52px] w-full items-center gap-3 rounded-control p-2 text-left transition-colors hover:bg-surface-muted"
                >
                  <Avatar name={item.name} size={36} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <AppText variant="body-strong" lines={1}>
                      {item.name}
                    </AppText>
                    <AppText variant="body-sm" tone="muted" lines={1}>
                      {item.phone}
                      {item.isRegular ? ' · Regular' : ''}
                    </AppText>
                  </span>
                  {on && <Check size={18} weight="bold" className="shrink-0 text-accent" />}
                </button>
              );
            })
          )}
          <div ref={sentinel} aria-hidden className="h-px shrink-0" />
        </div>
      </BottomSheet>
    </>
  );
}

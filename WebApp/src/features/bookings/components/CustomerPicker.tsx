'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, UserPlus } from '@phosphor-icons/react';

import { useCustomer, useCustomers } from '@/features/customers/api';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Modal } from '@/ui/Dialogs';
import { FieldShell } from '@/ui/Fields';
import { SearchBar } from '@/ui/SearchBar';
import { Spinner } from '@/ui/Spinner';
import { StatusBadge } from '@/ui/StatusBadge';

type CustomerPickerProps = {
  value: string | undefined;
  onChange: (customerId: string) => void;
  error?: string;
  disabled?: boolean;
  helper?: string;
  onCreateNew?: () => void;
};

/** The chosen customer as a card, with a searchable dialog to choose or change, and a shortcut to add someone new. */
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

  const c = selected.data;

  return (
    <FieldShell label="Customer" error={error} helper={helper}>
      <div className={cn('flex items-center gap-3 rounded-control border bg-surface px-3 py-2.5', error ? 'border-danger' : 'border-border-strong', disabled && 'opacity-60')}>
        {value && c ? (
          <>
            <Avatar name={c.name} size={36} />
            <div className="flex min-w-0 flex-1 flex-col">
              <AppText variant="text-strong" lines={1}>
                {c.name}
              </AppText>
              <AppText variant="small" tone="muted" lines={1}>
                {c.phone}
                {c.email ? ` · ${c.email}` : ''}
              </AppText>
            </div>
            {c.isRegular && <StatusBadge label="Regular" tone="positive" />}
          </>
        ) : (
          <AppText variant="text" tone="subtle" className="flex-1 py-2">
            {value ? 'Loading...' : 'No customer chosen'}
          </AppText>
        )}
        <Button label={value ? 'Change' : 'Choose customer'} aria-label={`Customer: ${c ? `${c.name} · ${c.phone}` : 'not set'}. ${value ? 'Change' : 'Choose'}`} variant="secondary" size="sm" disabled={disabled} onPress={() => setOpen(true)} />
      </div>

      <Modal
        visible={open}
        title="Choose a customer"
        onClose={() => setOpen(false)}
        footer={
          onCreateNew && (
            <Button
              label="Add a new customer"
              icon={UserPlus}
              variant="secondary"
              onPress={() => {
                setOpen(false);
                onCreateNew();
              }}
            />
          )
        }
      >
        <SearchBar value={query} onChange={setQuery} placeholder="Search by name or phone" autoFocus />
        <div role="radiogroup" aria-label="Customers" className="-mx-2 flex max-h-[380px] flex-col overflow-y-auto">
          {items.length === 0 ? (
            list.isPending ? (
              <div className="flex justify-center p-4 text-accent">
                <Spinner label="Loading customers" />
              </div>
            ) : (
              <AppText variant="small" tone="muted" className="p-4 text-center">
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
                  className={cn('flex w-full items-center gap-3 rounded-control px-2 py-2 text-left transition-colors hover:bg-surface-muted', on && 'bg-surface-muted')}
                >
                  <Avatar name={item.name} size={32} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <AppText variant="text-strong" lines={1}>
                      {item.name}
                    </AppText>
                    <AppText variant="small" tone="muted" lines={1}>
                      {item.phone}
                      {item.isRegular ? ' · Regular' : ''}
                    </AppText>
                  </span>
                  {on && <Check size={16} weight="bold" className="shrink-0 text-accent" />}
                </button>
              );
            })
          )}
          <div ref={sentinel} aria-hidden className="h-px shrink-0" />
        </div>
      </Modal>
    </FieldShell>
  );
}

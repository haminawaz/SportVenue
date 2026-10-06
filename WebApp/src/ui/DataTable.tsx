'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';

import { toUserFacingError } from '@/api/errors';
import type { Page } from '@/domain/types';
import { notePush } from '@/navigation/useAppRouter';

import { AppText } from './AppText';
import { Button } from './Button';
import { cn } from './cn';
import { ErrorState } from './ErrorState';
import { Skeleton } from './Skeleton';
import { Spinner } from './Spinner';

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right';
  /** The cell that names the row; it becomes the row's link. */
  primary?: boolean;
  /** Hide on narrower screens so the important columns keep their room. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** Hide the header text (still announced to screen readers). */
  srOnlyHeader?: boolean;
};

const HIDE: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
};

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** Makes each row open this link (the whole row is clickable, and it can open in a new tab). */
  rowHref?: (row: T) => string;
  /** Accessible description of what a row link opens. */
  rowLabel?: (row: T) => string;
  caption: string;
  /** Visually de-emphasise rows, for example cancelled bookings. */
  muted?: (row: T) => boolean;
  dense?: boolean;
};

export function DataTable<T>({ rows, columns, rowKey, rowHref, rowLabel, caption, muted, dense }: DataTableProps<T>) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border bg-surface-muted/50">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn('t-overline h-10 px-3 font-semibold whitespace-nowrap text-text-subtle first:pl-4 last:pr-4 sm:px-4 sm:first:pl-5 sm:last:pr-5', c.align === 'right' && 'text-right', c.hideBelow && HIDE[c.hideBelow], c.className)}
              >
                <span className={c.srOnlyHeader ? 'sr-only' : undefined}>{c.header}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = rowHref?.(row);
            return (
              <tr key={rowKey(row)} className={cn('group relative border-b border-border last:border-b-0', href && 'transition-colors hover:bg-surface-muted/60', muted?.(row) && 'text-text-subtle')}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn('t-text px-3 align-middle first:pl-4 last:pr-4 sm:px-4 sm:first:pl-5 sm:last:pr-5', dense ? 'py-2' : 'py-3', c.align === 'right' && 'text-right tabular-nums', c.hideBelow && HIDE[c.hideBelow], c.primary && 'w-full max-w-0 overflow-hidden', c.className)}
                  >
                    {c.primary && href ? (
                      <Link
                        href={href}
                        onClick={notePush}
                        aria-label={rowLabel?.(row)}
                        className="block min-w-0 outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-[4px] focus-visible:after:outline-2 focus-visible:after:outline-accent"
                      >
                        {c.cell(row)}
                      </Link>
                    ) : (
                      <div className={cn(href && !c.primary && 'relative z-10 [&:not(:has(button,a))]:pointer-events-none')}>{c.cell(row)}</div>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Placeholder rows shaped like a table. */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div role="progressbar" aria-label="Loading" aria-busy>
      <div className="h-10 border-b border-border bg-surface-muted/50" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-6 border-b border-border px-5 py-4 last:border-b-0">
          {Array.from({ length: columns }, (_, j) => (
            <Skeleton key={j} height={14} width={j === 0 ? '22%' : `${10 + ((i + j) % 3) * 4}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

type InfiniteTableProps<T> = Omit<DataTableProps<T>, 'rows'> & {
  query: UseInfiniteQueryResult<InfiniteData<Page<T>>>;
  empty: ReactNode;
  errorTitle?: string;
  /** Count noun, for example "booking". */
  noun: [string, string];
};

/**
 * A server-paged table: skeleton while loading, error with retry, empty
 * state, a "showing x of y" footer, and the next page loading as the end of
 * the table scrolls into view (or with Load more).
 */
export function InfiniteTable<T>({ query, empty, errorTitle = "Couldn't load this list", noun, ...table }: InfiniteTableProps<T>) {
  const rows = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;
  const sentinel = useRef<HTMLDivElement>(null);

  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = query;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage && !isError) void fetchNextPage();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage, rows.length]);

  if (query.isPending) return <TableSkeleton columns={Math.min(table.columns.length, 6)} />;
  if (query.isError && rows.length === 0) {
    const err = toUserFacingError(query.error, errorTitle);
    return (
      <div className="p-6">
        <ErrorState plain title={err.title} message={err.message} onRetry={err.retryable ? () => void query.refetch() : undefined} retrying={query.isFetching} />
      </div>
    );
  }
  if (rows.length === 0) return <div className="p-6">{empty}</div>;

  return (
    <div className={cn('transition-opacity', query.isFetching && !query.isFetchingNextPage && 'opacity-70')}>
      <DataTable rows={rows} {...table} />
      <div ref={sentinel} aria-hidden className="h-px" />
      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
        <AppText variant="small" tone="muted" numeric>
          Showing {rows.length} of {total} {total === 1 ? noun[0] : noun[1]}
        </AppText>
        {query.isFetchingNextPage ? (
          <span className="text-accent">
            <Spinner size={18} label="Loading more" />
          </span>
        ) : hasNextPage ? (
          <Button size="sm" variant="secondary" label="Load more" onPress={() => void fetchNextPage()} />
        ) : null}
      </div>
    </div>
  );
}

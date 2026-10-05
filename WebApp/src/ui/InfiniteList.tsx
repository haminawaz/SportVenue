'use client';

import { useEffect, useMemo, useRef, type ReactElement, type ReactNode } from 'react';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';

import { toUserFacingError } from '@/api/errors';
import type { Page } from '@/domain/types';

import { AppText } from './AppText';
import { Button } from './Button';
import { ErrorState } from './ErrorState';
import { PinnedTitle } from './LargeTitle';
import { useRegisterRefresh } from './Refresh';
import { Spinner } from './Spinner';
import { ListSkeleton } from './States';

type InfiniteListProps<T> = {
  query: UseInfiniteQueryResult<InfiniteData<Page<T>>>;
  renderItem: (info: { item: T; index: number }) => ReactNode;
  keyExtractor: (item: T) => string;
  /** Content above the list (title, search, filters). Scrolls with the list. */
  header?: ReactElement;
  empty: ReactNode;
  skeleton?: ReactNode;
  errorTitle?: string;
  /** Tab screens: a large title pinned above the list. */
  title?: string;
  titleActions?: ReactNode;
};

/**
 * Paged list with refresh, skeleton, error, empty and "loading more" states.
 * The next page loads as the end of the list scrolls into view. Rows sit on
 * one elevated surface.
 */
export function InfiniteList<T>({ query, renderItem, keyExtractor, header, empty, skeleton, errorTitle = "Couldn't load this list", title, titleActions }: InfiniteListProps<T>) {
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.total;
  const sentinel = useRef<HTMLDivElement>(null);

  useRegisterRefresh(() => query.refetch());

  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = query;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage && !isError) void fetchNextPage();
      },
      { rootMargin: '0px 0px 40% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage, items.length]);

  let body: ReactNode = null;
  if (query.isPending) body = skeleton ?? <ListSkeleton />;
  else if (query.isError && items.length === 0) {
    const err = toUserFacingError(query.error, errorTitle);
    body = <ErrorState title={err.title} message={err.message} onRetry={err.retryable ? () => void query.refetch() : undefined} retrying={query.isFetching} />;
  } else if (items.length === 0) body = empty;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      {title && <PinnedTitle title={title} actions={titleActions} />}
      <div className={`mx-auto flex w-full max-w-[720px] flex-col px-5 pb-10 ${title ? 'pt-2' : 'pt-4'}`}>
        <div className="mb-3 flex flex-col gap-5">
          {header}
          {body}
          {!body && total !== undefined && total > 0 && (
            <AppText variant="body-sm" tone="muted" numeric className="-mb-2 px-0.5">
              {total === 1 ? '1 result' : `${total} results`}
            </AppText>
          )}
        </div>
        {!body && (
          <ul className="surface-card overflow-hidden">
            {items.map((item, index) => (
              <li key={keyExtractor(item)} className="list-none">
                {index > 0 && <div aria-hidden className="ml-5 h-px bg-border" />}
                {renderItem({ item, index })}
              </li>
            ))}
          </ul>
        )}
        <div ref={sentinel} aria-hidden className="h-px" />
        {query.isFetchingNextPage ? (
          <div className="flex justify-center py-5 text-accent">
            <Spinner label="Loading more" />
          </div>
        ) : query.isFetchNextPageError ? (
          <div className="flex justify-center py-5">
            <Button label="Load more" variant="secondary" onPress={() => void query.fetchNextPage()} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

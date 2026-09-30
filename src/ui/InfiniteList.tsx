import { useCallback, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View, type ListRenderItem } from 'react-native';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toUserFacingError } from '@/api/errors';
import type { Page } from '@/domain/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { Button } from './Button';
import { ErrorState } from './ErrorState';
import { MAX_CONTENT } from './Screen';
import { ListSkeleton } from './States';
import { GUTTER } from './surface';

type InfiniteListProps<T> = {
  query: UseInfiniteQueryResult<InfiniteData<Page<T>>>;
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  /** Content above the list (title, search, filters). Scrolls with the list. */
  header?: ReactElement;
  empty: ReactNode;
  skeleton?: ReactNode;
  errorTitle?: string;
  topInset?: boolean;
};

/**
 * Paged list with pull-to-refresh, skeleton, error, empty and
 * "loading more" states. Rows sit on one elevated surface.
 */
export function InfiniteList<T>({ query, renderItem, keyExtractor, header, empty, skeleton, errorTitle = "Couldn't load this list", topInset }: InfiniteListProps<T>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [pulling, setPulling] = useState(false);
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.total;

  const onRefresh = useCallback(async () => {
    setPulling(true);
    try {
      await query.refetch();
    } finally {
      setPulling(false);
    }
  }, [query]);

  const onEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage && !query.isError) void query.fetchNextPage();
  }, [query]);

  let body: ReactNode = null;
  if (query.isPending) body = skeleton ?? <ListSkeleton />;
  else if (query.isError && items.length === 0) {
    const err = toUserFacingError(query.error, errorTitle);
    body = <ErrorState title={err.title} message={err.message} onRetry={err.retryable ? () => query.refetch() : undefined} retrying={query.isFetching} />;
  } else if (items.length === 0) body = empty;

  const last = items.length - 1;
  const renderRow: ListRenderItem<T> = (info) => (
    <View
      style={[
        styles.cell,
        { backgroundColor: colors.surface, borderColor: colors.border },
        styles.sides,
        info.index === 0 && styles.first,
        info.index === last && styles.last,
      ]}
    >
      {info.index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
      {renderItem(info)}
    </View>
  );

  return (
    <FlatList
      data={body ? [] : items}
      renderItem={renderRow}
      keyExtractor={keyExtractor}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: (topInset ? insets.top : 0) + spacing.lg,
        paddingBottom: insets.bottom + spacing.huge,
        paddingLeft: insets.left + GUTTER,
        paddingRight: insets.right + GUTTER,
        width: '100%',
        maxWidth: MAX_CONTENT + GUTTER * 2,
        alignSelf: 'center',
      }}
      ListHeaderComponent={
        <View style={styles.header}>
          {header}
          {body}
          {!body && total !== undefined && total > 0 && (
            <AppText variant="body-sm" tone="muted" numeric style={styles.count}>
              {total === 1 ? '1 result' : `${total} results`}
            </AppText>
          )}
        </View>
      }
      ListFooterComponent={
        <>
          {query.isFetchingNextPage ? (
            <ActivityIndicator style={styles.more} color={colors.accent} accessibilityLabel="Loading more" />
          ) : query.isFetchNextPageError ? (
            <View style={styles.more}>
              <Button label="Load more" variant="secondary" onPress={() => void query.fetchNextPage()} />
            </View>
          ) : null}
        </>
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={pulling} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} progressBackgroundColor={colors.surface} />}
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xl, marginBottom: spacing.md },
  count: { paddingHorizontal: spacing.xxs, marginBottom: -spacing.sm },
  cell: { overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth * 2, marginLeft: spacing.xl },
  sides: { borderLeftWidth: StyleSheet.hairlineWidth * 2, borderRightWidth: StyleSheet.hairlineWidth * 2 },
  first: { borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card, borderTopWidth: StyleSheet.hairlineWidth * 2 },
  last: { borderBottomLeftRadius: radius.card, borderBottomRightRadius: radius.card, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  more: { paddingVertical: spacing.xl, alignItems: 'center' },
});

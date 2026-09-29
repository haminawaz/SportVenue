import type { ComponentType, ReactElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { UseQueryResult } from '@tanstack/react-query';
import { Info, WarningCircle, type IconProps } from 'phosphor-react-native';

import { toUserFacingError } from '@/api/errors';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { ErrorState } from './ErrorState';
import { Skeleton } from './Skeleton';
import { useSurface } from './surface';

/** Placeholder rows shaped like a list. */
export function ListSkeleton({ rows = 6, withAvatar = true }: { rows?: number; withAvatar?: boolean }) {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <View accessible role="progressbar" aria-label="Loading" aria-busy style={[surface, styles.group]}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
          {withAvatar && <Skeleton width={44} height={44} radius={radius.full} />}
          <View style={styles.flex}>
            <Skeleton width="55%" height={17} />
            <Skeleton width="80%" height={15} />
          </View>
          <Skeleton width={64} height={17} />
        </View>
      ))}
    </View>
  );
}

/** Placeholder for a detail screen: header block, tiles, then a group. */
export function DetailSkeleton() {
  const surface = useSurface();
  return (
    <View accessible role="progressbar" aria-label="Loading" aria-busy style={styles.detail}>
      <View style={[surface, styles.card]}>
        <Skeleton width="45%" height={26} />
        <Skeleton width="70%" height={17} />
        <Skeleton width="35%" height={17} />
      </View>
      <View style={styles.tiles}>
        {[0, 1].map((i) => (
          <View key={i} style={[surface, styles.card, styles.flex]}>
            <Skeleton width="60%" height={15} />
            <Skeleton width="80%" height={28} />
          </View>
        ))}
      </View>
      <ListSkeleton rows={3} withAvatar={false} />
    </View>
  );
}

type QueryViewProps<T> = {
  query: Pick<UseQueryResult<T>, 'data' | 'isPending' | 'isError' | 'error' | 'refetch' | 'isFetching'>;
  skeleton?: ReactNode;
  errorTitle?: string;
  children: (data: T) => ReactElement;
};

/** Handles pending and error states for a single query so screens only render data. */
export function QueryView<T>({ query, skeleton = <DetailSkeleton />, errorTitle = "Couldn't load this", children }: QueryViewProps<T>) {
  if (query.isPending) return <>{skeleton}</>;
  if (query.isError || query.data === undefined) {
    const err = toUserFacingError(query.error, errorTitle);
    return <ErrorState title={err.title} message={err.message} onRetry={err.retryable ? () => query.refetch() : undefined} retrying={query.isFetching} />;
  }
  return children(query.data);
}

type NoticeProps = { tone?: 'info' | 'warning' | 'danger'; title?: string; message: string; icon?: ComponentType<IconProps>; action?: ReactNode };

/** Inline, in-context message (for example "This court is in maintenance"). */
export function Notice({ tone = 'info', title, message, icon, action }: NoticeProps) {
  const { colors } = useTheme();
  const map = {
    info: { bg: colors.accentSoft, fg: colors.accent },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  }[tone];
  const Icon = icon ?? (tone === 'info' ? Info : WarningCircle);
  return (
    <View style={[styles.notice, { backgroundColor: map.bg }]} role={tone === 'info' ? undefined : 'alert'}>
      <Icon size={24} color={map.fg} weight={tone === 'info' ? 'regular' : 'fill'} />
      <View style={styles.flex}>
        {title && <AppText variant="bodyStrong">{title}</AppText>}
        <AppText variant={title ? 'caption' : 'body'} tone={title ? 'muted' : 'default'}>
          {message}
        </AppText>
        {action && <View style={styles.noticeAction}>{action}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.xl },
  flex: { flex: 1, gap: spacing.xs },
  detail: { gap: spacing.xl },
  card: { padding: spacing.xl, gap: spacing.md },
  tiles: { flexDirection: 'row', gap: spacing.md },
  notice: { flexDirection: 'row', gap: spacing.md, borderRadius: radius.card, padding: spacing.lg, alignItems: 'flex-start' },
  noticeAction: { marginTop: spacing.sm },
});

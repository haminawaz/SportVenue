import type { ReactElement, ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Info, WarningCircle } from '@phosphor-icons/react';

import { toUserFacingError } from '@/api/errors';

import { AppText } from './AppText';
import { cn } from './cn';
import { ErrorState } from './ErrorState';
import type { IconType } from './icon';
import { Skeleton } from './Skeleton';

/** Placeholder for a detail screen: header, a stat row, then main and side cards. */
export function DetailSkeleton() {
  return (
    <div role="progressbar" aria-label="Loading" aria-busy className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton width={180} height={14} />
        <Skeleton width={320} height={30} />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="surface-card flex flex-col gap-3 p-5">
            <Skeleton width="50%" height={12} />
            <Skeleton width="70%" height={26} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="surface-card flex flex-col gap-4 p-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={14} width={`${90 - i * 10}%`} />
          ))}
        </div>
        <div className="surface-card flex flex-col gap-4 p-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={14} width={`${80 - i * 15}%`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Placeholder rows for a card body. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="progressbar" aria-label="Loading" aria-busy className="flex flex-col">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0">
          <Skeleton width="35%" height={14} />
          <Skeleton width="25%" height={12} />
          <Skeleton width={56} height={14} style={{ marginLeft: 'auto' }} />
        </div>
      ))}
    </div>
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
    return <ErrorState title={err.title} message={err.message} onRetry={err.retryable ? () => void query.refetch() : undefined} retrying={query.isFetching} />;
  }
  return children(query.data);
}

type NoticeProps = { tone?: 'info' | 'warning' | 'danger'; title?: string; message: string; icon?: IconType; action?: ReactNode };

const NOTICE = {
  info: 'border-accent/25 bg-accent-soft text-accent',
  warning: 'border-warning/25 bg-warning-soft text-warning',
  danger: 'border-danger/25 bg-danger-soft text-danger',
};

/** Inline, in-context message (for example "This court is in maintenance"). */
export function Notice({ tone = 'info', title, message, icon, action }: NoticeProps) {
  const Icon = icon ?? (tone === 'info' ? Info : WarningCircle);
  return (
    <div role={tone === 'info' ? undefined : 'alert'} className={cn('flex items-start gap-3 rounded-card border px-4 py-3', NOTICE[tone])}>
      <Icon size={18} weight={tone === 'info' ? 'regular' : 'fill'} className="mt-px shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title && <AppText variant="text-strong">{title}</AppText>}
        <AppText variant={title ? 'small' : 'text'} tone={title ? 'muted' : 'default'}>
          {message}
        </AppText>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Key/value facts in two columns (label left, value right), for detail cards. */
export function DescriptionList({ items, className }: { items: ({ label: string; value: ReactNode; hidden?: boolean } | false | null | undefined)[]; className?: string }) {
  return (
    <dl className={cn('flex flex-col', className)}>
      {items.filter((i): i is { label: string; value: ReactNode; hidden?: boolean } => !!i && !i.hidden).map((i) => (
        <div key={i.label} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
          <dt className="t-small shrink-0 text-text-muted">{i.label}</dt>
          <dd className="t-text min-w-0 text-right text-text">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

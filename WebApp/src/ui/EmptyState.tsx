import type { ReactNode } from 'react';

import { AppText } from './AppText';
import { cn } from './cn';
import type { IconType } from './icon';

type EmptyStateProps = {
  icon: IconType;
  title: string;
  message?: string;
  action?: ReactNode;
  /** Compact sits inline in a card section; the default fills a card or table body. */
  compact?: boolean;
  /** Draw its own dashed frame (when it is not already inside a card). */
  framed?: boolean;
};

export function EmptyState({ icon: Icon, title, message, action, compact, framed }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-1.5 px-4 py-6' : 'gap-2 px-6 py-12',
        framed && 'rounded-card border border-dashed border-border-strong bg-surface/50',
      )}
    >
      <span className={cn('mb-1 flex items-center justify-center rounded-full bg-surface-muted text-text-muted', compact ? 'h-9 w-9' : 'h-12 w-12')}>
        <Icon size={compact ? 18 : 22} aria-hidden />
      </span>
      <AppText variant="text-strong">{title}</AppText>
      {message && (
        <AppText variant="small" tone="muted" className="max-w-[420px]">
          {message}
        </AppText>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

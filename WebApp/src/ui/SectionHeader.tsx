import type { ReactNode } from 'react';
import { CaretRight } from '@phosphor-icons/react';

import { AppText } from './AppText';

type SectionHeaderProps = {
  title: string;
  count?: number;
  action?: ReactNode;
  /** Text link on the right, for example "See all". */
  linkLabel?: string;
  onLink?: () => void;
};

export function SectionHeader({ title, count, action, linkLabel = 'See all', onLink }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
      <div className="flex min-w-0 shrink items-center gap-2">
        <AppText as="h2" variant="display-sm" lines={2} className="shrink">
          {title}
        </AppText>
        {count !== undefined && count > 0 && (
          <span className="min-w-[26px] rounded-full bg-surface-muted px-2 py-0.5 text-center">
            <AppText variant="caption-uppercase" tone="muted" numeric>
              {count}
            </AppText>
          </span>
        )}
      </div>
      {action}
      {onLink && (
        <button
          type="button"
          aria-label={`${linkLabel}: ${title}`}
          onClick={onLink}
          className="flex min-h-11 shrink-0 items-center gap-1 text-accent hover:underline active:opacity-60"
        >
          <AppText variant="body-strong" className="text-current">
            {linkLabel}
          </AppText>
          <CaretRight size={16} weight="bold" />
        </button>
      )}
    </div>
  );
}

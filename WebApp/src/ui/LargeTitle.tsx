'use client';

import { useEffect, type ReactNode } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';

import { AppText } from './AppText';
import { cn } from './cn';
import { IconButton } from './IconButton';
import { RefreshButton } from './Refresh';
import { useScrolled } from './useScrolled';

/** Names the browser tab after the current screen. */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · SportVenue` : 'SportVenue';
  }, [title]);
}

/** Title block for tab screens (which have no stack header). */
export function LargeTitle({ title, subtitle, actions, onBack }: { title: string; subtitle?: string; actions?: ReactNode; onBack?: () => void }) {
  return (
    <div className="flex min-h-11 items-center gap-3">
      {onBack && <IconButton icon={ArrowLeft} label="Back" onPress={onBack} variant="filled" size="sm" />}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {subtitle && (
          <AppText variant="nav-link" tone="muted" lines={1}>
            {subtitle}
          </AppText>
        )}
        <AppText as="h1" variant="display-xl" lines={1}>
          {title}
        </AppText>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

type PinnedTitleProps = {
  title: string;
  actions?: ReactNode;
  /** Pushed screens with a pinned title show a back button before it. */
  onBack?: () => void;
};

/**
 * The large title, pinned above a tab screen's scrolling content. It keeps the
 * page background so content slides underneath, and shows a hairline once the
 * content has scrolled.
 */
export function PinnedTitle({ title, actions, onBack }: PinnedTitleProps) {
  const scrolled = useScrolled();
  useDocumentTitle(title);
  return (
    <div
      className={cn(
        'sticky top-0 z-30 border-b bg-background px-5 pt-[calc(env(safe-area-inset-top)+8px)] pb-3 transition-colors',
        scrolled ? 'border-border' : 'border-transparent',
      )}
    >
      <div className="mx-auto w-full max-w-[720px]">
        <LargeTitle
          title={title}
          onBack={onBack}
          actions={
            <>
              <RefreshButton />
              {actions}
            </>
          }
        />
      </div>
    </div>
  );
}

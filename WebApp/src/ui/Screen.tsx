'use client';

import type { ReactNode } from 'react';

import { cn } from './cn';
import { PinnedTitle } from './LargeTitle';
import { useRegisterRefresh } from './Refresh';
import { GUTTER, MAX_CONTENT } from './surface';

export { GUTTER, MAX_CONTENT };

type ScreenProps = {
  children: ReactNode;
  /** Refresh action (the web stand-in for pull-to-refresh). Shown as a Refresh button in the header. */
  onRefresh?: () => Promise<unknown> | void;
  /** Sticky bottom bar (form submit, primary actions). */
  footer?: ReactNode;
  className?: string;
  /** Tab screens: a large title pinned above the scrolling content. */
  title?: string;
  titleActions?: ReactNode;
  /** Pushed screens using a pinned title (and no stack header). */
  onBack?: () => void;
  /** Forms: a form element so Enter submits and browsers offer autofill. */
  onSubmit?: () => void;
};

/**
 * A scrolling page: a centred column (720px measure) with the 20px gutter,
 * sections spaced 32px apart, and an optional sticky footer for actions.
 */
export function Screen({ children, onRefresh, footer, className, title, titleActions, onBack, onSubmit }: ScreenProps) {
  useRegisterRefresh(onRefresh);

  const content = (
    <>
      <div className={cn('mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-8 px-5', title ? 'pt-2' : 'pt-4', footer ? 'pb-6' : 'pb-10', className)}>{children}</div>
      {footer && <StickyFooter>{footer}</StickyFooter>}
    </>
  );

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      {title && <PinnedTitle title={title} actions={titleActions} onBack={onBack} />}
      {onSubmit ? (
        <form
          noValidate
          className="flex flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {content}
        </form>
      ) : (
        content
      )}
    </div>
  );
}

export function StickyFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-surface px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-[720px] gap-2">{children}</div>
    </div>
  );
}

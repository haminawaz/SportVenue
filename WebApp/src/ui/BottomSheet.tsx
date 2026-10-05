'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

import { AppText } from './AppText';
import { Portal, useModalBehavior } from './Overlay';

type BottomSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** Runs each time the sheet opens. */
  onShow?: () => void;
  children: ReactNode;
};

/**
 * A sheet that rises from the bottom on phones. On wider screens the same
 * content opens as a centred dialog, which is easier to reach with a mouse.
 */
export function BottomSheet({ visible, title, onClose, onShow, children }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModalBehavior(visible, panelRef, onClose);

  const onShowRef = useRef(onShow);
  useEffect(() => {
    onShowRef.current = onShow;
  });
  useEffect(() => {
    if (visible) onShowRef.current?.();
  }, [visible]);

  if (!visible) return null;

  return (
    <Portal>
      <div data-overlay className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
        <button type="button" aria-label="Close" tabIndex={-1} className="absolute inset-0 animate-fade-in bg-backdrop" onClick={onClose} />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="relative flex max-h-[88dvh] w-full max-w-[640px] animate-sheet-in flex-col rounded-t-hero bg-surface px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] outline-none sm:max-h-[min(88dvh,760px)] sm:max-w-[520px] sm:animate-pop-in sm:rounded-hero sm:pt-6 sm:pb-6"
        >
          <span aria-hidden className="mx-auto mb-3 block h-[5px] w-11 shrink-0 rounded-full bg-border sm:hidden" />
          <AppText as="h2" id={titleId} variant="title-md" className="mb-4 shrink-0">
            {title}
          </AppText>
          <div className="-mx-1 flex min-h-0 flex-col overflow-y-auto overscroll-contain px-1">{children}</div>
        </div>
      </div>
    </Portal>
  );
}

'use client';

import { useEffect, useRef, useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openCount = 0;

/** Locks page scroll while any overlay is open (nested overlays share one lock). */
function lockScroll() {
  openCount += 1;
  if (openCount === 1) document.documentElement.style.overflow = 'hidden';
  return () => {
    openCount -= 1;
    if (openCount === 0) document.documentElement.style.overflow = '';
  };
}

const noopSubscribe = () => () => {};

/** True once mounted in the browser (portals need document.body). */
export function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Shared modal behaviour for sheets and dialogs, standing in for React
 * Native's Modal: renders into document.body, closes on Escape, keeps Tab
 * focus inside, locks page scroll, and returns focus to the opener on close.
 */
export function useModalBehavior(visible: boolean, panelRef: RefObject<HTMLElement | null>, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!visible) return;
    const opener = document.activeElement as HTMLElement | null;
    const unlock = lockScroll();
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (!panelRef.current) return;
      // Only the topmost overlay reacts.
      const overlays = document.querySelectorAll('[data-overlay]');
      if (overlays[overlays.length - 1] !== panelRef.current.closest('[data-overlay]')) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (items.length === 0) return;
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstItem) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && document.activeElement === lastItem) {
          e.preventDefault();
          firstItem.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      unlock();
      opener?.focus?.({ preventScroll: true });
    };
  }, [visible, panelRef]);
}

export function Portal({ children }: { children: ReactNode }) {
  const client = useIsClient();
  return client ? createPortal(children, document.body) : null;
}

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { routes, type Href } from './routes';

/**
 * In-app history depth. A native stack always knows whether there is a screen
 * to go back to; a browser tab may have been opened straight on a deep link.
 * Pushes increase the depth, back (in-app or the browser button) lowers it, and
 * "back" with nothing in-app to return to goes to a sensible parent instead of
 * leaving the app. Kept in sessionStorage so a reload keeps the stack.
 */
const KEY = 'sportvenue.navDepth';
let depth: number | null = null;

function readDepth() {
  if (depth !== null) return depth;
  try {
    depth = Number(window.sessionStorage.getItem(KEY)) || 0;
  } catch {
    depth = 0;
  }
  return depth;
}

function writeDepth(next: number) {
  depth = Math.max(0, next);
  try {
    window.sessionStorage.setItem(KEY, String(depth));
  } catch {
    // Storage blocked: depth lives for this page load only.
  }
}

let listening = false;
function listenForBrowserBack() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('popstate', () => writeDepth(readDepth() - 1));
}

/** For plain <Link> navigations (tab bar, sidebar): they push history like router.push. */
export function notePush() {
  listenForBrowserBack();
  writeDepth(readDepth() + 1);
}

export function canGoBack() {
  return typeof window !== 'undefined' && readDepth() > 0;
}

export type AppRouter = {
  push: (href: Href) => void;
  replace: (href: Href) => void;
  /** Pops the stack, or goes to `fallback` (Home by default) when the app was opened here. */
  back: (fallback?: Href) => void;
  canGoBack: () => boolean;
};

export function useAppRouter(): AppRouter {
  const router = useRouter();
  return useMemo(() => {
    listenForBrowserBack();
    return {
      push: (href) => {
        writeDepth(readDepth() + 1);
        router.push(href);
      },
      replace: (href) => router.replace(href),
      back: (fallback = routes.home) => {
        if (readDepth() > 0) {
          // popstate lowers the depth once the browser has gone back.
          router.back();
        } else {
          router.replace(fallback);
        }
      },
      canGoBack,
    };
  }, [router]);
}

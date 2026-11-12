'use client';

import { useSyncExternalStore } from 'react';

/** Where the main navigation sits on desktop: a sidebar on the left, or a bar across the top. */
export type NavLayout = 'side' | 'top';

export const NAV_LAYOUT_KEY = 'sportvenue.navLayout';

const listeners = new Set<() => void>();
let current: NavLayout | null = null;

function read(): NavLayout {
  try {
    return window.localStorage.getItem(NAV_LAYOUT_KEY) === 'top' ? 'top' : 'side';
  } catch {
    return 'side';
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab changed it.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== NAV_LAYOUT_KEY) return;
    current = read();
    onChange();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

function setNavLayout(layout: NavLayout) {
  current = layout;
  try {
    window.localStorage.setItem(NAV_LAYOUT_KEY, layout);
  } catch {
    // Storage blocked: the choice lasts until the page reloads.
  }
  listeners.forEach((l) => l());
}

/**
 * The owner's navigation layout, remembered in this browser (a convenience
 * only: without storage it is the sidebar). The server always renders the sidebar.
 */
export function useNavLayout(): [NavLayout, (layout: NavLayout) => void] {
  const layout = useSyncExternalStore<NavLayout>(
    subscribe,
    () => (current ??= read()),
    () => 'side',
  );
  return [layout, setNavLayout];
}

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowClockwise } from '@phosphor-icons/react';

import { Button } from './Button';

/**
 * Manual refresh for the current screen (the mobile app's pull-to-refresh).
 * A screen registers what "refresh" means (its refetches); the page header
 * shows a Refresh button that runs it and spins until the data is back. Data
 * also refetches on its own when the browser tab regains focus.
 */
type Handler = () => Promise<unknown> | void;
type Registry = { handler: Handler | null; set: (h: Handler | null) => void };

const RefreshContext = createContext<Registry | null>(null);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [handler, setHandler] = useState<Handler | null>(null);
  const set = useCallback((h: Handler | null) => setHandler(() => h), []);
  const value = useMemo(() => ({ handler, set }), [handler, set]);
  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}

/** Registers the current screen's refresh action while it is mounted. */
export function useRegisterRefresh(onRefresh: Handler | undefined) {
  const registry = useContext(RefreshContext);
  const latest = useRef(onRefresh);
  useEffect(() => {
    latest.current = onRefresh;
  });
  const has = !!onRefresh;
  const set = registry?.set;
  useEffect(() => {
    if (!set || !has) return;
    set(() => latest.current?.());
    return () => set(null);
  }, [set, has]);
}

/** Runs a refresh handler (the screen's registered one unless given), spinning until it settles. */
export function RefreshButton({ onRefresh }: { onRefresh?: Handler }) {
  const registry = useContext(RefreshContext);
  const handler = onRefresh ?? registry?.handler;
  const [busy, setBusy] = useState(false);
  if (!handler) return null;
  return (
    <Button
      label="Refresh"
      iconOnly
      variant="secondary"
      icon={ArrowClockwise}
      loading={busy}
      onPress={async () => {
        setBusy(true);
        try {
          await handler();
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

'use client';

import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';
import { WifiSlash } from '@phosphor-icons/react';

import { AppText } from './AppText';

/**
 * Floating pill while offline. Cached data stays on screen underneath.
 * TanStack Query follows the browser's online/offline events, so queries
 * pause while offline and refetch on reconnect.
 */
export function OfflineBanner() {
  const online = useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    () => true,
  );

  if (online) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(4px,env(safe-area-inset-top))] z-[100] flex justify-center px-4">
      <div role="alert" className="flex items-center gap-2 rounded-full bg-text px-4 py-2 text-background shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
        <WifiSlash size={20} aria-hidden />
        <AppText variant="body-strong" className="text-current">
          You’re offline. Showing saved data.
        </AppText>
      </div>
    </div>
  );
}

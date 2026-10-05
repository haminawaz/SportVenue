'use client';

import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { createQueryClient } from '@/api/queryClient';
import { SessionProvider } from '@/session/SessionProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { OfflineBanner } from '@/ui/OfflineBanner';
import { ToastProvider } from '@/ui/Toast';

/** App-wide providers, in the same order as the mobile root layout. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <SessionProvider>
            {children}
            <OfflineBanner />
          </SessionProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

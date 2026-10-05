'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { routes } from '@/navigation/routes';
import { useAuth } from '@/session/SessionProvider';
import { Spinner } from '@/ui/Spinner';

/**
 * Route protection, standing in for Expo Router's Stack.Protected: signed-in
 * screens need a session, and signed-out screens (the marketing page, log in,
 * get started) are only for visitors. Anyone on the wrong side is sent to the
 * other side's first screen.
 */
export function AuthGate({ require, children }: { require: 'signedIn' | 'signedOut'; children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const allowed = status === require;

  useEffect(() => {
    if (status === 'loading' || allowed) return;
    router.replace(require === 'signedIn' ? routes.welcome : routes.home);
  }, [status, allowed, require, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-dvh flex-1 items-center justify-center bg-background text-accent">
        <Spinner size={28} label="Loading" />
      </div>
    );
  }
  return <>{children}</>;
}

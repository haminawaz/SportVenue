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
 *
 * The session is only known in the browser, so the server always renders the
 * "loading" state. Signed-out screens render straight away in that state, so
 * their prerendered HTML carries the real page for visitors and crawlers; an
 * owner who turns out to be signed in is then sent on to the dashboard.
 * Signed-in screens wait for the session.
 */
export function AuthGate({ require, children }: { require: 'signedIn' | 'signedOut'; children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const wrongSide = status !== 'loading' && status !== require;

  useEffect(() => {
    if (wrongSide) router.replace(require === 'signedIn' ? routes.welcome : routes.home);
  }, [wrongSide, require, router]);

  const show = status === require || (status === 'loading' && require === 'signedOut');
  if (!show) {
    return (
      <div className="flex min-h-dvh flex-1 items-center justify-center bg-background text-accent">
        <Spinner size={28} label="Loading" />
      </div>
    );
  }
  return <>{children}</>;
}

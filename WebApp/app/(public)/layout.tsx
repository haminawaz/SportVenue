import { Suspense } from 'react';

import { AuthGate } from '@/app-shell/AuthGate';

/** Signed-out visitors: the marketing page, log in and get started. */
export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return (
    <AuthGate require="signedOut">
      <Suspense fallback={null}>{children}</Suspense>
    </AuthGate>
  );
}

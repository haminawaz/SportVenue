import { Suspense } from 'react';

import { AppShell } from '@/app-shell/AppShell';
import { AuthGate } from '@/app-shell/AuthGate';
import { Spinner } from '@/ui/Spinner';

/** Signed-in area: the tabs at the root, every detail and form pushed on top. */
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <AuthGate require="signedIn">
      <AppShell>
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center text-accent">
              <Spinner size={28} label="Loading" />
            </div>
          }
        >
          {children}
        </Suspense>
      </AppShell>
    </AuthGate>
  );
}

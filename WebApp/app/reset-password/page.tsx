import { Suspense } from 'react';
import type { Metadata } from 'next';

import { ResetPasswordScreen } from '@/features/marketing/screens/ResetPasswordScreen';

/** Reset links carry a private token: never index them. */
export const metadata: Metadata = {
  title: 'Set a new password',
  robots: { index: false, follow: false },
};

/**
 * Opened from the emailed link. Lives outside the signed-out group on purpose:
 * an owner who is still signed in on this browser can use the link too (the
 * reset signs every session out, this one included).
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordScreen />
    </Suspense>
  );
}

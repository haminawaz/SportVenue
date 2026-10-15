import { Suspense } from 'react';

import { ResetPasswordScreen } from '@/features/marketing/screens/ResetPasswordScreen';

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

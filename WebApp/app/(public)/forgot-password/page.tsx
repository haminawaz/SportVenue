import type { Metadata } from 'next';

import { ForgotPasswordScreen } from '@/features/marketing/screens/ForgotPasswordScreen';

export const metadata: Metadata = {
  title: 'Reset your password',
  description: 'Get a link to set a new password for your SportVenue owner account.',
  alternates: { canonical: '/forgot-password' },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <ForgotPasswordScreen />;
}

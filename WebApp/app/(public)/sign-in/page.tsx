import type { Metadata } from 'next';

import { SignInScreen } from '@/features/marketing/screens/SignInScreen';

export const metadata: Metadata = {
  title: 'Owner login',
  description: 'Log in to SportVenue to see today’s bookings, payments and courts in one place.',
  alternates: { canonical: '/sign-in' },
};

export default function Page() {
  return <SignInScreen />;
}

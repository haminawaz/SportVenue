import type { Metadata } from 'next';

import { OPEN_GRAPH_BASE, TWITTER_BASE } from '@/config/site';
import { SignInScreen } from '@/features/marketing/screens/SignInScreen';

const DESCRIPTION = 'Log in to SportVenue to see today’s bookings, payments and courts in one place.';

export const metadata: Metadata = {
  title: 'Owner login',
  description: DESCRIPTION,
  alternates: { canonical: '/sign-in' },
  openGraph: { ...OPEN_GRAPH_BASE, title: 'Owner login · SportVenue', description: DESCRIPTION, url: '/sign-in' },
  twitter: { ...TWITTER_BASE, title: 'Owner login · SportVenue', description: DESCRIPTION },
};

export default function Page() {
  return <SignInScreen />;
}

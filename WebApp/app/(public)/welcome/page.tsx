import type { Metadata } from 'next';

import { SITE_DESCRIPTION, SITE_NAME } from '@/config/site';
import { LandingScreen } from '@/features/marketing/screens/LandingScreen';

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME}: the back office for your sports facility` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/welcome' },
  openGraph: { title: `${SITE_NAME}: the back office for your sports facility`, description: SITE_DESCRIPTION, url: '/welcome' },
};

export default function Page() {
  return <LandingScreen />;
}

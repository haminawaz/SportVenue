import type { Metadata } from 'next';

import { FacilityDashboardScreen } from '@/features/dashboard/FacilityDashboardScreen';

/**
 * "/" is the most-linked address, and signed-out visitors (crawlers included)
 * are sent on to /welcome from here. Keep it out of search results like the
 * rest of the app, but let crawlers follow it to the landing page.
 */
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function Page() {
  return <FacilityDashboardScreen />;
}

import type { Metadata } from 'next';

import { RequestDemoScreen } from '@/features/marketing/screens/RequestDemoScreen';

/** One canonical address for the form, whichever intent (?intent=demo, ?intent=quote) opened it. */
export const metadata: Metadata = {
  title: 'Get started',
  description: 'Tell us about your facility and we set up SportVenue with you, book a demo, or get a quote for your number of courts.',
  alternates: { canonical: '/request-demo' },
};

export default function Page() {
  return <RequestDemoScreen />;
}

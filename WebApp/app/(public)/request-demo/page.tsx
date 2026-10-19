import { Suspense } from 'react';
import type { Metadata } from 'next';

import { OPEN_GRAPH_BASE, TWITTER_BASE } from '@/config/site';
import { RequestDemoForm, RequestDemoScreen } from '@/features/marketing/screens/RequestDemoScreen';

const DESCRIPTION = 'Tell us about your facility and we set up SportVenue with you, book a demo, or get a quote for your number of courts.';

/** One canonical address for the form, whichever intent (?intent=demo, ?intent=quote) opened it. */
export const metadata: Metadata = {
  title: 'Get started',
  description: DESCRIPTION,
  alternates: { canonical: '/request-demo' },
  openGraph: { ...OPEN_GRAPH_BASE, title: 'Get started with SportVenue', description: DESCRIPTION, url: '/request-demo' },
  twitter: { ...TWITTER_BASE, title: 'Get started with SportVenue', description: DESCRIPTION },
};

export default function Page() {
  return (
    // The prerendered HTML shows the canonical ("start") form; the browser then applies ?intent=.
    <Suspense fallback={<RequestDemoForm intent="start" />}>
      <RequestDemoScreen />
    </Suspense>
  );
}

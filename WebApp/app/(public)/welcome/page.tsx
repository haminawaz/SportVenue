import type { Metadata } from 'next';

import { OPEN_GRAPH_BASE, SITE_DESCRIPTION, SITE_NAME, SITE_URL, TWITTER_BASE } from '@/config/site';
import { LandingScreen } from '@/features/marketing/screens/LandingScreen';

const TITLE = `${SITE_NAME}: the back office for your sports facility`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/welcome' },
  openGraph: { ...OPEN_GRAPH_BASE, title: TITLE, description: SITE_DESCRIPTION, url: '/welcome' },
  twitter: { ...TWITTER_BASE, title: TITLE, description: SITE_DESCRIPTION },
};

/**
 * Organization and WebSite structured data. Only facts the site already
 * states (name, address, logo, description); it needs absolute URLs, so it is
 * left out until the site's address is known (see config/site.ts).
 */
function structuredData() {
  if (!SITE_URL) return null;
  const home = new URL('/welcome', SITE_URL).toString();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL.origin}/#organization`,
        name: SITE_NAME,
        url: home,
        logo: new URL('/brand/mark.png', SITE_URL).toString(),
        description: SITE_DESCRIPTION,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL.origin}/#website`,
        name: SITE_NAME,
        url: home,
        publisher: { '@id': `${SITE_URL.origin}/#organization` },
      },
    ],
  };
}

export default function Page() {
  const jsonLd = structuredData();
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // Escape "<" so the JSON can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      <LandingScreen />
    </>
  );
}

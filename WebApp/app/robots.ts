import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/config/site';

/**
 * Crawlers may read the public pages (landing, get started, log in). The
 * signed-in app is private and also marked noindex page by page; listing its
 * areas here keeps crawlers from spending time on screens that need a session.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/welcome', '/request-demo', '/sign-in'],
      disallow: [
        '/booking',
        '/bookings',
        '/court',
        '/courts',
        '/customer',
        '/customers',
        '/payments',
        '/pricing',
        '/facility',
        '/opportunities',
        '/notifications',
        '/settings',
        '/more',
        '/reset-password',
      ],
    },
    ...(SITE_URL ? { sitemap: new URL('/sitemap.xml', SITE_URL).toString(), host: SITE_URL.origin } : {}),
  };
}

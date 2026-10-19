import type { Metadata } from 'next';

/**
 * Public site details for metadata, robots.txt and the sitemap.
 *
 * The site's own address is not hard-coded: set NEXT_PUBLIC_SITE_URL (for
 * example in the Vercel project settings) to the production domain. On Vercel
 * the production domain Vercel assigns is used when that variable is unset.
 * Without either, canonical links stay relative and the sitemap is left empty
 * rather than pointing at a made-up host.
 */

function fromEnv(): URL | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

export const SITE_URL: URL | null = fromEnv();

export const SITE_NAME = 'SportVenue';

/** The marketing description used across the public pages (the landing page's own copy). */
export const SITE_DESCRIPTION = 'Bookings, payments and customers for every court, in one place. Built for padel, tennis, futsal and squash venues.';

/** Public, indexable pages, for the sitemap. */
export const PUBLIC_PATHS = ['/welcome', '/request-demo', '/sign-in', '/privacy', '/terms', '/cookies'] as const;

/** The share image (app/opengraph-image.png, 1200x630) and its alt text (app/opengraph-image.alt.txt). */
const SHARE_IMAGE = {
  url: '/opengraph-image.png',
  width: 1200,
  height: 630,
  alt: 'SportVenue: the back office for your sports facility. The SportVenue dashboard for a padel club.',
};

/**
 * Open Graph and Twitter fields every page shares. Metadata merges shallowly,
 * so a page that sets its own `openGraph` or `twitter` replaces the layout's
 * whole object, share image included: spread these in first.
 */
export const OPEN_GRAPH_BASE = { type: 'website', siteName: SITE_NAME, locale: 'en_US', images: [SHARE_IMAGE] } satisfies Metadata['openGraph'];
export const TWITTER_BASE = { card: 'summary_large_image', images: [SHARE_IMAGE] } satisfies Metadata['twitter'];

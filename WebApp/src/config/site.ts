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
export const PUBLIC_PATHS = ['/welcome', '/request-demo', '/sign-in'] as const;

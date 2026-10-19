import type { MetadataRoute } from 'next';

import { PUBLIC_PATHS, SITE_URL } from '@/config/site';

const LEGAL = new Set<string>(['/privacy', '/terms', '/cookies']);

/** The public pages. Empty until the site's address is known (see config/site.ts), since sitemap entries must be absolute URLs. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  if (!base) return [];
  return PUBLIC_PATHS.map((path) => ({
    url: new URL(path, base).toString(),
    changeFrequency: LEGAL.has(path) ? 'yearly' : 'monthly',
    priority: path === '/welcome' ? 1 : LEGAL.has(path) ? 0.3 : 0.6,
  }));
}

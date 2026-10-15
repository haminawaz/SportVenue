import type { MetadataRoute } from 'next';

import { PUBLIC_PATHS, SITE_URL } from '@/config/site';

/** The public pages. Empty until the site's address is known (see config/site.ts), since sitemap entries must be absolute URLs. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  if (!base) return [];
  return PUBLIC_PATHS.map((path) => ({
    url: new URL(path, base).toString(),
    changeFrequency: 'monthly',
    priority: path === '/welcome' ? 1 : 0.6,
  }));
}

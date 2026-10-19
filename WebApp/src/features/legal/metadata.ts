import type { Metadata } from 'next';

import { OPEN_GRAPH_BASE, SITE_NAME, TWITTER_BASE } from '@/config/site';

import { LEGAL_DOCUMENTS, type LegalSlug } from './content';

/** Page metadata for a legal document: title, description, canonical address and share card. */
export function legalMetadata(slug: LegalSlug): Metadata {
  const doc = LEGAL_DOCUMENTS[slug];
  const title = `${doc.title} · ${SITE_NAME}`;
  return {
    title: doc.title,
    description: doc.description,
    alternates: { canonical: `/${slug}` },
    openGraph: { ...OPEN_GRAPH_BASE, title, description: doc.description, url: `/${slug}` },
    twitter: { ...TWITTER_BASE, title, description: doc.description },
  };
}

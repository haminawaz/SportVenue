import { LEGAL } from '@/config/legal';

import { LEGAL_DETAILS_PENDING, LEGAL_DOCUMENTS, parseInline, type LegalBlock } from '../content';

/** Every string in a document, including list items and table cells. */
function strings(blocks: LegalBlock[]): string[] {
  return blocks.flatMap((b) => {
    if (typeof b === 'string') return [b];
    if ('list' in b) return b.list;
    if ('table' in b) return [...b.table.head, ...b.table.rows.flat()];
    return [];
  });
}

const allText = Object.values(LEGAL_DOCUMENTS).flatMap((d) => d.sections.flatMap((s) => strings(s.blocks)));

describe('parseInline', () => {
  it('splits bold, links and pending markers from plain text', () => {
    expect(parseInline('**When** you see [our policy](/privacy) or {{postal address}}.')).toEqual([
      { kind: 'strong', text: 'When' },
      { kind: 'text', text: ' you see ' },
      { kind: 'link', text: 'our policy', href: '/privacy' },
      { kind: 'text', text: ' or ' },
      { kind: 'pending', text: 'postal address' },
      { kind: 'text', text: '.' },
    ]);
  });
});

describe('legal documents', () => {
  it('has unique section ids in each document', () => {
    for (const doc of Object.values(LEGAL_DOCUMENTS)) {
      const ids = doc.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('only links to pages that exist, or to email and https addresses', () => {
    const known = ['/privacy', '/terms', '/cookies'];
    const links = allText.flatMap(parseInline).flatMap((p) => (p.kind === 'link' ? [p.href] : []));
    expect(links.length).toBeGreaterThan(0);
    for (const href of links) expect(known.includes(href) || href.startsWith('https://') || href.startsWith('mailto:')).toBe(true);
  });

  it('never prints undefined or leftover markup', () => {
    for (const text of allText) {
      expect(text).not.toMatch(/undefined|null/);
      const rendered = parseInline(text).map((p) => p.text).join('');
      expect(rendered).not.toMatch(/\*\*|\{\{|\}\}|\]\(/);
    }
  });

  it('marks operator details as pending instead of inventing them', () => {
    expect(LEGAL_DETAILS_PENDING).toBe(!LEGAL.operatorName || !LEGAL.operatorAddress || !LEGAL.contactEmail || !LEGAL.governingLaw);
    if (!LEGAL.contactEmail) {
      const pending = allText.flatMap(parseInline).filter((p) => p.kind === 'pending');
      expect(pending.map((p) => p.text)).toContain('privacy contact email');
    }
  });
});

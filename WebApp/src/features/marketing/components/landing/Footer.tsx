'use client';

import Link from 'next/link';

import { CookieSettingsButton } from '@/features/legal/CookieSettingsButton';
import { routes } from '@/navigation/routes';
import { notePush } from '@/navigation/useAppRouter';
import { cn } from '@/ui/cn';

import { BrandMark } from '../BrandMark';

import { COLUMN, useLandingScroll, type LandingLinks, type SectionId } from './LandingScroll';

/** A section of this page (smooth-scrolled) or another page (a plain link). */
type FooterLink = { label: string } & ({ section: SectionId } | { href: string });

const LINK_CLASS = 'flex min-h-9 items-center t-body-sm text-text-muted transition-colors hover:text-text';

/** Footer with only links that work today: page sections, account actions and the legal pages. */
export function Footer({ links }: { links: LandingLinks }) {
  const { scrollTo } = useLandingScroll();

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: 'Product',
      links: [
        { label: 'Product tour', section: 'features' },
        { label: 'How it works', section: 'how' },
        { label: 'For owners', section: 'owners' },
        { label: 'Pricing', section: 'pricing' },
      ],
    },
    {
      title: 'Get in touch',
      links: [
        { label: 'Get started', href: links.getStarted },
        { label: 'Book a demo', href: links.bookDemo },
        { label: 'Get a quote', href: links.getQuote },
        { label: 'Log in', href: links.login },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: routes.privacy },
        { label: 'Terms and Conditions', href: routes.terms },
        { label: 'Cookie Policy', href: routes.cookies },
      ],
    },
  ];

  return (
    // Extra bottom room keeps the floating cookie badge clear of the last line.
    <footer className="border-t border-border pt-14 pb-[calc(env(safe-area-inset-bottom)+84px)]">
      <div className={cn(COLUMN, 'flex flex-col gap-12')}>
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex flex-col gap-3">
            <a href="#top" aria-label="SportVenue, back to top" onClick={(e) => (e.preventDefault(), window.scrollTo({ top: 0, behavior: 'smooth' }))} className="self-start rounded-control">
              <BrandMark size={30} />
            </a>
            <p className="max-w-[300px] t-body-sm text-text-muted">Bookings, payments and customers for sports facility owners.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-14 lg:gap-20">
            {columns.map((c) => (
              <nav key={c.title} aria-label={c.title} className="flex flex-col gap-1">
                <h2 className="pb-2 t-label text-text-subtle">{c.title}</h2>
                {c.links.map((l) =>
                  'section' in l ? (
                    <a
                      key={l.label}
                      href={`#${l.section}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollTo(l.section);
                      }}
                      className={LINK_CLASS}
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link key={l.label} href={l.href} onClick={notePush} className={LINK_CLASS}>
                      {l.label}
                    </Link>
                  ),
                )}
                {c.title === 'Legal' && <CookieSettingsButton asLink className={LINK_CLASS} />}
              </nav>
            ))}
          </div>
        </div>
        {/* Prerendered at build time: the year can differ from the visitor's clock. */}
        <p suppressHydrationWarning className="border-t border-border pt-6 t-caption text-text-subtle">
          © {new Date().getFullYear()} SportVenue
        </p>
      </div>
    </footer>
  );
}

'use client';

import { cn } from '@/ui/cn';

import { BrandMark } from '../BrandMark';

import { COLUMN, useLandingScroll, type SectionId } from './LandingScroll';

type Link = { label: string; onPress: () => void; href: string };

type FooterProps = { onLogin: () => void; onGetStarted: () => void; onBookDemo: () => void; onGetQuote: () => void };

/**
 * Footer with only links that work today: page sections and account actions.
 * Company and legal columns join once those pages exist.
 */
export function Footer({ onLogin, onGetStarted, onBookDemo, onGetQuote }: FooterProps) {
  const { scrollTo } = useLandingScroll();
  const to = (id: SectionId): Link['onPress'] => () => scrollTo(id);

  const columns: { title: string; links: Link[] }[] = [
    {
      title: 'Product',
      links: [
        { label: 'Product tour', onPress: to('features'), href: '#features' },
        { label: 'How it works', onPress: to('how'), href: '#how' },
        { label: 'For owners', onPress: to('owners'), href: '#owners' },
        { label: 'Pricing', onPress: to('pricing'), href: '#pricing' },
      ],
    },
    {
      title: 'Get in touch',
      links: [
        { label: 'Get started', onPress: onGetStarted, href: '/request-demo' },
        { label: 'Book a demo', onPress: onBookDemo, href: '/request-demo?intent=demo' },
        { label: 'Get a quote', onPress: onGetQuote, href: '/request-demo?intent=quote' },
        { label: 'Log in', onPress: onLogin, href: '/sign-in' },
      ],
    },
  ];

  return (
    <footer className="border-t border-border pt-14 pb-[calc(env(safe-area-inset-bottom)+28px)]">
      <div className={cn(COLUMN, 'flex flex-col gap-12')}>
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex flex-col gap-3">
            <BrandMark size={30} />
            <p className="max-w-[300px] t-body-sm text-text-muted">Bookings, payments and customers for sports facility owners.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:gap-20">
            {columns.map((c) => (
              <nav key={c.title} aria-label={c.title} className="flex flex-col gap-1">
                <h2 className="pb-2 t-label text-text-subtle">{c.title}</h2>
                {c.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={(e) => {
                      e.preventDefault();
                      l.onPress();
                    }}
                    className="flex min-h-9 items-center t-body-sm text-text-muted transition-colors hover:text-text"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
            ))}
          </div>
        </div>
        <p className="border-t border-border pt-6 t-caption text-text-subtle">© {new Date().getFullYear()} SportVenue</p>
      </div>
    </footer>
  );
}

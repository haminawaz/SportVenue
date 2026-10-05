'use client';

import { AppText } from '@/ui/AppText';

import { BrandMark } from '../BrandMark';

import { useLandingScroll, type SectionId } from './LandingScroll';

type Link = { label: string; onPress: () => void; href: string };

type FooterProps = { onLogin: () => void; onGetStarted: () => void; onBookDemo: () => void };

/**
 * Raised footer with only links that work today: page sections and account
 * actions. Company and legal columns join once those pages exist.
 */
export function Footer({ onLogin, onGetStarted, onBookDemo }: FooterProps) {
  const { scrollTo } = useLandingScroll();
  const to = (id: SectionId): Link['onPress'] => () => scrollTo(id);

  const columns: { title: string; links: Link[] }[] = [
    {
      title: 'Product',
      links: [
        { label: 'Features', onPress: to('features'), href: '#features' },
        { label: 'How it works', onPress: to('how'), href: '#how' },
        { label: 'For facility owners', onPress: to('owners'), href: '#owners' },
        { label: 'Pricing', onPress: to('pricing'), href: '#pricing' },
      ],
    },
    {
      title: 'Get in touch',
      links: [
        { label: 'Get started', onPress: onGetStarted, href: '/request-demo' },
        { label: 'Book a demo', onPress: onBookDemo, href: '/request-demo?intent=demo' },
        { label: 'Log in', onPress: onLogin, href: '/sign-in' },
      ],
    },
  ];

  return (
    <footer className="mt-20 border-t border-border bg-surface-raised px-5 pt-12 pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-8">
        <div className="flex flex-col gap-8 min-[600px]:flex-row min-[600px]:justify-between">
          <div className="flex flex-col gap-3">
            <BrandMark size={32} />
            <AppText as="p" tone="muted" variant="body-md" className="max-w-[260px]">
              Software for sports facility owners.
            </AppText>
          </div>
          <div className="flex flex-wrap gap-10 min-[600px]:gap-[72px]">
            {columns.map((c) => (
              <nav key={c.title} aria-label={c.title} className="flex min-w-[140px] flex-col gap-1">
                <AppText as="h2" variant="caption-uppercase" tone="muted">
                  {c.title}
                </AppText>
                {c.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={(e) => {
                      e.preventDefault();
                      l.onPress();
                    }}
                    className="flex min-h-11 items-center hover:underline active:opacity-60"
                  >
                    <AppText variant="body-md">{l.label}</AppText>
                  </a>
                ))}
              </nav>
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-5">
          <AppText variant="body-sm" tone="muted">
            © 2026 SportVenue
          </AppText>
        </div>
      </div>
    </footer>
  );
}

'use client';

import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';

import { BrandMark } from '../BrandMark';

import { COLUMN, useLandingScroll, type SectionId } from './LandingScroll';

/** Height of the sticky header (sections use scroll-mt-16 to clear it). */
export const NAV_HEIGHT = 64;

const LINKS: { id: SectionId; label: string }[] = [
  { id: 'features', label: 'Product' },
  { id: 'how', label: 'How it works' },
  { id: 'owners', label: 'For owners' },
  { id: 'pricing', label: 'Pricing' },
];

type NavProps = { onLogin: () => void; onGetStarted: () => void };

/** Sticky header: brand, section links (desktop), log in and the one sign-up action. */
export function Nav({ onLogin, onGetStarted }: NavProps) {
  const { scrollTo } = useLandingScroll();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <nav aria-label="Main" className={cn(COLUMN, 'flex items-center justify-between gap-4')} style={{ height: NAV_HEIGHT }}>
        <a href="#top" aria-label="SportVenue, back to top" onClick={(e) => (e.preventDefault(), window.scrollTo({ top: 0, behavior: 'smooth' }))} className="rounded-control">
          <BrandMark size={30} />
        </a>
        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(l.id);
                }}
                className="flex h-9 items-center rounded-control px-3 t-text-strong text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Button label="Log in" variant="ghost" size="md" onPress={onLogin} />
          <Button label="Get started" variant="accent" size="md" onPress={onGetStarted} className="hidden sm:inline-flex" />
        </div>
      </nav>
    </header>
  );
}

'use client';

import { useState } from 'react';
import { List, X } from '@phosphor-icons/react';

import { notePush } from '@/navigation/useAppRouter';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Drawer } from '@/ui/Dialogs';

import { BrandMark } from '../BrandMark';

import { COLUMN, useLandingScroll, type LandingLinks, type SectionId } from './LandingScroll';

/** Height of the sticky header (sections use scroll-mt-16 to clear it). */
export const NAV_HEIGHT = 64;

const LINKS: { id: SectionId; label: string }[] = [
  { id: 'features', label: 'Product' },
  { id: 'how', label: 'How it works' },
  { id: 'owners', label: 'For owners' },
  { id: 'pricing', label: 'Pricing' },
];

const MENU_ID = 'landing-menu';

type NavProps = { links: LandingLinks };

/**
 * Sticky header: brand, section links, log in and the one sign-up action.
 * Below 1024px the section links move into a menu (a focus-trapped drawer that
 * closes on Escape and hands focus back to the menu button).
 */
export function Nav({ links }: NavProps) {
  const { scrollTo } = useLandingScroll();
  const [open, setOpen] = useState(false);
  const leave = () => {
    setOpen(false);
    notePush();
  };

  // Close first, then scroll once the drawer has released the page's scroll lock.
  const go = (id: SectionId) => {
    setOpen(false);
    requestAnimationFrame(() => requestAnimationFrame(() => scrollTo(id)));
  };

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
          <Button label="Log in" variant="ghost" size="md" href={links.login} onPress={notePush} />
          <Button label="Get started" variant="accent" size="md" href={links.getStarted} onPress={notePush} className="hidden sm:inline-flex" />
          <button
            type="button"
            aria-label="Menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? MENU_ID : undefined}
            onClick={() => setOpen(true)}
            className="-mr-1 inline-flex h-10 w-10 items-center justify-center rounded-control text-text hover:bg-surface-muted lg:hidden"
          >
            <List size={22} weight="bold" aria-hidden />
          </button>
        </div>
      </nav>

      <Drawer visible={open} title="Menu" side="right" onClose={() => setOpen(false)}>
        <div id={MENU_ID} className="flex h-full flex-col pt-[env(safe-area-inset-top)]">
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <BrandMark size={26} />
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-control text-text hover:bg-surface-muted">
              <X size={20} weight="bold" aria-hidden />
            </button>
          </div>
          <nav aria-label="Sections" className="flex flex-col p-3">
            {LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(l.id);
                }}
                className="flex min-h-12 items-center rounded-control px-3 t-body-strong text-text hover:bg-surface-muted"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2 border-t border-border p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
            <Button label="Get started" variant="accent" size="lg" block href={links.getStarted} onPress={leave} />
            <Button label="Log in" variant="secondary" size="lg" block href={links.login} onPress={leave} />
          </div>
        </div>
      </Drawer>
    </header>
  );
}

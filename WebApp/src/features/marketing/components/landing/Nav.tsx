'use client';

import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { useScrolled } from '@/ui/useScrolled';

import { BrandMark } from '../BrandMark';

import { useLandingScroll, type SectionId } from './LandingScroll';

const PILL_HEIGHT = 60;
const PILL_TOP = 8;
/** Space the header takes at the top of the page, below the safe area. */
export const NAV_HEIGHT = PILL_HEIGHT + PILL_TOP;
/** Scroll distance after which the frosted header appears. */
const SOLID_AT = 12;

const LINKS: { id: SectionId; label: string }[] = [
  { id: 'features', label: 'Features' },
  { id: 'how', label: 'How it works' },
  { id: 'owners', label: 'For facility owners' },
  { id: 'pricing', label: 'Pricing' },
];

type NavProps = { onLogin: () => void; onGetStarted: () => void };

/**
 * Sticky header. Transparent over the hero; once the page scrolls, the top
 * strip (down to the middle of the header) turns into a frosted band and the
 * header sits on a frosted pill rounded at both ends.
 */
export function Nav({ onLogin, onGetStarted }: NavProps) {
  const { scrollTo } = useLandingScroll();
  const scrolled = useScrolled(SOLID_AT);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-[calc(env(safe-area-inset-top)+8px)]">
      {/* Full-width frosted band from the top of the screen to the pill's middle. */}
      <div
        aria-hidden
        className={cn('absolute inset-x-0 top-0 transition-opacity duration-300', scrolled ? 'bg-glass-band opacity-100 backdrop-blur-md' : 'opacity-0')}
        style={{ height: `calc(env(safe-area-inset-top) + ${PILL_TOP + PILL_HEIGHT / 2}px)` }}
      />
      <nav
        aria-label="Main"
        className={cn(
          'pointer-events-auto relative mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 rounded-full border pr-2.5 pl-3 transition-[background-color,border-color] duration-300',
          scrolled ? 'border-border bg-glass backdrop-blur-xl' : 'border-transparent',
        )}
        style={{ height: PILL_HEIGHT }}
      >
        <BrandMark size={32} />
        <ul className="hidden items-center gap-6 lg:flex">
          {LINKS.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(l.id);
                }}
                className="flex min-h-11 items-center hover:underline active:opacity-60"
              >
                <AppText variant="nav-link">{l.label}</AppText>
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1.5">
          <Button label="Log in" size="sm" onPress={onLogin} className="self-center" />
          <Button label="Get started" variant="accent" size="sm" onPress={onGetStarted} className="hidden self-center sm:inline-flex" />
        </div>
      </nav>
    </header>
  );
}

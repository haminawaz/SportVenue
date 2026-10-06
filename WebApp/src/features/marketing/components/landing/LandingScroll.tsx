'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/ui/cn';
import { useReducedMotion } from '@/ui/useReducedMotion';

export type SectionId = 'features' | 'how' | 'owners' | 'pricing';

type LandingScrollApi = {
  /** Scroll the page so a section sits just below the sticky header. */
  scrollTo: (id: SectionId) => void;
};

const LandingScrollContext = createContext<LandingScrollApi | null>(null);

export function LandingScrollProvider({ value, children }: { value: LandingScrollApi; children: ReactNode }) {
  return <LandingScrollContext.Provider value={value}>{children}</LandingScrollContext.Provider>;
}

export function useLandingScroll() {
  const v = useContext(LandingScrollContext);
  if (!v) throw new Error('useLandingScroll must be used inside <LandingScrollProvider>');
  return v;
}

/** Shared page column: the hero, every section and the footer line up on it. */
export const COLUMN = 'mx-auto w-full max-w-[1200px] px-5 lg:px-8';

/** Sections reveal when their top passes this share of the screen height. */
const REVEAL_AT = 0.88;

type SectionProps = {
  id?: SectionId;
  children: ReactNode;
  /** Inner column classes. */
  className?: string;
  /** Outer band classes (backgrounds and borders that run edge to edge). */
  bandClassName?: string;
};

/**
 * One landing-page section: a band with the shared column inside, which fades
 * up once the first time it scrolls into view. Static under reduced motion.
 * `scroll-mt-16` keeps anchored sections clear of the sticky header.
 */
export function Section({ id, children, className, bandClassName }: SectionProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: `0px 0px -${Math.round((1 - REVEAL_AT) * 100)}% 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  const visible = shown || reduced;

  return (
    <section ref={ref} id={id} className={cn('scroll-mt-16 py-20 lg:py-28', bandClassName)}>
      <div
        className={cn(
          COLUMN,
          'flex flex-col transition-[opacity,transform] duration-500 ease-out',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** Section headline on the marketing scale. */
export function SectionTitle({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h2 id={id} className={cn('max-w-[22ch] font-display text-[32px] leading-[1.08] font-normal tracking-[-0.02em] text-balance text-text sm:text-[40px] lg:text-[46px]', className)}>
      {children}
    </h2>
  );
}

/** Body copy under a section headline. */
export function Lede({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('max-w-[58ch] text-[17px] leading-[1.6] text-pretty text-text-muted', className)}>{children}</p>;
}

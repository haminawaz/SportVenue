'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/ui/cn';
import { useReducedMotion } from '@/ui/useReducedMotion';

export type SectionId = 'features' | 'how' | 'owners' | 'pricing';

type LandingScrollApi = {
  /** Scroll the page so a section sits just below the header. */
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

/** Sections reveal when their top passes this share of the screen height. */
const REVEAL_AT = 0.88;

type SectionProps = {
  id?: SectionId;
  children: ReactNode;
  /** Inner content classes (the max-width column). */
  className?: string;
  /** Outer band classes (backgrounds that bleed edge to edge). */
  bandClassName?: string;
  tight?: boolean;
};

/**
 * One landing-page section: a centred column that fades up once, the first
 * time it scrolls into view (400ms, ease-out, no bounce). Static under
 * reduced motion.
 */
export function Section({ id, children, className, bandClassName, tight }: SectionProps) {
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
    <section ref={ref} id={id} className={cn('px-5', tight ? 'pt-10' : 'pt-20', bandClassName)}>
      <div
        className={cn(
          'mx-auto flex w-full max-w-[1160px] flex-col gap-6 transition-[opacity,transform] duration-[400ms] ease-out',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}

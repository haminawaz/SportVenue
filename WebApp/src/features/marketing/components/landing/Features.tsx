'use client';

import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent } from 'react';

import { cn } from '@/ui/cn';
import { useReducedMotion } from '@/ui/useReducedMotion';

import { Lede, Section, SectionTitle } from './LandingScroll';
import { ProductShot, SHOT_FRAME, type ShotName } from './ProductShot';

type Feature = { key: ShotName; tab: string; title: string; body: string; alt: string };

/** One tab per job an owner does, each shown with the real screen that does it. */
const FEATURES: Feature[] = [
  {
    key: 'schedule',
    tab: 'Bookings',
    title: 'Every court on one calendar',
    body: 'See the whole day across all your courts. Booked hours, free slots, maintenance and closed times are all visible at once, and a free slot is one click from a new booking.',
    alt: 'The day schedule: five courts side by side with booked hours, free slots and closed courts.',
  },
  {
    key: 'payments',
    tab: 'Payments',
    title: 'Know exactly who owes you',
    body: 'Every unpaid booking with the customer, the court and how long it has been due. Record cash, card or bank transfer payments against the booking in a few clicks.',
    alt: 'The payments screen listing unpaid bookings, the amount owed and a Record button on each row.',
  },
  {
    key: 'customers',
    tab: 'Customers',
    title: 'A record for every regular',
    body: 'Phone numbers, booking history, total paid and open balance for each customer. Filter to your regulars or to everyone who still owes money.',
    alt: 'The customers table with contact details, number of bookings and balances.',
  },
  {
    key: 'pricing',
    tab: 'Pricing',
    title: 'Peak rates and discounts, set once',
    body: 'A base rate per court, time-based rates for evenings and weekends, and discounts as a percentage or fixed amount, with or without a code. Every booking is priced from these rules.',
    alt: 'The pricing screen with base rates per court, time-based rates and discounts.',
  },
  {
    key: 'analytics',
    tab: 'Analytics',
    title: 'See which hours make money',
    body: 'Revenue, bookings and utilization by court and by hour, for any period, compared with the period before.',
    alt: 'The dashboard report: peak and off-peak hours by weekday, court utilization, customers and outstanding payments.',
  },
];

const SHOT_SIZES = '(min-width: 1200px) 824px, (min-width: 1024px) 66vw, 100vw';

/** How long each point stays open before the tour moves on. */
const SLIDE_MS = 5000;

/**
 * Product tour. Desktop: the points run down the left with each job's
 * description, the screen sits on the right. Phones and tablets: a scrolling
 * tab row, the screen, then the description.
 *
 * Autoplay: every 5 seconds the next point opens. A line beside the active
 * point (under it on phones) fills from top to bottom as the time runs. Then
 * the screens swap like a vertical carousel: the old one slides up and out
 * while the new one rises in from the bottom. The timer is the CSS fill animation
 * itself, so it pauses while the tour is hovered, focused or off screen, and
 * restarts when a point is chosen by hand. Off under reduced motion.
 */
export function Features() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  /** The point whose screen is sliding out (up) while the active one slides in from below. */
  const [leaving, setLeaving] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const tour = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = FEATURES[active];
  const autoplay = !reduced;
  const paused = hovered || focused || !inView;

  useEffect(() => {
    const el = tour.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // On the phone tab row, keep the active point scrolled into view (horizontal only, the page never jumps).
  useEffect(() => {
    const row = list.current;
    const tab = tabs.current[active];
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: tab.offsetLeft - row.offsetLeft - 20, behavior: reduced ? 'auto' : 'smooth' });
  }, [active, reduced]);

  const go = (i: number) => {
    if (i === active) return;
    setLeaving(active);
    setActive(i);
  };
  const next = () => go((active + 1) % FEATURES.length);

  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? FEATURES.length - 1 : step ? (active + step + FEATURES.length) % FEATURES.length : -1;
    if (to < 0) return;
    e.preventDefault();
    go(to);
    tabs.current[to]?.focus();
  };

  const onBlur = (e: FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
  };

  const fillStyle: CSSProperties = { ['--sv-fill-duration' as string]: `${SLIDE_MS}ms`, animationPlayState: paused ? 'paused' : 'running' };

  return (
    <Section id="features" className="gap-12 lg:gap-16">
      <div className="flex flex-col gap-4">
        <SectionTitle>One app for the courts, the counter and the books.</SectionTitle>
        <Lede>Each part of SportVenue does one job you already do today, without the spreadsheet or the chat thread.</Lede>
      </div>

      <div
        ref={tour}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={onBlur}
        className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12"
      >
        <div
          ref={list}
          role="tablist"
          aria-label="Product areas"
          aria-orientation="vertical"
          onKeyDown={onKeyDown}
          className="-mx-5 flex gap-1 overflow-x-auto px-5 scrollbar-none lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0"
        >
          {FEATURES.map((f, i) => {
            const selected = i === active;
            return (
              <button
                key={f.key}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`tour-tab-${f.key}`}
                aria-selected={selected}
                aria-controls="tour-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => go(i)}
                className={cn(
                  'group relative shrink-0 overflow-hidden rounded-control px-4 py-2 text-left transition-colors lg:overflow-visible lg:rounded-none lg:py-5 lg:pr-5 lg:pl-6',
                  selected ? 'bg-surface-muted lg:bg-transparent' : 'hover:bg-surface-muted lg:hover:bg-transparent',
                )}
              >
                {/* Desktop rail: grey track on every point; on the active one it fills from top to bottom. */}
                <span aria-hidden className="absolute inset-y-0 left-0 hidden w-0.5 bg-border lg:block">
                  {selected && (
                    <span
                      key={`rail-${active}`}
                      className={cn('absolute inset-0 bg-accent', autoplay && 'animate-fill-down')}
                      style={autoplay ? fillStyle : undefined}
                      onAnimationEnd={next}
                    />
                  )}
                </span>
                {/* Phone and tablet: a thin bar under the active tab that fills across. */}
                {selected && autoplay && (
                  <span aria-hidden className="absolute inset-x-3 bottom-1 h-0.5 overflow-hidden rounded-full bg-accent/20 lg:hidden">
                    <span key={`bar-${active}`} className="absolute inset-0 animate-fill-right bg-accent" style={fillStyle} onAnimationEnd={next} />
                  </span>
                )}
                <span className={cn('t-text-strong lg:t-title-sm', selected ? 'text-text' : 'text-text-muted group-hover:text-text')}>
                  <span className="lg:hidden">{f.tab}</span>
                  <span className="hidden lg:inline">{f.title}</span>
                </span>
                {selected && <span className="hidden animate-slide-up pt-1.5 t-body-sm text-text-muted lg:block">{f.body}</span>}
              </button>
            );
          })}
        </div>

        <div id="tour-panel" role="tabpanel" aria-labelledby={`tour-tab-${current.key}`} aria-live={paused ? 'polite' : 'off'} className="flex min-w-0 flex-col gap-5">
          <div className={cn(SHOT_FRAME, 'relative')}>
            {/* The incoming screen stays in flow (it sets the frame's height); the outgoing one sits over it and leaves upwards. */}
            <div key={current.key} className={cn(leaving !== null && 'animate-shot-in')} onAnimationEnd={(e) => e.target === e.currentTarget && setLeaving(null)}>
              <ProductShot bare name={current.key} alt={current.alt} sizes={SHOT_SIZES} />
            </div>
            {leaving !== null && (
              <div key={`out-${FEATURES[leaving].key}`} aria-hidden className="absolute inset-0 animate-shot-out">
                <ProductShot bare name={FEATURES[leaving].key} alt="" sizes={SHOT_SIZES} />
              </div>
            )}
          </div>
          <div key={`${current.key}-text`} className="flex animate-slide-up flex-col gap-1.5 lg:hidden">
            <h3 className="t-title-md text-text">{current.title}</h3>
            <p className="t-body-md text-text-muted">{current.body}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}

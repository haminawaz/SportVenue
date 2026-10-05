'use client';

import type { CSSProperties } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

import type { AvailabilitySlot } from '@/domain/types';
import { DayTimeline } from '@/features/bookings/components/DayTimeline';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';

const SPORTS = ['Padel', 'Tennis', 'Futsal', 'Squash', 'Badminton', 'Pickleball', 'Cricket nets'];

/** Sample day for the preview only (announced as a sample to screen readers). */
const DAY = '2026-10-02';
const slot = (h: number, status: AvailabilitySlot['status'], customerName?: string, bookingId?: string): AvailabilitySlot => ({
  startAt: `${DAY}T${String(h).padStart(2, '0')}:00:00`,
  endAt: `${DAY}T${String(h + 1).padStart(2, '0')}:00:00`,
  status,
  customerName,
  bookingId,
});
const SAMPLE_SLOTS: AvailabilitySlot[] = [
  slot(16, 'BOOKED', 'Zara Qureshi', 'b1'),
  slot(17, 'FREE'),
  slot(18, 'BOOKED', 'Bilal Siddiqui', 'b2'),
  slot(19, 'BOOKED', 'Bilal Siddiqui', 'b2'),
  slot(20, 'FREE'),
  slot(21, 'BOOKED', 'Ahmed Khan', 'b3'),
];

type HeroProps = { topInset: number; onGetStarted: () => void; onHowItWorks: () => void };

/** Staggered entrance: headline, subtext, actions, then the phone (static under reduced motion). */
const rise = (i: number): CSSProperties => ({ animationDelay: `${i * 80}ms` });

export function Hero({ topInset, onGetStarted, onHowItWorks }: HeroProps) {
  return (
    <div className="px-5" style={{ paddingTop: `calc(env(safe-area-inset-top) + ${topInset + 32}px)` }}>
      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-10 lg:flex-row lg:items-center lg:gap-14">
        <div className="flex flex-col gap-6 lg:flex-[1.1]">
          <div className="flex animate-rise flex-col gap-4" style={rise(0)}>
            <div className="flex items-center gap-2">
              <span aria-hidden className="h-2 w-2 rounded-full bg-accent-decor" />
              <AppText variant="caption-uppercase" tone="muted">
                For sports facility owners
              </AppText>
            </div>
            <AppText as="h1" variant="display-mega">
              Run your{' '}
              <AppText inline variant="display-mega" tone="accent">
                courts
              </AppText>
              , not your spreadsheets.
            </AppText>
          </div>
          <div className="animate-rise" style={rise(1)}>
            <AppText as="p" tone="muted" className="max-w-[520px]">
              Bookings, payments and customers for your whole facility, in one app built for owners.
            </AppText>
          </div>
          {/* Both actions share one line from 360px up; they wrap only on smaller screens. */}
          <div className="flex animate-rise flex-wrap gap-2" style={rise(2)}>
            <Button label="Get started" variant="accent" onPress={onGetStarted} />
            <Button label="See how it works" variant="secondary" onPress={onHowItWorks} />
          </div>
        </div>

        <div className={cn('flex animate-rise justify-center lg:flex-1')} style={rise(3)}>
          <PhonePreview />
        </div>
      </div>

      <div className="mx-auto mt-12 flex w-full max-w-[1160px] flex-col gap-3">
        <AppText variant="body-strong" tone="muted">
          Built for
        </AppText>
        <ul className="flex flex-wrap gap-2">
          {SPORTS.map((s) => (
            <li key={s} className="flex min-h-11 items-center rounded-full border border-border bg-surface px-[18px]">
              <AppText variant="nav-link">{s}</AppText>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** The real court-day timeline component in a phone frame, with sample bookings. Not interactive. */
function PhonePreview() {
  return (
    <div role="img" aria-label="Preview of the SportVenue court calendar with sample bookings" className="w-full max-w-[340px]">
      <div aria-hidden inert className="pointer-events-none flex flex-col gap-4 rounded-[44px] border-[1.5px] border-border-strong bg-background px-4 pt-3 pb-5">
        <span className="mx-auto block h-1.5 w-24 rounded-full bg-border-strong opacity-60" />
        <div className="flex flex-col gap-1 px-1">
          <AppText variant="body-sm" tone="muted">
            Court 1 · Padel
          </AppText>
          <div className="flex items-center gap-3 text-text-muted">
            <CaretLeft size={18} weight="bold" />
            <AppText variant="display-md" className="flex-1">
              Today
            </AppText>
            <CaretRight size={18} weight="bold" />
          </div>
        </div>
        <div className="flex gap-2">
          <SummaryPill label="Booked" value="4 of 6" tone="accent" />
          <SummaryPill label="Free" value="2 slots" tone="muted" />
        </div>
        <DayTimeline slots={SAMPLE_SLOTS} />
      </div>
    </div>
  );
}

function SummaryPill({ label, value, tone }: { label: string; value: string; tone: 'accent' | 'muted' }) {
  return (
    <div className={cn('flex flex-1 flex-col gap-0.5 rounded-control px-3 py-2.5', tone === 'accent' ? 'bg-accent-soft' : 'bg-surface-muted')}>
      <AppText variant="caption-uppercase" className={tone === 'accent' ? 'text-accent' : 'text-text-muted'}>
        {label}
      </AppText>
      <AppText variant="title-sm">{value}</AppText>
    </div>
  );
}

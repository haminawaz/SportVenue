import { ArrowRight } from '@phosphor-icons/react';

import { Lede, Section, SectionTitle } from './LandingScroll';

/** The daily problems an owner names first, and what SportVenue replaces each one with. */
const CHANGES = [
  { before: 'Bookings buried in WhatsApp chats', after: 'Every booking on one calendar, for every court' },
  { before: 'Balances tracked in Excel, or not at all', after: 'Outstanding balances per customer, with a reminder button' },
  { before: 'Double-booked courts on busy evenings', after: 'Slots that can only be sold once' },
  { before: 'No idea which hours make money', after: 'Revenue and utilization by court and by hour' },
];

const SPORTS = 'padel, tennis, futsal, squash, badminton, pickleball and cricket nets';

/** Raised band: who it is for on the left, the before-and-after list on the right. */
export function ForFacilityOwners() {
  return (
    <Section id="owners" bandClassName="border-y border-border bg-surface" className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <div className="flex flex-col gap-4">
        <SectionTitle>Built for the people who run the venue.</SectionTitle>
        <Lede>Players get a booking app. You get the back office that keeps the courts full and the books straight.</Lede>
        <p className="max-w-[58ch] t-body-md text-text-subtle">
          Made for facilities with {SPORTS}. One owner account runs the whole venue.
        </p>
      </div>
      <dl className="flex flex-col">
        {CHANGES.map((c) => (
          <div key={c.before} className="grid grid-cols-1 gap-1.5 border-t border-border py-6 first:border-t-0 first:pt-0 sm:grid-cols-[minmax(0,1fr)_20px_minmax(0,1fr)] sm:items-baseline sm:gap-5">
            <dt className="t-body-md text-text-subtle">
              <span className="sr-only">Today: </span>
              {c.before}
            </dt>
            <ArrowRight aria-hidden size={16} weight="bold" className="hidden translate-y-0.5 text-accent sm:block" />
            <dd className="t-body-strong text-text">
              <span className="sr-only">With SportVenue: </span>
              {c.after}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

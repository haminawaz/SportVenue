import { Lede, Section, SectionTitle } from './LandingScroll';

const STEPS = [
  { title: 'Add your courts', body: 'Enter each court with its sport, opening hours, base rate and any peak or off-peak pricing. You do this once.' },
  { title: 'Take bookings', body: 'Book customers into open slots from the calendar. A slot can only be sold once, so busy evenings stop getting double-booked.' },
  { title: 'Collect and grow', body: 'Record payments as they come in, follow up on what is still owed, and use analytics to fill the hours that sit empty.' },
];

/** Headline, then the three steps in a row under one rule (a stacked list on phones). */
export function HowItWorks() {
  return (
    <Section id="how" className="gap-12">
      <div className="flex flex-col gap-4">
        <SectionTitle>Set up in an afternoon.</SectionTitle>
        <Lede>We set it up with your courts and prices, then walk you through it.</Lede>
      </div>
      <ol className="grid grid-cols-1 gap-x-10 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex flex-col gap-3 border-t border-border-strong py-7 md:pb-0">
            <span aria-hidden className="font-display text-[40px] leading-none font-light text-accent tabular-nums">
              {i + 1}
            </span>
            <h3 className="pt-2 t-title-md text-text">
              <span className="sr-only">Step {i + 1}: </span>
              {s.title}
            </h3>
            <p className="max-w-[44ch] t-body-md text-text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

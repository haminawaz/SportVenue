/** DEVELOPMENT MOCK SERVER. Server-side price calculation (pure, no state). */

import type { BookingQuote, Court, Discount, PricingRule } from '@/domain/types';

import { clockOf, dateOf, minutesOf, round2, toEpoch, weekdayOf } from './util';

const CHUNK = 30;

function ruleFor(court: Court, rules: PricingRule[], weekday: number, minute: number) {
  const matches = rules.filter(
    (r) =>
      r.active &&
      (r.courtId === court.id || r.courtId === null) &&
      r.weekdays.includes(weekday as never) &&
      minutesOf(r.startTime) <= minute &&
      minute < minutesOf(r.endTime),
  );
  return matches.find((r) => r.courtId === court.id) ?? matches[0];
}

export function discountApplies(d: Discount, court: Court, startAt: string, uses = d.usageCount) {
  const date = dateOf(startAt);
  const minute = minutesOf(clockOf(startAt));
  if (!d.active) return false;
  if (date < d.validFrom || (d.validTo && date > d.validTo)) return false;
  if (d.courtIds.length > 0 && !d.courtIds.includes(court.id)) return false;
  if (d.weekdays.length > 0 && !d.weekdays.includes(weekdayOf(date) as never)) return false;
  if (d.startTime && d.endTime && (minute < minutesOf(d.startTime) || minute >= minutesOf(d.endTime))) return false;
  if (d.maxUses !== undefined && uses >= d.maxUses) return false;
  return true;
}

export function quote(court: Court, rules: PricingRule[], startAt: string, endAt: string, discount?: Discount): BookingQuote {
  const weekday = weekdayOf(dateOf(startAt));
  const startMinute = minutesOf(clockOf(startAt));
  const totalMinutes = (toEpoch(endAt) - toEpoch(startAt)) / 60000;

  const lines = new Map<string, { minutes: number; rate: number }>();
  let price = 0;
  for (let m = 0; m < totalMinutes; m += CHUNK) {
    const rule = ruleFor(court, rules, weekday, startMinute + m);
    const rate = rule?.hourlyRate ?? court.hourlyRate;
    const key = rule?.name ?? 'Standard rate';
    const minutes = Math.min(CHUNK, totalMinutes - m);
    price += (rate * minutes) / 60;
    const line = lines.get(key) ?? { minutes: 0, rate };
    line.minutes += minutes;
    lines.set(key, line);
  }
  price = round2(price);

  const breakdown = [...lines.entries()].map(([label, l]) => ({
    label: `${label}, ${l.minutes % 60 === 0 ? `${l.minutes / 60} h` : `${l.minutes} min`}`,
    amount: round2((l.rate * l.minutes) / 60),
  }));

  let discountAmount = 0;
  if (discount && discountApplies(discount, court, startAt)) {
    discountAmount = discount.kind === 'PERCENT' ? round2((price * discount.value) / 100) : Math.min(discount.value, price);
    breakdown.push({ label: discount.name, amount: -discountAmount });
  }

  return {
    price,
    discountAmount,
    discountName: discountAmount > 0 ? discount?.name : undefined,
    total: round2(price - discountAmount),
    breakdown,
  };
}

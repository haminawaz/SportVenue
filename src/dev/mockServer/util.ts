/** DEVELOPMENT MOCK SERVER helpers. Never imported by production code paths. */

import { ApiError } from '@/api/client';
import type { Page } from '@/domain/types';

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let counter = 1000;
export const newId = (prefix: string) => `${prefix}_${(counter++).toString(36)}`;

export const notFound = (what: string) => new ApiError(404, `${what} not found.`);
export const conflict = (message: string, code?: string) => new ApiError(409, message, code);
export const invalid = (fieldErrors: Record<string, string>) =>
  new ApiError(422, Object.values(fieldErrors)[0] ?? 'The request was not valid.', 'VALIDATION', fieldErrors);
export const forbidden = () => new ApiError(403, "You don't have permission to do that.");

export function paginate<T>(items: T[], query: Record<string, unknown>, defaultLimit = 20): Page<T> {
  const offset = Number(query.cursor ?? 0) || 0;
  const limit = Math.min(Number(query.limit ?? defaultLimit) || defaultLimit, 100);
  const slice = items.slice(offset, offset + limit);
  const next = offset + limit < items.length ? String(offset + limit) : null;
  return { items: slice, nextCursor: next, total: items.length };
}

/* ----- naive facility-local datetime helpers ("YYYY-MM-DDTHH:MM:SS") ----- */

export const pad = (n: number) => String(n).padStart(2, '0');

export function naive(date: string, minutesOfDay: number) {
  const h = Math.floor(minutesOfDay / 60);
  const m = minutesOfDay % 60;
  return `${date}T${pad(h)}:${pad(m)}:00`;
}

export const toEpoch = (naiveIso: string) => Date.parse(`${naiveIso.slice(0, 19)}Z`);
export const fromEpoch = (ms: number) => new Date(ms).toISOString().slice(0, 19);
export const minutesOf = (clock: string) => {
  const [h, m] = clock.split(':').map(Number);
  return h * 60 + m;
};
export const clockOf = (naiveIso: string) => naiveIso.slice(11, 16);
export const dateOf = (naiveIso: string) => naiveIso.slice(0, 10);
export const weekdayOf = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();
export const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  toEpoch(aStart) < toEpoch(bEnd) && toEpoch(bStart) < toEpoch(aEnd);

export function nowNaive(timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

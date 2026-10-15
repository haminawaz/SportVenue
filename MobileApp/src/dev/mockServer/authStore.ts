/**
 * Demo account security: each owner's password and the password-reset links
 * the mock server hands out. Kept in localStorage where there is one (web and
 * Expo web) so a reset link opened in a new tab still works after a reload;
 * in memory on native, where the app stays running while the link is open.
 */

import { DEMO_PASSWORD } from './db';

/** Reset links work for 30 minutes and only once. */
export const RESET_TTL_MS = 30 * 60_000;

type ResetLink = { userId: string; expiresAt: number; used: boolean };
type State = {
  passwords: Record<string, string>;
  /** When each owner last changed their password; sessions issued before it are refused. */
  changedAt: Record<string, number>;
  resets: Record<string, ResetLink>;
};

const KEY = 'sportvenue.mock.auth';

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

function load(): State {
  const empty: State = { passwords: {}, changedAt: {}, resets: {} };
  try {
    const raw = storage()?.getItem(KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as Partial<State>) } : empty;
  } catch {
    return empty;
  }
}

let state: State | null = null;
const current = () => (state ??= load());

function save() {
  try {
    storage()?.setItem(KEY, JSON.stringify(current()));
  } catch {
    // Storage full or blocked: the change still applies for this session.
  }
}

function randomToken() {
  const bytes = new Uint8Array(24);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function passwordFor(userId: string) {
  return current().passwords[userId] ?? DEMO_PASSWORD;
}

/** A session token minted before the owner's last password change is no longer valid. */
export function issuedBeforePasswordChange(userId: string, issuedAt: number) {
  const changed = current().changedAt[userId];
  return changed !== undefined && issuedAt < changed;
}

/** Issues a fresh reset link for the owner; any older unused link for them stops working. */
export function issueResetToken(userId: string, now = Date.now()) {
  const s = current();
  for (const [token, link] of Object.entries(s.resets)) if (link.userId === userId || link.expiresAt < now) delete s.resets[token];
  const token = randomToken();
  s.resets[token] = { userId, expiresAt: now + RESET_TTL_MS, used: false };
  save();
  return token;
}

export type ResetCheck = { ok: true; userId: string } | { ok: false; reason: 'invalid' | 'expired' | 'used' };

export function checkResetToken(token: string, now = Date.now()): ResetCheck {
  const link = current().resets[token];
  if (!link) return { ok: false, reason: 'invalid' };
  if (link.used) return { ok: false, reason: 'used' };
  if (link.expiresAt < now) return { ok: false, reason: 'expired' };
  return { ok: true, userId: link.userId };
}

/** Sets the new password and uses up the link. The caller has already checked both. */
export function completeReset(token: string, userId: string, password: string, now = Date.now()) {
  const s = current();
  s.passwords[userId] = password;
  s.changedAt[userId] = now;
  const link = s.resets[token];
  if (link) link.used = true;
  save();
}

/** Test helper: forget every password change and reset link. */
export function resetAuthStore() {
  state = { passwords: {}, changedAt: {}, resets: {} };
  save();
}

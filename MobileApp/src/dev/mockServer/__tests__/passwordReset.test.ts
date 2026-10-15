import { ApiError } from '@/api/client';

import { handleMockRequest } from '..';
import { issueResetToken, resetAuthStore, RESET_TTL_MS } from '../authStore';

const call = (method: 'GET' | 'POST', path: string, body?: unknown, token: string | null = null) => handleMockRequest({ method, path, query: {}, body, token });

const signIn = (email: string, password: string) => call('POST', '/api/auth/sign-in', { email, password }) as Promise<{ accessToken: string }>;

async function rejectsWith(p: Promise<unknown>, status: number, code?: string) {
  const error = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).status).toBe(status);
  if (code) expect((error as ApiError).code).toBe(code);
}

async function requestLink(email: string) {
  return (await call('POST', '/api/auth/forgot-password', { email })) as { demoResetToken?: string };
}

afterEach(() => resetAuthStore());

test('forgot password answers the same for unknown emails and validates the format', async () => {
  expect(await requestLink('nobody@example.com')).toEqual({});
  await rejectsWith(call('POST', '/api/auth/forgot-password', { email: 'not-an-email' }), 422);
});

test('a reset link names the account, sets the new password once, and signs every session out', async () => {
  const before = await signIn('john@baselinepadel.pk', 'sportvenue123');
  const { demoResetToken: token } = await requestLink('JOHN@baselinepadel.pk');
  expect(token).toMatch(/^[0-9a-f]{48}$/);

  expect(await call('GET', `/api/auth/reset-password/${token}`)).toEqual({ email: 'j***@baselinepadel.pk' });

  await rejectsWith(call('POST', '/api/auth/reset-password', { token, password: 'short1' }), 422);
  await rejectsWith(call('POST', '/api/auth/reset-password', { token, password: 'lettersonly' }), 422);
  await call('POST', '/api/auth/reset-password', { token, password: 'newcourts42' });

  // The old session is gone, the old password no longer works, the new one does.
  await rejectsWith(call('GET', '/api/me', undefined, before.accessToken), 401);
  await rejectsWith(signIn('john@baselinepadel.pk', 'sportvenue123'), 401);
  const after = await signIn('john@baselinepadel.pk', 'newcourts42');
  expect(await call('GET', '/api/me', undefined, after.accessToken)).toMatchObject({ user: { email: 'john@baselinepadel.pk' } });

  // The link is used up.
  await rejectsWith(call('GET', `/api/auth/reset-password/${token}`), 410, 'RESET_USED');
  await rejectsWith(call('POST', '/api/auth/reset-password', { token, password: 'another99' }), 410, 'RESET_USED');
});

test('asking again replaces the earlier link', async () => {
  const first = (await requestLink('john@baselinepadel.pk')).demoResetToken!;
  const second = (await requestLink('john@baselinepadel.pk')).demoResetToken!;
  await rejectsWith(call('GET', `/api/auth/reset-password/${first}`), 410, 'RESET_INVALID');
  expect(await call('GET', `/api/auth/reset-password/${second}`)).toEqual({ email: 'j***@baselinepadel.pk' });
});

test('expired and unknown links are refused with their own codes', async () => {
  const stale = issueResetToken('user_john', Date.now() - RESET_TTL_MS - 1000);
  await rejectsWith(call('GET', `/api/auth/reset-password/${stale}`), 410, 'RESET_EXPIRED');
  await rejectsWith(call('POST', '/api/auth/reset-password', { token: 'made-up', password: 'newcourts42' }), 410, 'RESET_INVALID');
});

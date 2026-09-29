import { ApiError } from '@/api/client';
import type { BookingDetail, CourtAvailability, CourtSummary, Customer, Page } from '@/domain/types';
import { addDays, todayIn } from '@/lib/datetime';

import { handleMockRequest } from '..';

jest.setTimeout(30_000);

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function signIn(email: string) {
  const { accessToken } = (await handleMockRequest({ method: 'POST', path: '/api/auth/sign-in', query: {}, body: { email, password: 'coyote123' }, token: null })) as {
    accessToken: string;
  };
  return <T,>(method: Method, path: string, body?: unknown, query: Record<string, unknown> = {}) =>
    handleMockRequest({ method, path, query, body, token: accessToken }) as Promise<T>;
}

async function expectStatus(p: Promise<unknown>, status: number) {
  await expect(p).rejects.toBeInstanceOf(ApiError);
  await p.catch((e: ApiError) => expect(e.status).toBe(status));
}

const tomorrow = () => addDays(todayIn('Asia/Karachi'), 1);

describe('mock server', () => {
  test('rejects wrong passwords', async () => {
    await expectStatus(handleMockRequest({ method: 'POST', path: '/api/auth/sign-in', query: {}, body: { email: 'hamid@baselinepadel.pk', password: 'nope' }, token: null }), 401);
  });

  test('requests without a session are unauthorized', async () => {
    await expectStatus(handleMockRequest({ method: 'GET', path: '/api/courts', query: {}, body: undefined, token: 'stale' }), 401);
  });

  test('books a free slot, prices it server-side, and refuses a double booking', async () => {
    const api = await signIn('hamid@baselinepadel.pk');
    const date = tomorrow();
    const availability = await api<CourtAvailability>('GET', '/api/courts/court_2/availability', undefined, { date });
    const free = availability.slots.find((s) => s.status === 'FREE');
    expect(free).toBeDefined();

    const customers = await api<Page<Customer>>('GET', '/api/customers', undefined, { filter: 'active' });
    const body = { courtId: 'court_2', customerId: customers.items[0].id, startAt: free!.startAt, endAt: free!.endAt };

    const booking = await api<BookingDetail>('POST', '/api/bookings', body);
    expect(booking.total).toBeGreaterThan(0);
    expect(booking.outstanding).toBe(booking.total);
    expect(booking.paymentStatus).toBe('UNPAID');

    await expectStatus(api('POST', '/api/bookings', body), 409);
  });

  test('records partial then full payment and blocks overpayment', async () => {
    const api = await signIn('hamid@baselinepadel.pk');
    const date = tomorrow();
    const slot = (await api<CourtAvailability>('GET', '/api/courts/court_1/availability', undefined, { date })).slots.filter((s) => s.status === 'FREE').at(-1)!;
    const booking = await api<BookingDetail>('POST', '/api/bookings', { courtId: 'court_1', customerId: 'cust_10', startAt: slot.startAt, endAt: slot.endAt });

    await expectStatus(api('POST', '/api/payments', { bookingId: booking.id, amount: booking.total + 1, method: 'CASH' }), 422);
    await api('POST', '/api/payments', { bookingId: booking.id, amount: 1000, method: 'CASH' });
    let after = await api<BookingDetail>('GET', `/api/bookings/${booking.id}`);
    expect(after.paymentStatus).toBe('PARTIALLY_PAID');
    expect(after.outstanding).toBe(booking.total - 1000);

    await api('POST', '/api/payments', { bookingId: booking.id, amount: after.outstanding, method: 'CARD' });
    after = await api<BookingDetail>('GET', `/api/bookings/${booking.id}`);
    expect(after.paymentStatus).toBe('PAID');
    expect(after.history.some((h) => h.type === 'PAYMENT')).toBe(true);
  });

  test('courts with booking history cannot be deleted', async () => {
    const api = await signIn('hamid@baselinepadel.pk');
    await expectStatus(api('DELETE', '/api/courts/court_1'), 409);
  });

  test('overlapping time-based rates are rejected', async () => {
    const api = await signIn('hamid@baselinepadel.pk');
    await expectStatus(api('POST', '/api/pricing/rules', { name: 'Clash', courtId: 'court_1', weekdays: [1], startTime: '19:00', endTime: '21:00', hourlyRate: 7000, active: true }), 409);
  });

  test('validates customer input and duplicate phones', async () => {
    const api = await signIn('hamid@baselinepadel.pk');
    await expectStatus(api('POST', '/api/customers', { name: 'A', phone: '12' }), 422);
    const existing = (await api<Page<Customer>>('GET', '/api/customers')).items[0];
    await expectStatus(api('POST', '/api/customers', { name: 'New Person', phone: existing.phone }), 422);
  });

  test('court list reports utilization for active courts only', async () => {
    const api = await signIn('hamid@baselinepadel.pk');
    const courts = await api<CourtSummary[]>('GET', '/api/courts');
    expect(courts.find((c) => c.id === 'court_5')?.todayUtilization).toBe(0);
    expect(courts.length).toBeGreaterThanOrEqual(5);
  });
});

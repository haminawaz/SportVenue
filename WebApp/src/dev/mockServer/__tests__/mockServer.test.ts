import { ApiError } from '@/api/client';
import type { BookingDetail, CourtAvailability, CourtSummary, Customer, Page } from '@/domain/types';
import { addDays, todayIn } from '@/lib/datetime';

import { handleMockRequest } from '..';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function signIn(email: string) {
  const { accessToken } = (await handleMockRequest({ method: 'POST', path: '/api/auth/sign-in', query: {}, body: { email, password: 'sportvenue123' }, token: null })) as {
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
    await expectStatus(handleMockRequest({ method: 'POST', path: '/api/auth/sign-in', query: {}, body: { email: 'john@baselinepadel.pk', password: 'nope' }, token: null }), 401);
  });

  test('requests without a session are unauthorized', async () => {
    await expectStatus(handleMockRequest({ method: 'GET', path: '/api/courts', query: {}, body: undefined, token: 'stale' }), 401);
  });

  test('books a free slot, prices it server-side, and refuses a double booking', async () => {
    const api = await signIn('john@baselinepadel.pk');
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
    const api = await signIn('john@baselinepadel.pk');
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
    const api = await signIn('john@baselinepadel.pk');
    await expectStatus(api('DELETE', '/api/courts/court_1'), 409);
  });

  test('overlapping time-based rates are rejected', async () => {
    const api = await signIn('john@baselinepadel.pk');
    await expectStatus(api('POST', '/api/pricing/rules', { name: 'Clash', courtId: 'court_1', weekdays: [1], startTime: '19:00', endTime: '21:00', hourlyRate: 7000, active: true }), 409);
  });

  test('validates customer input and duplicate phones', async () => {
    const api = await signIn('john@baselinepadel.pk');
    await expectStatus(api('POST', '/api/customers', { name: 'A', phone: '12' }), 422);
    const existing = (await api<Page<Customer>>('GET', '/api/customers')).items[0];
    await expectStatus(api('POST', '/api/customers', { name: 'New Person', phone: existing.phone }), 422);
  });

  test('court list reports utilization for active courts only', async () => {
    const api = await signIn('john@baselinepadel.pk');
    const courts = await api<CourtSummary[]>('GET', '/api/courts');
    expect(courts.find((c) => c.id === 'court_5')?.todayUtilization).toBe(0);
    expect(courts.length).toBeGreaterThanOrEqual(5);
  });
});

describe('second owner with an empty facility', () => {
  const EMPTY = 'emma@greenlinearena.pk';
  const range = () => {
    const end = todayIn('Asia/Karachi');
    return { startDate: addDays(end, -29), endDate: end };
  };
  /** No NaN, Infinity or null where a number is expected, anywhere in a response. */
  const expectFiniteNumbers = (value: unknown) => {
    const json = JSON.stringify(value, (_k, v) => (typeof v === 'number' && !Number.isFinite(v) ? '__NOT_FINITE__' : v));
    expect(json).not.toContain('__NOT_FINITE__');
  };

  test('signs in to its own facility with nothing seeded', async () => {
    const api = await signIn(EMPTY);
    const me = await api<{ facility: { name: string } }>('GET', '/api/me');
    expect(me.facility.name).toBe('Greenline Sports Arena');

    expect(await api<unknown[]>('GET', '/api/courts')).toEqual([]);
    for (const path of ['/api/bookings', '/api/customers', '/api/payments', '/api/payments/outstanding', '/api/notifications', '/api/pricing/history']) {
      const page = await api<Page<unknown>>('GET', path);
      expect(page.items).toEqual([]);
    }
    expect(await api<unknown[]>('GET', '/api/opportunities')).toEqual([]);
    expect(await api<unknown[]>('GET', '/api/pricing/rules')).toEqual([]);
    expect(await api<unknown[]>('GET', '/api/pricing/discounts')).toEqual([]);
    expect(await api<{ count: number }>('GET', '/api/notifications/unread-count')).toEqual({ count: 0 });
  });

  test('dashboard and analytics are all zeros, never NaN', async () => {
    const api = await signIn(EMPTY);
    const dashboard = await api<{ summary: { revenue: { amount: number }; bookings: { count: number }; utilization: { percentage: number } } }>('GET', '/api/owner/dashboard', undefined, range());
    expect(dashboard.summary.revenue.amount).toBe(0);
    expect(dashboard.summary.bookings.count).toBe(0);
    expect(dashboard.summary.utilization.percentage).toBe(0);
    expectFiniteNumbers(dashboard);
    expectFiniteNumbers(await api('GET', '/api/analytics', undefined, range()));
    expectFiniteNumbers(await api('GET', '/api/billing/subscription'));
  });

  test("owners never see each other's data", async () => {
    const seededApi = await signIn('john@baselinepadel.pk');
    const emptyApi = await signIn(EMPTY);
    expect((await seededApi<unknown[]>('GET', '/api/courts')).length).toBeGreaterThan(0);
    expect(await emptyApi<unknown[]>('GET', '/api/courts')).toEqual([]);
    expect((await seededApi<Page<unknown>>('GET', '/api/customers')).items.length).toBeGreaterThan(0);
  });

  test('the empty owner can add a first court and customer, and they stay in their facility', async () => {
    const api = await signIn(EMPTY);
    await api('POST', '/api/courts', { name: 'Court A', sport: 'Padel', indoor: true, hourlyRate: 4000, slotMinutes: 60 });
    await api('POST', '/api/customers', { name: 'Mark Stevens', phone: '+92 300 1234567' });
    expect((await api<unknown[]>('GET', '/api/courts')).length).toBe(1);
    expect((await api<Page<unknown>>('GET', '/api/customers')).items.length).toBe(1);

    const seededApi = await signIn('john@baselinepadel.pk');
    const seededCourts = await seededApi<CourtSummary[]>('GET', '/api/courts');
    expect(seededCourts.some((c) => c.name === 'Court A')).toBe(false);
  });
});

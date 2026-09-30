/**
 * DEVELOPMENT MOCK SERVER.
 *
 * Answers apiRequest() in place of the network when USE_MOCKS is on
 * (__DEV__ and EXPO_PUBLIC_USE_MOCKS=1). Implements the proposed REST
 * contract in docs/facility-dashboard-api.md with server-side validation,
 * owner authentication and calculations, so every app flow can be exercised.
 */

import { ApiError } from '@/api/client';
import { daysBetween } from '@/lib/datetime';
import type {
  BookingEvent,
  BookingStatus,
  Court,
  Discount,
  DiscountInput,
  PaymentMethod,
  PricingRule,
  PricingRuleInput,
  Weekday,
} from '@/domain/types';

import { DEMO_PASSWORD, db, type StoredBooking, type StoredCustomer } from './db';
import { quote } from './pricing';
import { conflict, invalid, newId, notFound, paginate, round2, toEpoch, dateOf, minutesOf, clockOf, overlaps, weekdayOf, wait, rng } from './util';
import {
  analyticsView,
  availability,
  bookingDetailView,
  bookingView,
  courtSummaryView,
  customerDetailView,
  customerView,
  dashboardView,
  now,
  outstandingBalances,
  paidFor,
  paymentView,
  today,
} from './views';

type Req = { method: string; path: string; query: Record<string, unknown>; body: unknown; token: string | null };
type Ctx = { req: Req; params: Record<string, string>; user: (typeof db.users)[number]; body: Record<string, any>; q: Record<string, string> };
type Handler = (ctx: Ctx) => unknown;
type Route = { method: string; pattern: RegExp; keys: string[]; handler: Handler };

const routes: Route[] = [];
const publicRoutes: Route[] = [];

/** SportVenue has one role, the facility owner, so every signed-in route is open to the session user. */
function route(method: string, path: string, handler: Handler, isPublic = false) {
  const keys: string[] = [];
  const pattern = new RegExp(`^${path.replace(/:([a-zA-Z]+)/g, (_m, k) => (keys.push(k), '([^/]+)'))}$`);
  (isPublic ? publicRoutes : routes).push({ method, pattern, keys, handler });
}

const jitter = rng(7);

export async function handleMockRequest(req: Req): Promise<unknown> {
  await wait(220 + Math.floor(jitter() * 380));

  const match = (list: Route[]) => {
    for (const r of list) {
      if (r.method !== req.method) continue;
      const m = r.pattern.exec(req.path);
      if (m) return { r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
    }
    return null;
  };

  const q = Object.fromEntries(Object.entries(req.query).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)]));
  const body = (req.body ?? {}) as Record<string, any>;

  const pub = match(publicRoutes);
  if (pub) return clone(pub.r.handler({ req, params: pub.params, user: undefined as never, body, q }));

  // The in-memory session table empties on every JS reload; accept our own
  // well-formed dev tokens again so a reload doesn't sign you out. Dev only.
  if (req.token && !db.sessions.has(req.token)) {
    const match = /^mock\.(user_[a-z]+)\.\d+$/.exec(req.token);
    if (match && db.users.some((u) => u.id === match[1])) db.sessions.set(req.token, match[1]);
  }
  const userId = req.token ? db.sessions.get(req.token) : undefined;
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new ApiError(401, 'Your session has expired.');

  const found = match(routes);
  if (!found) throw new ApiError(404, `No mock route for ${req.method} ${req.path}`);
  return clone(found.r.handler({ req, params: found.params, user, body, q }));
}

const clone = <T,>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

/* ------------------------------------------------------------------ helpers */

const fmtMoney = (n: number) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: db.facility.currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${db.facility.currency} ${n}`;
  }
};
const fmtClock = (clock: string) => {
  const [h, m] = clock.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const actorName = (ctx: Ctx) => `${ctx.user.firstName} ${ctx.user.lastName}`;

const findBooking = (id: string) => db.bookings.find((b) => b.id === id) ?? (() => { throw notFound('Booking'); })();
const findCourt = (id: string) => db.courts.find((c) => c.id === id) ?? (() => { throw notFound('Court'); })();
const findCustomer = (id: string) => db.customers.find((c) => c.id === id) ?? (() => { throw notFound('Customer'); })();

function event(b: StoredBooking, type: BookingEvent['type'], description: string, actor: string) {
  b.history.push({ id: newId('evt'), at: now(), type, description, actor });
}

const PHONE = /^\+?[0-9][0-9\s-]{6,18}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

function validateSlot(ctx: Ctx, courtId: string, startAt: string, endAt: string, ignoreBookingId?: string) {
  const errors: Record<string, string> = {};
  if (!courtId) errors.courtId = 'Choose a court.';
  if (!LOCAL.test(startAt ?? '') || !LOCAL.test(endAt ?? '')) errors.startAt = 'Choose a time slot.';
  if (Object.keys(errors).length) throw invalid(errors);
  const court = findCourt(courtId);
  if (court.status !== 'ACTIVE') throw conflict(`${court.name} is not accepting bookings right now.`, 'COURT_UNAVAILABLE');
  if (toEpoch(endAt) <= toEpoch(startAt)) throw invalid({ startAt: 'The end time must be after the start time.' });
  if (toEpoch(startAt) < toEpoch(now()) - 5 * 60000) throw invalid({ startAt: 'Choose a time that has not passed.' });
  const date = dateOf(startAt);
  if (daysBetween(today(), date) > db.facility.settings.bookingLeadDays) {
    throw invalid({ startAt: `Bookings open ${db.facility.settings.bookingLeadDays} days ahead.` });
  }
  const hours = db.facility.businessHours[weekdayOf(date)];
  if (hours.closed || minutesOf(clockOf(startAt)) < minutesOf(hours.open) || minutesOf(clockOf(endAt)) > minutesOf(hours.close) || dateOf(endAt) !== date) {
    throw invalid({ startAt: 'That time is outside business hours.' });
  }
  const clash = db.bookings.find((b) => b.id !== ignoreBookingId && b.courtId === courtId && b.status !== 'CANCELLED' && overlaps(b.startAt, b.endAt, startAt, endAt));
  if (clash) {
    throw conflict(`${court.name} is already booked ${fmtClock(clockOf(clash.startAt))} - ${fmtClock(clockOf(clash.endAt))}. Pick another slot.`, 'SLOT_TAKEN');
  }
  void ctx;
  return court;
}

function discountFor(id?: string): Discount | undefined {
  if (!id) return undefined;
  return db.discounts.find((d) => d.id === id) ?? (() => { throw invalid({ discountId: 'That discount no longer exists.' }); })();
}

function logPricing(ctx: Ctx, subject: 'COURT_RATE' | 'RULE' | 'DISCOUNT', subjectName: string, change: string) {
  db.pricingHistory.unshift({ id: newId('ph'), at: now(), actor: actorName(ctx), subject, subjectName, change });
}

function notify(n: Omit<(typeof db.notifications)[number], 'id' | 'createdAt' | 'read'>) {
  db.notifications.unshift({ ...n, id: newId('ntf'), createdAt: now(), read: false });
}

/* ------------------------------------------------------------------ auth & me */

route('POST', '/api/auth/sign-in', ({ body }) => {
  const email = String(body.email ?? '').toLowerCase();
  const errors: Record<string, string> = {};
  if (!EMAIL.test(email)) errors.email = 'Enter a valid email address.';
  if (!body.password) errors.password = 'Enter your password.';
  if (Object.keys(errors).length) throw invalid(errors);
  const user = db.users.find((u) => u.email === email);
  if (!user || body.password !== DEMO_PASSWORD) throw new ApiError(401, 'Email or password is incorrect.', 'BAD_CREDENTIALS');
  const token = `mock.${user.id}.${Date.now()}`;
  db.sessions.set(token, user.id);
  return { accessToken: token };
}, true);

route('POST', '/api/leads', ({ body }) => {
  const errors: Record<string, string> = {};
  if (String(body.name ?? '').trim().length < 2) errors.name = 'Enter your name.';
  if (String(body.facilityName ?? '').trim().length < 2) errors.facilityName = 'Enter your facility name.';
  if (!PHONE.test(String(body.phone ?? '').trim())) errors.phone = 'Enter a valid phone number.';
  if (!EMAIL.test(String(body.email ?? '').trim())) errors.email = 'Enter a valid email address.';
  if (Object.keys(errors).length) throw invalid(errors);
  return { id: newId('lead') };
}, true);

route('POST', '/api/auth/sign-out', ({ req }) => {
  if (req.token) db.sessions.delete(req.token);
  return undefined;
});

const me = (ctx: Ctx) => ({ user: ctx.user, facility: db.facility });
route('GET', '/api/me', me);
route('PATCH', '/api/me', (ctx) => {
  const { firstName, lastName, email, phone } = ctx.body;
  const errors: Record<string, string> = {};
  if (!String(firstName ?? '').trim()) errors.firstName = 'Enter your first name.';
  if (!String(lastName ?? '').trim()) errors.lastName = 'Enter your last name.';
  if (!EMAIL.test(String(email ?? ''))) errors.email = 'Enter a valid email address.';
  if (phone && !PHONE.test(phone)) errors.phone = 'Enter a valid phone number.';
  if (Object.keys(errors).length) throw invalid(errors);
  if (db.users.some((u) => u.id !== ctx.user.id && u.email === email.toLowerCase())) throw invalid({ email: 'Another account uses this email.' });
  Object.assign(ctx.user, { firstName: firstName.trim(), lastName: lastName.trim(), email: email.toLowerCase(), phone: phone || undefined });
  return me(ctx);
});
route('GET', '/api/me/notification-preferences', () => db.preferences);
route('PUT', '/api/me/notification-preferences', ({ body }) => {
  db.preferences = { ...db.preferences, ...body };
  return db.preferences;
});

/* ------------------------------------------------------------------ dashboard & analytics */

route('GET', '/api/owner/dashboard', ({ q }) => {
  if (!DATE.test(q.startDate ?? '') || !DATE.test(q.endDate ?? '')) throw invalid({ startDate: 'Choose a valid period.' });
  return dashboardView(q.startDate, q.endDate);
});

route('GET', '/api/analytics', ({ q }) => {
  if (!DATE.test(q.startDate ?? '') || !DATE.test(q.endDate ?? '')) throw invalid({ startDate: 'Choose a valid period.' });
  if (daysBetween(q.startDate, q.endDate) > 366) throw invalid({ startDate: 'Choose a period of one year or less.' });
  return analyticsView(q.startDate, q.endDate);
});

/* ------------------------------------------------------------------ facility */

route('GET', '/api/facility', () => db.facility);
route('PATCH', '/api/facility', ({ body }) => {
  const errors: Record<string, string> = {};
  if ('name' in body && !String(body.name).trim()) errors.name = 'Enter the facility name.';
  if ('email' in body && !EMAIL.test(String(body.email))) errors.email = 'Enter a valid email address.';
  if ('phone' in body && !PHONE.test(String(body.phone))) errors.phone = 'Enter a valid phone number.';
  if ('address' in body && !String(body.address).trim()) errors.address = 'Enter the street address.';
  if ('currency' in body && !/^[A-Z]{3}$/.test(String(body.currency))) errors.currency = 'Choose a currency.';
  if ('timezone' in body) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: String(body.timezone) });
    } catch {
      errors.timezone = 'Choose a valid timezone.';
    }
  }
  if (body.settings) {
    const s = body.settings;
    if (s.cancellationWindowHours < 0 || s.cancellationWindowHours > 168) errors.cancellationWindowHours = 'Use 0 to 168 hours.';
    if (s.bookingLeadDays < 1 || s.bookingLeadDays > 365) errors.bookingLeadDays = 'Use 1 to 365 days.';
  }
  if (Object.keys(errors).length) throw invalid(errors);
  const { settings, ...rest } = body;
  db.facility = { ...db.facility, ...rest, settings: settings ? { ...db.facility.settings, ...settings } : db.facility.settings };
  return db.facility;
});
route('PUT', '/api/facility/hours', ({ body }) => {
  const hours = body.businessHours as typeof db.facility.businessHours;
  if (!Array.isArray(hours) || hours.length !== 7) throw invalid({ businessHours: 'Provide hours for all 7 days.' });
  const errors: Record<string, string> = {};
  for (const h of hours) {
    if (h.closed) continue;
    if (!CLOCK.test(h.open) || !CLOCK.test(h.close)) errors[`day${h.weekday}`] = 'Choose opening and closing times.';
    else if (minutesOf(h.close) <= minutesOf(h.open)) errors[`day${h.weekday}`] = 'Closing time must be after opening time.';
  }
  if (Object.keys(errors).length) throw invalid(errors);
  db.facility.businessHours = [...hours].sort((a, b) => a.weekday - b.weekday);
  return db.facility;
});

/* ------------------------------------------------------------------ courts */

function validateCourt(body: Record<string, any>, id?: string) {
  const errors: Record<string, string> = {};
  const name = String(body.name ?? '').trim();
  if (!name) errors.name = 'Enter a court name.';
  else if (db.courts.some((c) => c.id !== id && c.name.toLowerCase() === name.toLowerCase())) errors.name = 'Another court already uses this name.';
  if (!String(body.sport ?? '').trim()) errors.sport = 'Choose a sport.';
  if (!(Number(body.hourlyRate) > 0)) errors.hourlyRate = 'Enter an hourly rate above zero.';
  if (![30, 60, 90].includes(Number(body.slotMinutes))) errors.slotMinutes = 'Choose a slot length.';
  if (Object.keys(errors).length) throw invalid(errors);
}

route('GET', '/api/courts', ({ q }) => {
  const list = db.courts.filter((c) => !q.status || q.status.split(',').includes(c.status));
  return list.map(courtSummaryView);
});
route('POST', '/api/courts', (ctx) => {
  validateCourt(ctx.body);
  if (db.courts.length >= db.subscription.courtsLimit) throw conflict(`Your plan includes ${db.subscription.courtsLimit} courts. Upgrade to add more.`, 'PLAN_LIMIT');
  const court: Court = {
    id: newId('court'),
    name: ctx.body.name.trim(),
    sport: ctx.body.sport.trim(),
    surface: ctx.body.surface?.trim() || undefined,
    indoor: !!ctx.body.indoor,
    status: ctx.body.status ?? 'ACTIVE',
    hourlyRate: round2(Number(ctx.body.hourlyRate)),
    slotMinutes: Number(ctx.body.slotMinutes) as Court['slotMinutes'],
    notes: ctx.body.notes?.trim() || undefined,
    createdAt: now(),
  };
  db.courts.push(court);
  db.subscription.courtsUsed = db.courts.length;
  logPricing(ctx, 'COURT_RATE', court.name, `Created with a base rate of ${fmtMoney(court.hourlyRate)} per hour`);
  return courtSummaryView(court);
});
route('GET', '/api/courts/:id', ({ params }) => courtSummaryView(findCourt(params.id)));
route('PATCH', '/api/courts/:id', (ctx) => {
  const court = findCourt(ctx.params.id);
  const next = { ...court, ...ctx.body };
  validateCourt(next, court.id);
  if (Number(next.hourlyRate) !== court.hourlyRate) {
    logPricing(ctx, 'COURT_RATE', court.name, `Base rate changed from ${fmtMoney(court.hourlyRate)} to ${fmtMoney(Number(next.hourlyRate))} per hour`);
  }
  if (next.status !== court.status && next.status !== 'ACTIVE') {
    notify({ type: 'SYSTEM', title: `${court.name} is ${next.status === 'MAINTENANCE' ? 'in maintenance' : 'inactive'}`, body: 'New bookings are paused until you set it back to active.', link: { kind: 'court', id: court.id } });
  }
  Object.assign(court, {
    name: String(next.name).trim(),
    sport: String(next.sport).trim(),
    surface: next.surface?.trim() || undefined,
    indoor: !!next.indoor,
    status: next.status,
    hourlyRate: round2(Number(next.hourlyRate)),
    slotMinutes: Number(next.slotMinutes),
    notes: next.notes?.trim() || undefined,
  });
  return courtSummaryView(court);
});
route('DELETE', '/api/courts/:id', ({ params }) => {
  const court = findCourt(params.id);
  const count = db.bookings.filter((b) => b.courtId === court.id).length;
  if (count > 0) throw conflict(`${court.name} has ${count} bookings on record, so it can't be deleted. Deactivate it instead to keep its history.`, 'HAS_BOOKINGS');
  db.courts = db.courts.filter((c) => c.id !== court.id);
  db.rules = db.rules.filter((r) => r.courtId !== court.id);
  db.subscription.courtsUsed = db.courts.length;
  return undefined;
});
route('GET', '/api/courts/:id/availability', ({ params, q }) => {
  if (!DATE.test(q.date ?? '')) throw invalid({ date: 'Choose a date.' });
  return availability(findCourt(params.id), q.date);
});

/* ------------------------------------------------------------------ bookings */

route('GET', '/api/bookings', ({ q }) => {
  const statuses = q.status ? q.status.split(',') : null;
  const search = (q.q ?? '').trim().toLowerCase();
  let views = db.bookings
    .filter(
      (b) =>
        (!q.from || dateOf(b.startAt) >= q.from) &&
        (!q.to || dateOf(b.startAt) <= q.to) &&
        (!q.courtId || b.courtId === q.courtId) &&
        (!q.customerId || b.customerId === q.customerId) &&
        (!statuses || statuses.includes(b.status)),
    )
    .map(bookingView);
  if (search) views = views.filter((b) => b.customerName.toLowerCase().includes(search) || b.reference.toLowerCase().includes(search));
  views.sort((a, b) => (q.order === 'desc' ? toEpoch(b.startAt) - toEpoch(a.startAt) : toEpoch(a.startAt) - toEpoch(b.startAt)));
  return paginate(views, q);
});

route('POST', '/api/bookings/quote', (ctx) => {
  const { courtId, startAt, endAt, discountId } = ctx.body;
  const court = findCourt(courtId);
  if (!LOCAL.test(startAt ?? '') || !LOCAL.test(endAt ?? '')) throw invalid({ startAt: 'Choose a time slot.' });
  return quote(court, db.rules, startAt, endAt, discountFor(discountId));
});

route('POST', '/api/bookings', (ctx) => {
  const { courtId, customerId, startAt, endAt, discountId, notes } = ctx.body;
  if (!customerId) throw invalid({ customerId: 'Choose a customer.' });
  const customer = findCustomer(customerId);
  if (customer.status !== 'ACTIVE') throw invalid({ customerId: `${customer.name} is inactive. Reactivate them first.` });
  const court = validateSlot(ctx, courtId, startAt, endAt);
  const discount = discountFor(discountId);
  const q = quote(court, db.rules, startAt, endAt, discount);
  if (discount && q.discountAmount > 0) discount.usageCount += 1;
  const seq = db.bookingSeq++;
  const b: StoredBooking = {
    id: `bk_${seq}`,
    reference: `BPC-${seq}`,
    courtId,
    customerId,
    startAt,
    endAt,
    status: 'CONFIRMED',
    price: q.price,
    discountAmount: q.discountAmount,
    discountId: q.discountAmount > 0 ? discount?.id : undefined,
    discountName: q.discountName,
    notes: notes?.trim() || undefined,
    createdAt: now(),
    history: [],
  };
  event(b, 'CREATED', `Booked ${court.name}${q.discountName ? ` with ${q.discountName}` : ''}`, actorName(ctx));
  db.bookings.push(b);
  notify({ type: 'BOOKING_CREATED', title: 'New booking', body: `${customer.name} booked ${court.name} at ${fmtClock(clockOf(startAt))}.`, link: { kind: 'booking', id: b.id } });
  return bookingDetailView(b);
});

route('GET', '/api/bookings/:id', ({ params }) => bookingDetailView(findBooking(params.id)));

route('PATCH', '/api/bookings/:id', (ctx) => {
  const b = findBooking(ctx.params.id);
  if (b.status === 'CANCELLED') throw conflict('Cancelled bookings cannot be edited.');
  const changes: string[] = [];
  if (ctx.body.customerId && ctx.body.customerId !== b.customerId) {
    const c = findCustomer(ctx.body.customerId);
    if (c.status !== 'ACTIVE') throw invalid({ customerId: `${c.name} is inactive.` });
    if (paidFor(b.id) > 0) throw conflict('This booking has payments recorded against the current customer, so the customer cannot be changed.');
    b.customerId = c.id;
    changes.push(`customer changed to ${c.name}`);
  }
  if ('notes' in ctx.body && (ctx.body.notes?.trim() || undefined) !== b.notes) {
    b.notes = ctx.body.notes?.trim() || undefined;
    changes.push('notes updated');
  }
  if (changes.length) event(b, 'UPDATED', changes.join(', ').replace(/^./, (s) => s.toUpperCase()), actorName(ctx));
  return bookingDetailView(b);
});

route('POST', '/api/bookings/:id/reschedule', (ctx) => {
  const b = findBooking(ctx.params.id);
  if (b.status === 'CANCELLED' || b.status === 'COMPLETED' || b.status === 'NO_SHOW') throw conflict('Only upcoming bookings can be rescheduled.');
  const { courtId, startAt, endAt } = ctx.body;
  const court = validateSlot(ctx, courtId, startAt, endAt, b.id);
  const discount = b.discountId ? db.discounts.find((d) => d.id === b.discountId) : undefined;
  const q = quote(court, db.rules, startAt, endAt, discount);
  const from = `${db.courts.find((c) => c.id === b.courtId)?.name}, ${dateOf(b.startAt)} ${fmtClock(clockOf(b.startAt))}`;
  Object.assign(b, { courtId, startAt, endAt, price: q.price, discountAmount: q.discountAmount, discountName: q.discountName });
  event(b, 'RESCHEDULED', `Moved from ${from} to ${court.name}, ${dateOf(startAt)} ${fmtClock(clockOf(startAt))}`, actorName(ctx));
  return bookingDetailView(b);
});

route('POST', '/api/bookings/:id/cancel', (ctx) => {
  const b = findBooking(ctx.params.id);
  if (b.status !== 'CONFIRMED' && b.status !== 'PENDING') throw conflict('This booking can no longer be cancelled.');
  const reason = String(ctx.body.reason ?? '').trim();
  if (!reason) throw invalid({ reason: 'Choose a reason.' });
  b.status = 'CANCELLED';
  b.cancelReason = reason;
  b.refunded = !!ctx.body.refund && paidFor(b.id) > 0;
  event(b, 'CANCELLED', `Cancelled: ${reason}${b.refunded ? '. Payment marked as refunded.' : ''}`, actorName(ctx));
  const customer = db.customers.find((c) => c.id === b.customerId);
  notify({ type: 'BOOKING_CANCELLED', title: 'Booking cancelled', body: `${customer?.name} ${b.reference} was cancelled (${reason}).`, link: { kind: 'booking', id: b.id } });
  return bookingDetailView(b);
});

route('POST', '/api/bookings/:id/status', (ctx) => {
  const b = findBooking(ctx.params.id);
  const status = ctx.body.status as BookingStatus;
  if (!['COMPLETED', 'NO_SHOW', 'CONFIRMED'].includes(status)) throw invalid({ status: 'Choose a valid status.' });
  if (b.status === 'CANCELLED') throw conflict('Cancelled bookings cannot change status.');
  if (status !== 'CONFIRMED' && toEpoch(b.startAt) > toEpoch(now())) throw conflict('This booking has not started yet.');
  b.status = status;
  event(b, 'STATUS', status === 'NO_SHOW' ? 'Marked as no-show' : status === 'COMPLETED' ? 'Marked as completed' : 'Confirmed', actorName(ctx));
  return bookingDetailView(b);
});

route('POST', '/api/bookings/:id/payment-reminders', (ctx) => {
  const b = findBooking(ctx.params.id);
  const view = bookingView(b);
  if (view.outstanding <= 0) throw conflict('This booking is already paid.', 'ALREADY_PAID');
  event(b, 'REMINDER', `Payment reminder sent for ${fmtMoney(view.outstanding)}`, actorName(ctx));
  return undefined;
});

/* ------------------------------------------------------------------ payments */

route('GET', '/api/payments', ({ q }) => {
  const list = db.payments
    .filter((p) => (!q.customerId || p.customerId === q.customerId) && (!q.bookingId || p.bookingId === q.bookingId))
    .sort((a, b) => toEpoch(b.receivedAt) - toEpoch(a.receivedAt))
    .map(paymentView);
  return paginate(list, q);
});
route('GET', '/api/payments/outstanding', ({ q }) => {
  const list = outstandingBalances()
    .filter((b) => !q.customerId || b.customerId === q.customerId)
    .sort((a, b) => (q.sort === 'oldest' ? b.daysOverdue - a.daysOverdue : b.outstanding - a.outstanding));
  return { ...paginate(list, q), totalAmount: round2(list.reduce((s, b) => s + b.outstanding, 0)) };
});
route('GET', '/api/payments/:id', ({ params }) => {
  const p = db.payments.find((x) => x.id === params.id);
  if (!p) throw notFound('Payment');
  return paymentView(p);
});
route('POST', '/api/payments', (ctx) => {
  const { bookingId, method, note } = ctx.body;
  const amount = round2(Number(ctx.body.amount));
  const b = findBooking(bookingId);
  const view = bookingView(b);
  const errors: Record<string, string> = {};
  if (!(amount > 0)) errors.amount = 'Enter an amount above zero.';
  else if (amount > view.outstanding) errors.amount = `The balance is ${fmtMoney(view.outstanding)}. Enter that amount or less.`;
  if (!['CASH', 'CARD', 'BANK_TRANSFER', 'WALLET'].includes(method)) errors.method = 'Choose how the customer paid.';
  if (Object.keys(errors).length) throw invalid(errors);
  if (b.status === 'CANCELLED') throw conflict('Payments cannot be recorded on a cancelled booking.');
  const payment = {
    id: newId('pay'),
    bookingId: b.id,
    customerId: b.customerId,
    amount,
    method: method as PaymentMethod,
    receivedAt: now(),
    note: note?.trim() || undefined,
    recordedBy: actorName(ctx),
  };
  db.payments.push(payment);
  const remaining = round2(view.outstanding - amount);
  event(b, 'PAYMENT', `${fmtMoney(amount)} received${remaining > 0 ? `, ${fmtMoney(remaining)} still due` : ', paid in full'}`, actorName(ctx));
  db.opportunities
    .filter((o) => o.type === 'OUTSTANDING_PAYMENT' && o.bookingId === b.id && remaining <= 0 && (o.status === 'OPEN' || o.status === 'IN_PROGRESS'))
    .forEach((o) => {
      o.status = 'RESOLVED';
      o.resolution = { outcome: 'ACTIONED', note: 'Balance paid in full.', at: now(), by: actorName(ctx) };
    });
  return paymentView(payment);
});

/* ------------------------------------------------------------------ customers */

function validateCustomer(body: Record<string, any>, id?: string) {
  const errors: Record<string, string> = {};
  const name = String(body.name ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  if (name.length < 2) errors.name = 'Enter the customer name.';
  if (!PHONE.test(phone)) errors.phone = 'Enter a valid phone number, for example +92 300 1234567.';
  else if (db.customers.some((c) => c.id !== id && c.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''))) errors.phone = 'Another customer already uses this phone number.';
  if (body.email && !EMAIL.test(String(body.email))) errors.email = 'Enter a valid email address.';
  if (body.isRegular && body.regularSlot) {
    const s = body.regularSlot;
    if (!s.courtId) errors.regularCourt = 'Choose a court.';
    if (!CLOCK.test(s.startTime ?? '')) errors.regularTime = 'Choose a start time.';
  }
  if (Object.keys(errors).length) throw invalid(errors);
}

function applyCustomer(c: StoredCustomer, body: Record<string, any>) {
  c.name = String(body.name).trim();
  c.phone = String(body.phone).trim();
  c.email = body.email ? String(body.email).trim().toLowerCase() : undefined;
  c.isRegular = !!body.isRegular;
  c.regularSlot = body.isRegular && body.regularSlot ? { ...body.regularSlot, weekday: Number(body.regularSlot.weekday) as Weekday } : undefined;
}

route('GET', '/api/customers', ({ q }) => {
  const search = (q.q ?? '').trim().toLowerCase();
  let list = db.customers
    .filter((c) => !search || c.name.toLowerCase().includes(search) || c.phone.replace(/\D/g, '').includes(search.replace(/\D/g, '') || '\u0000') || (c.email ?? '').includes(search))
    .map(customerView);
  if (q.filter === 'regular') list = list.filter((c) => c.isRegular && c.status === 'ACTIVE');
  else if (q.filter === 'balance') list = list.filter((c) => c.outstanding > 0);
  else if (q.filter === 'inactive') list = list.filter((c) => c.status === 'INACTIVE');
  else if (q.filter !== 'all') list = list.filter((c) => c.status === 'ACTIVE');
  if (q.sort === 'balance') list.sort((a, b) => b.outstanding - a.outstanding);
  else if (q.sort === 'recent') list.sort((a, b) => toEpoch(b.lastBookingAt ?? '1970-01-01T00:00:00') - toEpoch(a.lastBookingAt ?? '1970-01-01T00:00:00'));
  else if (q.sort === 'spent') list.sort((a, b) => b.totalSpent - a.totalSpent);
  else list.sort((a, b) => a.name.localeCompare(b.name));
  return paginate(list, q, 25);
});
route('POST', '/api/customers', (ctx) => {
  validateCustomer(ctx.body);
  const c: StoredCustomer = { id: newId('cust'), name: '', phone: '', status: 'ACTIVE', isRegular: false, createdAt: now(), notes: [] };
  applyCustomer(c, ctx.body);
  if (ctx.body.note?.trim()) c.notes.push({ id: newId('note'), body: ctx.body.note.trim(), createdAt: now(), author: actorName(ctx) });
  db.customers.push(c);
  return customerDetailView(c);
});
route('GET', '/api/customers/:id', ({ params }) => customerDetailView(findCustomer(params.id)));
route('PATCH', '/api/customers/:id', (ctx) => {
  const c = findCustomer(ctx.params.id);
  if ('status' in ctx.body && Object.keys(ctx.body).length === 1) {
    c.status = ctx.body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return customerDetailView(c);
  }
  validateCustomer(ctx.body, c.id);
  applyCustomer(c, ctx.body);
  return customerDetailView(c);
});
route('DELETE', '/api/customers/:id', ({ params }) => {
  const c = findCustomer(params.id);
  const count = db.bookings.filter((b) => b.customerId === c.id).length;
  if (count > 0) throw conflict(`${c.name} has ${count} bookings on record, so they can't be deleted. Deactivate them instead to keep the history.`, 'HAS_BOOKINGS');
  db.customers = db.customers.filter((x) => x.id !== c.id);
  return undefined;
});
route('POST', '/api/customers/:id/notes', (ctx) => {
  const c = findCustomer(ctx.params.id);
  const body = String(ctx.body.body ?? '').trim();
  if (!body) throw invalid({ body: 'Write a note first.' });
  if (body.length > 1000) throw invalid({ body: 'Keep notes under 1,000 characters.' });
  c.notes.push({ id: newId('note'), body, createdAt: now(), author: actorName(ctx) });
  return customerDetailView(c);
});
route('DELETE', '/api/customers/:id/notes/:noteId', ({ params }) => {
  const c = findCustomer(params.id);
  c.notes = c.notes.filter((n) => n.id !== params.noteId);
  return customerDetailView(c);
});

/* ------------------------------------------------------------------ opportunities */

route('GET', '/api/opportunities', ({ q }) => {
  const statuses = q.status ? q.status.split(',') : null;
  return db.opportunities
    .filter((o) => !statuses || statuses.includes(o.status))
    .sort((a, b) => toEpoch(b.createdAt) - toEpoch(a.createdAt));
});
route('GET', '/api/opportunities/:id', ({ params }) => {
  const o = db.opportunities.find((x) => x.id === params.id);
  if (!o) throw notFound('Opportunity');
  return o;
});
function transition(ctx: Ctx, next: 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED' | 'OPEN') {
  const o = db.opportunities.find((x) => x.id === ctx.params.id);
  if (!o) throw notFound('Opportunity');
  if (next === 'DISMISSED' && !String(ctx.body.note ?? '').trim()) throw invalid({ note: 'Add a short reason so it isn\x27t raised again.' });
  if ((next === 'RESOLVED' || next === 'DISMISSED') && (o.status === 'RESOLVED' || o.status === 'DISMISSED')) throw conflict('This opportunity is already closed.');
  o.status = next;
  o.resolution =
    next === 'RESOLVED' || next === 'DISMISSED'
      ? { outcome: next === 'RESOLVED' ? 'ACTIONED' : 'DISMISSED', note: ctx.body.note?.trim() || undefined, at: now(), by: actorName(ctx) }
      : undefined;
  return o;
}
route('POST', '/api/opportunities/:id/start', (ctx) => transition(ctx, 'IN_PROGRESS'));
route('POST', '/api/opportunities/:id/resolve', (ctx) => transition(ctx, 'RESOLVED'));
route('POST', '/api/opportunities/:id/dismiss', (ctx) => transition(ctx, 'DISMISSED'));
route('POST', '/api/opportunities/:id/reopen', (ctx) => transition(ctx, 'OPEN'));

/* ------------------------------------------------------------------ pricing */

const courtLabel = (id: string | null) => (id ? (db.courts.find((c) => c.id === id)?.name ?? 'Deleted court') : 'All courts');
const ruleView = (r: PricingRule) => ({ ...r, courtName: courtLabel(r.courtId) });

function validateRule(body: PricingRuleInput, id?: string) {
  const errors: Record<string, string> = {};
  if (!String(body.name ?? '').trim()) errors.name = 'Name this rate, for example "Evening peak".';
  if (!Array.isArray(body.weekdays) || body.weekdays.length === 0) errors.weekdays = 'Choose at least one day.';
  if (!CLOCK.test(body.startTime ?? '') || !CLOCK.test(body.endTime ?? '')) errors.startTime = 'Choose a start and end time.';
  else if (minutesOf(body.endTime) <= minutesOf(body.startTime)) errors.endTime = 'The end time must be after the start time.';
  if (!(Number(body.hourlyRate) > 0)) errors.hourlyRate = 'Enter an hourly rate above zero.';
  if (body.courtId) findCourt(body.courtId);
  if (Object.keys(errors).length) throw invalid(errors);
  if (body.active) {
    const clash = db.rules.find(
      (r) =>
        r.id !== id &&
        r.active &&
        r.courtId === body.courtId &&
        r.weekdays.some((d) => body.weekdays.includes(d)) &&
        minutesOf(r.startTime) < minutesOf(body.endTime) &&
        minutesOf(body.startTime) < minutesOf(r.endTime),
    );
    if (clash) throw conflict(`This overlaps "${clash.name}" (${fmtClock(clash.startTime)} - ${fmtClock(clash.endTime)}) on ${courtLabel(clash.courtId)}. Change the days or times.`, 'RULE_OVERLAP');
  }
}

route('GET', '/api/pricing/rules', ({ q }) => db.rules.filter((r) => !q.courtId || r.courtId === q.courtId || r.courtId === null).map(ruleView));
route('GET', '/api/pricing/rules/:id', ({ params }) => {
  const r = db.rules.find((x) => x.id === params.id);
  if (!r) throw notFound('Pricing rule');
  return ruleView(r);
});
route('POST', '/api/pricing/rules', (ctx) => {
  const body = ctx.body as PricingRuleInput;
  validateRule(body);
  const r: PricingRule = { id: newId('rule'), name: body.name.trim(), courtId: body.courtId ?? null, weekdays: [...body.weekdays].sort(), startTime: body.startTime, endTime: body.endTime, hourlyRate: round2(Number(body.hourlyRate)), active: !!body.active, updatedAt: now() };
  db.rules.push(r);
  logPricing(ctx, 'RULE', r.name, `Created: ${courtLabel(r.courtId)}, ${fmtClock(r.startTime)} - ${fmtClock(r.endTime)}, ${fmtMoney(r.hourlyRate)} per hour`);
  return ruleView(r);
});
route('PATCH', '/api/pricing/rules/:id', (ctx) => {
  const r = db.rules.find((x) => x.id === ctx.params.id);
  if (!r) throw notFound('Pricing rule');
  const next = { ...r, ...ctx.body } as PricingRule;
  validateRule(next, r.id);
  const changes: string[] = [];
  if (next.hourlyRate !== r.hourlyRate) changes.push(`rate changed from ${fmtMoney(r.hourlyRate)} to ${fmtMoney(Number(next.hourlyRate))} per hour`);
  if (next.startTime !== r.startTime || next.endTime !== r.endTime) changes.push(`hours changed to ${fmtClock(next.startTime)} - ${fmtClock(next.endTime)}`);
  if (next.active !== r.active) changes.push(next.active ? 'activated' : 'deactivated');
  if (next.name !== r.name) changes.push(`renamed from "${r.name}"`);
  Object.assign(r, { ...next, name: next.name.trim(), hourlyRate: round2(Number(next.hourlyRate)), weekdays: [...next.weekdays].sort(), updatedAt: now() });
  if (changes.length) logPricing(ctx, 'RULE', r.name, changes.join(', ').replace(/^./, (s) => s.toUpperCase()));
  return ruleView(r);
});
route('DELETE', '/api/pricing/rules/:id', (ctx) => {
  const r = db.rules.find((x) => x.id === ctx.params.id);
  if (!r) throw notFound('Pricing rule');
  db.rules = db.rules.filter((x) => x.id !== r.id);
  logPricing(ctx, 'RULE', r.name, 'Deleted');
  return undefined;
});

function validateDiscount(body: DiscountInput, id?: string) {
  const errors: Record<string, string> = {};
  if (!String(body.name ?? '').trim()) errors.name = 'Name this discount.';
  if (body.code) {
    if (!/^[A-Z0-9]{3,16}$/.test(body.code)) errors.code = 'Use 3 to 16 capital letters or numbers.';
    else if (db.discounts.some((d) => d.id !== id && d.code === body.code)) errors.code = 'Another discount already uses this code.';
  }
  const value = Number(body.value);
  if (!(value > 0)) errors.value = 'Enter a value above zero.';
  else if (body.kind === 'PERCENT' && value > 100) errors.value = 'A percentage discount cannot be over 100%.';
  if (!DATE.test(body.validFrom ?? '')) errors.validFrom = 'Choose a start date.';
  if (body.validTo && body.validTo < body.validFrom) errors.validTo = 'The end date must be on or after the start date.';
  if ((body.startTime && !body.endTime) || (!body.startTime && body.endTime)) errors.endTime = 'Set both a start and end time, or neither.';
  else if (body.startTime && body.endTime && minutesOf(body.endTime) <= minutesOf(body.startTime)) errors.endTime = 'The end time must be after the start time.';
  if (body.maxUses !== undefined && body.maxUses !== null && !(Number(body.maxUses) >= 1)) errors.maxUses = 'Use 1 or more, or leave it empty for unlimited.';
  if (Object.keys(errors).length) throw invalid(errors);
}

const describeDiscount = (d: DiscountInput) =>
  `${d.kind === 'PERCENT' ? `${d.value}%` : fmtMoney(d.value)} off${d.courtIds.length ? ` on ${d.courtIds.map((c) => courtLabel(c)).join(', ')}` : ''}${d.startTime ? `, ${fmtClock(d.startTime)} - ${fmtClock(d.endTime!)}` : ''}`;

route('GET', '/api/pricing/discounts', () => [...db.discounts].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)));
route('GET', '/api/pricing/discounts/:id', ({ params }) => {
  const d = db.discounts.find((x) => x.id === params.id);
  if (!d) throw notFound('Discount');
  return d;
});
route('POST', '/api/pricing/discounts', (ctx) => {
  const body = ctx.body as DiscountInput;
  validateDiscount(body);
  const d: Discount = { ...body, id: newId('disc'), name: body.name.trim(), value: round2(Number(body.value)), usageCount: 0, updatedAt: now(), maxUses: body.maxUses ? Number(body.maxUses) : undefined };
  db.discounts.push(d);
  logPricing(ctx, 'DISCOUNT', d.name, `Created: ${describeDiscount(d)}`);
  return d;
});
route('PATCH', '/api/pricing/discounts/:id', (ctx) => {
  const d = db.discounts.find((x) => x.id === ctx.params.id);
  if (!d) throw notFound('Discount');
  const next = { ...d, ...ctx.body } as Discount;
  validateDiscount(next, d.id);
  const onlyToggle = Object.keys(ctx.body).length === 1 && 'active' in ctx.body;
  Object.assign(d, { ...next, name: next.name.trim(), value: round2(Number(next.value)), maxUses: next.maxUses ? Number(next.maxUses) : undefined, updatedAt: now() });
  logPricing(ctx, 'DISCOUNT', d.name, onlyToggle ? (d.active ? 'Activated' : 'Deactivated') : `Updated: ${describeDiscount(d)}`);
  return d;
});
route('DELETE', '/api/pricing/discounts/:id', (ctx) => {
  const d = db.discounts.find((x) => x.id === ctx.params.id);
  if (!d) throw notFound('Discount');
  if (d.usageCount > 0) throw conflict(`"${d.name}" has been used on ${d.usageCount} bookings, so it can't be deleted. Deactivate it instead.`, 'IN_USE');
  db.discounts = db.discounts.filter((x) => x.id !== d.id);
  logPricing(ctx, 'DISCOUNT', d.name, 'Deleted');
  return undefined;
});
route('GET', '/api/pricing/history', ({ q }) => paginate(db.pricingHistory, q));

/* ------------------------------------------------------------------ notifications */

const typeGroup: Record<string, string[]> = {
  BOOKING: ['BOOKING_REMINDER', 'BOOKING_CREATED', 'BOOKING_CANCELLED'],
  PAYMENT: ['PAYMENT_REMINDER', 'PAYMENT_RECEIVED'],
  SYSTEM: ['SYSTEM'],
};
route('GET', '/api/notifications', ({ q }) => {
  const list = db.notifications
    .filter((n) => (q.filter !== 'unread' || !n.read) && (!q.type || typeGroup[q.type]?.includes(n.type)))
    .sort((a, b) => toEpoch(b.createdAt) - toEpoch(a.createdAt));
  return paginate(list, q);
});
route('GET', '/api/notifications/unread-count', () => ({ count: db.notifications.filter((n) => !n.read).length }));
route('POST', '/api/notifications/read-all', () => {
  db.notifications.forEach((n) => (n.read = true));
  return undefined;
});
route('GET', '/api/notifications/:id', ({ params }) => {
  const n = db.notifications.find((x) => x.id === params.id);
  if (!n) throw notFound('Notification');
  return n;
});
route('POST', '/api/notifications/:id/read', ({ params }) => {
  const n = db.notifications.find((x) => x.id === params.id);
  if (!n) throw notFound('Notification');
  n.read = true;
  return n;
});
route('POST', '/api/notifications/:id/unread', ({ params }) => {
  const n = db.notifications.find((x) => x.id === params.id);
  if (!n) throw notFound('Notification');
  n.read = false;
  return n;
});

/* ------------------------------------------------------------------ billing */

route('GET', '/api/billing/subscription', () => db.subscription);

/** DEVELOPMENT MOCK SERVER. Read models: every derived number is computed here, never in the app. */

import { addDays, daysBetween, todayIn } from '@/lib/datetime';
import type {
  Analytics,
  AvailabilitySlot,
  Booking,
  BookingDetail,
  Court,
  CourtAvailability,
  CourtSummary,
  Customer,
  CustomerDetail,
  OutstandingBalance,
  Payment,
  PaymentStatus,
  Weekday,
} from '@/domain/types';
import type { FacilityDashboard } from '@/features/dashboard/types/facilityDashboard.types';

import { db, type StoredBooking, type StoredCustomer, type StoredPayment } from './db';
import { quote } from './pricing';
import { clockOf, dateOf, minutesOf, naive, nowNaive, overlaps, round2, toEpoch, weekdayOf } from './util';

export const now = () => nowNaive(db.facility.timezone);
export const today = () => todayIn(db.facility.timezone);

const courtName = (id: string) => db.courts.find((c) => c.id === id)?.name ?? 'Deleted court';
const customerOf = (id: string) => db.customers.find((c) => c.id === id);

export const paidFor = (bookingId: string) => db.payments.filter((p) => p.bookingId === bookingId).reduce((s, p) => s + p.amount, 0);

export function bookingView(b: StoredBooking): Booking {
  const total = round2(b.price - b.discountAmount);
  const paid = round2(paidFor(b.id));
  const cancelled = b.status === 'CANCELLED';
  const outstanding = cancelled ? 0 : round2(Math.max(0, total - paid));
  let paymentStatus: PaymentStatus = paid <= 0 ? 'UNPAID' : outstanding > 0 ? 'PARTIALLY_PAID' : 'PAID';
  if (cancelled && b.refunded && paid > 0) paymentStatus = 'REFUNDED';
  const customer = customerOf(b.customerId);
  return {
    id: b.id,
    reference: b.reference,
    courtId: b.courtId,
    courtName: courtName(b.courtId),
    customerId: b.customerId,
    customerName: customer?.name ?? 'Deleted customer',
    customerPhone: customer?.phone ?? '',
    startAt: b.startAt,
    endAt: b.endAt,
    status: b.status,
    paymentStatus,
    price: b.price,
    discountAmount: b.discountAmount,
    discountName: b.discountName,
    total,
    paid,
    outstanding,
    notes: b.notes,
    cancelReason: b.cancelReason,
    createdAt: b.createdAt,
  };
}

export function paymentView(p: StoredPayment): Payment {
  const booking = db.bookings.find((b) => b.id === p.bookingId);
  return { ...p, bookingReference: booking?.reference ?? '', customerName: customerOf(p.customerId)?.name ?? 'Deleted customer' };
}

export function bookingDetailView(b: StoredBooking): BookingDetail {
  return {
    ...bookingView(b),
    history: [...b.history].sort((x, y) => toEpoch(y.at) - toEpoch(x.at)),
    payments: db.payments.filter((p) => p.bookingId === b.id).map(paymentView).sort((x, y) => toEpoch(y.receivedAt) - toEpoch(x.receivedAt)),
  };
}

export function customerView(c: StoredCustomer): Customer {
  const mine = db.bookings.filter((b) => b.customerId === c.id);
  const live = mine.filter((b) => b.status !== 'CANCELLED').map(bookingView);
  // Balances count bookings up to today; future games are usually paid at the venue.
  const due = live.filter((b) => dateOf(b.startAt) <= today());
  const spent = db.payments.filter((p) => p.customerId === c.id).reduce((s, p) => s + p.amount, 0);
  const last = [...mine].sort((a, b) => toEpoch(b.startAt) - toEpoch(a.startAt))[0];
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    status: c.status,
    isRegular: c.isRegular,
    regularSlot: c.regularSlot ? { ...c.regularSlot, courtName: courtName(c.regularSlot.courtId) } : undefined,
    createdAt: c.createdAt,
    totalBookings: live.length,
    totalSpent: round2(spent),
    outstanding: round2(due.reduce((s, b) => s + b.outstanding, 0)),
    lastBookingAt: last?.startAt,
  };
}

export function customerDetailView(c: StoredCustomer): CustomerDetail {
  const mine = db.bookings.filter((b) => b.customerId === c.id);
  return {
    ...customerView(c),
    notes: [...c.notes].sort((a, b) => toEpoch(b.createdAt) - toEpoch(a.createdAt)),
    cancellations: mine.filter((b) => b.status === 'CANCELLED').length,
    noShows: mine.filter((b) => b.status === 'NO_SHOW').length,
  };
}

/* ----- availability & utilization ----- */

function hoursFor(date: string) {
  return db.facility.businessHours[weekdayOf(date)];
}

export function availability(court: Court, date: string): CourtAvailability {
  const hours = hoursFor(date);
  const step = court.slotMinutes;
  const slots: AvailabilitySlot[] = [];
  const current = now();
  if (!hours.closed) {
    const booked = db.bookings.filter((b) => b.courtId === court.id && b.status !== 'CANCELLED' && dateOf(b.startAt) === date);
    for (let m = minutesOf(hours.open); m + step <= minutesOf(hours.close); m += step) {
      const startAt = naive(date, m);
      const endAt = naive(date, m + step);
      const hit = booked.find((b) => overlaps(b.startAt, b.endAt, startAt, endAt));
      if (hit) {
        slots.push({ startAt, endAt, status: 'BOOKED', bookingId: hit.id, customerName: customerOf(hit.customerId)?.name });
      } else if (court.status !== 'ACTIVE') {
        slots.push({ startAt, endAt, status: 'CLOSED' });
      } else if (toEpoch(startAt) < toEpoch(current)) {
        slots.push({ startAt, endAt, status: 'PAST' });
      } else {
        slots.push({ startAt, endAt, status: 'FREE', rate: quote(court, db.rules, startAt, naive(date, m + 60)).price });
      }
    }
  }
  return { courtId: court.id, date, slotMinutes: step, slots };
}

function openMinutes(date: string) {
  const h = hoursFor(date);
  return h.closed ? 0 : minutesOf(h.close) - minutesOf(h.open);
}

function bookedMinutes(courtId: string, startDate: string, endDate: string) {
  return db.bookings
    .filter((b) => b.courtId === courtId && b.status !== 'CANCELLED' && dateOf(b.startAt) >= startDate && dateOf(b.startAt) <= endDate)
    .reduce((s, b) => s + (toEpoch(b.endAt) - toEpoch(b.startAt)) / 60000, 0);
}

function dates(startDate: string, endDate: string) {
  const out: string[] = [];
  for (let d = startDate; d <= endDate; d = addDays(d, 1)) out.push(d);
  return out;
}

function courtUtilization(court: Court, startDate: string, endDate: string) {
  const open = dates(startDate, endDate).reduce((s, d) => s + openMinutes(d), 0);
  const booked = bookedMinutes(court.id, startDate, endDate);
  return {
    percentage: open ? round2((booked / open) * 100) : 0,
    bookedSlots: Math.round(booked / court.slotMinutes),
    totalSlots: Math.round(open / court.slotMinutes),
  };
}

export function courtSummaryView(court: Court): CourtSummary {
  const t = today();
  const u = courtUtilization(court, t, t);
  const current = now();
  const upcoming = db.bookings.filter((b) => b.courtId === court.id && b.status !== 'CANCELLED' && toEpoch(b.startAt) > toEpoch(current)).length;
  const revenue30d = db.bookings
    .filter((b) => b.courtId === court.id && b.status !== 'CANCELLED' && dateOf(b.startAt) >= addDays(t, -29) && dateOf(b.startAt) <= t)
    .reduce((s, b) => s + b.price - b.discountAmount, 0);
  return {
    ...court,
    todayUtilization: court.status === 'ACTIVE' ? u.percentage : 0,
    todayBookedSlots: u.bookedSlots,
    todayTotalSlots: court.status === 'ACTIVE' ? u.totalSlots : 0,
    upcomingBookings: upcoming,
    revenue30d: round2(revenue30d),
  };
}

export function outstandingBalances(): OutstandingBalance[] {
  const t = today();
  return db.bookings
    .map(bookingView)
    .filter((b) => b.outstanding > 0 && dateOf(b.startAt) <= t)
    .map((b) => ({
      id: b.id,
      reference: b.reference,
      customerId: b.customerId,
      customerName: b.customerName,
      courtName: b.courtName,
      startAt: b.startAt,
      endAt: b.endAt,
      total: b.total,
      paid: b.paid,
      outstanding: b.outstanding,
      paymentStatus: b.paymentStatus,
      daysOverdue: Math.max(0, daysBetween(dateOf(b.startAt), t)),
    }));
}

/* ----- dashboard ----- */

function periodTotals(startDate: string, endDate: string) {
  const inRange = db.bookings.filter((b) => b.status !== 'CANCELLED' && dateOf(b.startAt) >= startDate && dateOf(b.startAt) <= endDate);
  return { revenue: inRange.reduce((s, b) => s + b.price - b.discountAmount, 0), count: inRange.length };
}

const pct = (current: number, previous: number) => (previous > 0 ? round2(((current - previous) / previous) * 100) : null);

export function dashboardView(startDate: string, endDate: string): FacilityDashboard {
  const span = daysBetween(startDate, endDate) + 1;
  const prevEnd = addDays(startDate, -1);
  const prevStart = addDays(prevEnd, -(span - 1));
  const cur = periodTotals(startDate, endDate);
  const prev = periodTotals(prevStart, prevEnd);
  const active = db.courts.filter((c) => c.status === 'ACTIVE');
  const utils = active.map((c) => ({ court: c, u: courtUtilization(c, startDate, endDate) }));
  const prevUtils = active.map((c) => courtUtilization(c, prevStart, prevEnd));
  const booked = utils.reduce((s, x) => s + x.u.bookedSlots, 0);
  const total = utils.reduce((s, x) => s + x.u.totalSlots, 0);
  const prevBooked = prevUtils.reduce((s, x) => s + x.bookedSlots, 0);
  const prevTotal = prevUtils.reduce((s, x) => s + x.totalSlots, 0);
  const utilization = total ? round2((booked / total) * 100) : 0;
  const prevUtilization = prevTotal ? (prevBooked / prevTotal) * 100 : 0;
  const balances = outstandingBalances().sort((a, b) => b.outstanding - a.outstanding);

  const recent = db.bookings
    .filter((b) => dateOf(b.startAt) >= startDate && dateOf(b.startAt) <= endDate)
    .sort((a, b) => toEpoch(b.createdAt) - toEpoch(a.createdAt))
    .slice(0, 6)
    .map(bookingView);

  return {
    period: { startDate, endDate },
    currency: db.facility.currency,
    summary: {
      revenue: { amount: round2(cur.revenue), changePercent: pct(cur.revenue, prev.revenue) },
      bookings: { count: cur.count, change: cur.count - prev.count },
      utilization: { percentage: utilization, bookedSlots: booked, totalSlots: total, changePercent: prevTotal ? round2(utilization - prevUtilization) : null },
      outstanding: { amount: round2(balances.reduce((s, b) => s + b.outstanding, 0)), bookingCount: balances.length },
    },
    courts: utils.map(({ court, u }) => ({
      id: court.id,
      name: court.name,
      sport: court.sport,
      utilizationPercentage: u.percentage,
      bookedSlots: u.bookedSlots,
      totalSlots: u.totalSlots,
      revenue: round2(
        db.bookings
          .filter((b) => b.courtId === court.id && b.status !== 'CANCELLED' && dateOf(b.startAt) >= startDate && dateOf(b.startAt) <= endDate)
          .reduce((s, b) => s + b.price - b.discountAmount, 0),
      ),
    })),
    opportunities: db.opportunities.filter((o) => o.status === 'OPEN').slice(0, 3),
    outstandingPayments: balances.slice(0, 5).map((b) => ({
      bookingId: b.id,
      customerId: b.customerId,
      customerName: b.customerName,
      courtName: b.courtName,
      startAt: b.startAt,
      endAt: b.endAt,
      outstandingAmount: b.outstanding,
      currency: db.facility.currency,
      status: b.paymentStatus === 'PARTIALLY_PAID' ? 'PARTIALLY_PAID' : 'UNPAID',
    })),
    recentBookings: recent.map((b) => ({
      bookingId: b.id,
      customerName: b.customerName,
      courtName: b.courtName,
      startAt: b.startAt,
      endAt: b.endAt,
      amount: b.total,
      status: b.status === 'CANCELLED' ? 'CANCELLED' : b.status === 'PENDING' ? 'PENDING' : b.paymentStatus === 'REFUNDED' ? 'PAID' : b.paymentStatus,
    })),
    capabilities: { paymentReminders: true },
  };
}

/* ----- analytics ----- */

export function analyticsView(startDate: string, endDate: string): Analytics {
  const span = daysBetween(startDate, endDate) + 1;
  const prevEnd = addDays(startDate, -1);
  const prevStart = addDays(prevEnd, -(span - 1));
  const inRange = db.bookings.filter((b) => dateOf(b.startAt) >= startDate && dateOf(b.startAt) <= endDate);
  const live = inRange.filter((b) => b.status !== 'CANCELLED');
  const cur = periodTotals(startDate, endDate);
  const prev = periodTotals(prevStart, prevEnd);
  const days = dates(startDate, endDate);
  const active = db.courts.filter((c) => c.status !== 'INACTIVE' || live.some((b) => b.courtId === c.id));

  const byCourt = active.map((c) => ({ courtId: c.id, courtName: c.name, utilization: courtUtilization(c, startDate, endDate).percentage }));
  const openTotal = active.length * days.reduce((s, d) => s + openMinutes(d), 0);
  const bookedTotal = active.reduce((s, c) => s + bookedMinutes(c.id, startDate, endDate), 0);

  const spentBy = new Map<string, { spent: number; bookings: number }>();
  for (const b of live) {
    const entry = spentBy.get(b.customerId) ?? { spent: 0, bookings: 0 };
    entry.spent += b.price - b.discountAmount;
    entry.bookings += 1;
    spentBy.set(b.customerId, entry);
  }
  const newCustomers = db.customers.filter((c) => dateOf(c.createdAt) >= startDate && dateOf(c.createdAt) <= endDate && spentBy.has(c.id)).length;

  const balances = outstandingBalances();
  const agingBucket = (days: number) => (days <= 7 ? '0-7 days' : days <= 30 ? '8-30 days' : 'Over 30 days');
  const aging = ['0-7 days', '8-30 days', 'Over 30 days'].map((label) => ({
    label,
    amount: round2(balances.filter((b) => agingBucket(b.daysOverdue) === label).reduce((s, b) => s + b.outstanding, 0)),
  }));

  const cancelled = inRange.filter((b) => b.status === 'CANCELLED');
  const reasons = new Map<string, number>();
  cancelled.forEach((b) => reasons.set(b.cancelReason ?? 'No reason given', (reasons.get(b.cancelReason ?? 'No reason given') ?? 0) + 1));

  const peakHours: Analytics['peakHours'] = [];
  const openCourts = db.courts.filter((c) => c.status === 'ACTIVE').length || 1;
  for (let weekday = 0; weekday < 7; weekday++) {
    const matching = days.filter((d) => weekdayOf(d) === weekday);
    for (let hour = 7; hour < 23; hour++) {
      const capacity = matching.length * openCourts * 60;
      let booked = 0;
      for (const b of live) {
        if (!matching.includes(dateOf(b.startAt))) continue;
        const s = minutesOf(clockOf(b.startAt));
        const e = s + (toEpoch(b.endAt) - toEpoch(b.startAt)) / 60000;
        booked += Math.max(0, Math.min(e, (hour + 1) * 60) - Math.max(s, hour * 60));
      }
      peakHours.push({ weekday: weekday as Weekday, hour, utilization: capacity ? Math.min(100, round2((booked / capacity) * 100)) : 0 });
    }
  }

  return {
    period: { startDate, endDate },
    currency: db.facility.currency,
    revenue: {
      total: round2(cur.revenue),
      changePercent: pct(cur.revenue, prev.revenue),
      byDay: days.map((date) => ({ date, amount: round2(live.filter((b) => dateOf(b.startAt) === date).reduce((s, b) => s + b.price - b.discountAmount, 0)) })),
    },
    bookings: {
      total: cur.count,
      changePercent: pct(cur.count, prev.count),
      averagePerDay: round2(cur.count / span),
      averageValue: cur.count ? Math.round(cur.revenue / cur.count) : 0,
    },
    utilization: { overall: openTotal ? round2((bookedTotal / openTotal) * 100) : 0, byCourt },
    revenueByCourt: active
      .map((c) => ({ courtId: c.id, courtName: c.name, amount: round2(live.filter((b) => b.courtId === c.id).reduce((s, b) => s + b.price - b.discountAmount, 0)) }))
      .sort((a, b) => b.amount - a.amount),
    customers: {
      active: spentBy.size,
      new: newCustomers,
      returning: spentBy.size - newCustomers,
      top: [...spentBy.entries()]
        .sort((a, b) => b[1].spent - a[1].spent)
        .slice(0, 5)
        .map(([customerId, v]) => ({ customerId, name: customerOf(customerId)?.name ?? '', spent: round2(v.spent), bookings: v.bookings })),
    },
    outstanding: { total: round2(balances.reduce((s, b) => s + b.outstanding, 0)), bookingCount: balances.length, aging },
    cancellations: {
      count: cancelled.length,
      rate: inRange.length ? round2((cancelled.length / inRange.length) * 100) : 0,
      noShows: inRange.filter((b) => b.status === 'NO_SHOW').length,
      reasons: [...reasons.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
    },
    peakHours,
  };
}

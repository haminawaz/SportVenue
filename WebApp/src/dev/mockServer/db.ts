/**
 * DEVELOPMENT MOCK SERVER. In-memory data, seeded deterministically.
 * Sample data only; resets when the app reloads.
 */

import { addDays, todayIn } from '@/lib/datetime';
import type {
  AppNotification,
  BookingEvent,
  BookingStatus,
  Court,
  Customer,
  CustomerNote,
  Discount,
  Facility,
  NotificationPreferences,
  Opportunity,
  Payment,
  PaymentMethod,
  PricingHistoryEntry,
  PricingRule,
  Subscription,
  UserProfile,
  Weekday,
} from '@/domain/types';

import { quote } from './pricing';
import { dateOf, minutesOf, naive, nowNaive, rng, toEpoch, weekdayOf } from './util';

export type StoredCustomer = Omit<Customer, 'totalBookings' | 'totalSpent' | 'outstanding' | 'lastBookingAt' | 'regularSlot'> & {
  regularSlot?: { courtId: string; weekday: Weekday; startTime: string; durationMinutes: number };
  notes: CustomerNote[];
};

export type StoredBooking = {
  id: string;
  reference: string;
  courtId: string;
  customerId: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  price: number;
  discountAmount: number;
  discountId?: string;
  discountName?: string;
  notes?: string;
  cancelReason?: string;
  refunded?: boolean;
  createdAt: string;
  history: BookingEvent[];
};

export type StoredPayment = Omit<Payment, 'bookingReference' | 'customerName'>;

export const DEMO_PASSWORD = 'sportvenue123';

type Db = {
  facility: Facility;
  courts: Court[];
  customers: StoredCustomer[];
  bookings: StoredBooking[];
  payments: StoredPayment[];
  rules: PricingRule[];
  discounts: Discount[];
  pricingHistory: PricingHistoryEntry[];
  opportunities: Opportunity[];
  notifications: AppNotification[];
  users: UserProfile[];
  preferences: NotificationPreferences;
  subscription: Subscription;
  sessions: Map<string, string>;
  bookingSeq: number;
};

const TZ = 'Asia/Karachi';
const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5];

function seed(): Db {
  const random = rng(20260929);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(random() * arr.length)];
  const today = todayIn(TZ);
  const now = nowNaive(TZ);
  const at = (dayOffset: number, clock: string) => `${addDays(today, dayOffset)}T${clock}:00`;

  const facility: Facility = {
    id: 'facility_baseline',
    name: 'Baseline Padel Club',
    description: 'Three glass-walled padel courts, a floodlit futsal pitch and a squash court in DHA Phase 6.',
    sports: ['Padel', 'Futsal', 'Squash'],
    address: 'Plot 14, Sector C, DHA Phase 6',
    city: 'Lahore',
    phone: '+92 300 4417206',
    email: 'desk@baselinepadel.pk',
    website: 'baselinepadel.pk',
    timezone: TZ,
    currency: 'PKR',
    businessHours: ALL_DAYS.map((weekday) => ({
      weekday,
      closed: false,
      open: weekday === 0 ? '08:00' : '07:00',
      close: weekday === 0 ? '22:00' : '23:00',
    })),
    settings: { defaultSlotMinutes: 60, bufferMinutes: 0, cancellationWindowHours: 12, bookingLeadDays: 30 },
  };

  const courts: Court[] = [
    { id: 'court_1', name: 'Court 1', sport: 'Padel', surface: 'Panoramic glass, artificial turf', indoor: true, status: 'ACTIVE', hourlyRate: 5000, slotMinutes: 60, createdAt: at(-400, '10:00') },
    { id: 'court_2', name: 'Court 2', sport: 'Padel', surface: 'Artificial turf', indoor: false, status: 'ACTIVE', hourlyRate: 4500, slotMinutes: 60, createdAt: at(-400, '10:00') },
    { id: 'court_3', name: 'Court 3', sport: 'Padel', surface: 'Artificial turf', indoor: true, status: 'MAINTENANCE', hourlyRate: 5000, slotMinutes: 60, notes: 'Glass panel replacement. Expected back next week.', createdAt: at(-200, '10:00') },
    { id: 'court_4', name: 'Futsal Pitch', sport: 'Futsal', surface: '3G turf, floodlit', indoor: false, status: 'ACTIVE', hourlyRate: 9000, slotMinutes: 60, createdAt: at(-380, '10:00') },
    { id: 'court_5', name: 'Squash Court', sport: 'Squash', surface: 'Maple wood', indoor: true, status: 'INACTIVE', hourlyRate: 2500, slotMinutes: 60, notes: 'Closed for the season.', createdAt: at(-380, '10:00') },
  ];

  const rules: PricingRule[] = [
    { id: 'rule_1', name: 'Evening peak', courtId: 'court_1', weekdays: WEEKDAYS, startTime: '18:00', endTime: '23:00', hourlyRate: 6500, active: true, updatedAt: at(-60, '11:20') },
    { id: 'rule_2', name: 'Evening peak', courtId: 'court_2', weekdays: WEEKDAYS, startTime: '18:00', endTime: '23:00', hourlyRate: 5500, active: true, updatedAt: at(-60, '11:22') },
    { id: 'rule_3', name: 'Weekend', courtId: 'court_1', weekdays: [0, 6], startTime: '07:00', endTime: '23:00', hourlyRate: 6500, active: true, updatedAt: at(-45, '09:05') },
    { id: 'rule_4', name: 'Morning off-peak', courtId: 'court_2', weekdays: WEEKDAYS, startTime: '07:00', endTime: '12:00', hourlyRate: 3500, active: true, updatedAt: at(-30, '16:40') },
    { id: 'rule_5', name: 'Floodlit evenings', courtId: 'court_4', weekdays: ALL_DAYS, startTime: '18:00', endTime: '23:00', hourlyRate: 11000, active: true, updatedAt: at(-90, '12:00') },
  ];

  const discounts: Discount[] = [
    { id: 'disc_1', name: 'Weekday afternoons', kind: 'PERCENT', value: 15, courtIds: ['court_2'], validFrom: addDays(today, -20), weekdays: WEEKDAYS, startTime: '13:00', endTime: '17:00', usageCount: 11, active: true, updatedAt: at(-20, '10:00') },
    { id: 'disc_2', name: 'Student rate', code: 'STUDENT10', kind: 'PERCENT', value: 10, courtIds: [], validFrom: addDays(today, -120), weekdays: [], usageCount: 37, active: true, updatedAt: at(-120, '10:00') },
    { id: 'disc_3', name: 'League night', code: 'LEAGUE1000', kind: 'AMOUNT', value: 1000, courtIds: ['court_4'], validFrom: addDays(today, -90), validTo: addDays(today, -10), weekdays: [3], usageCount: 9, maxUses: 40, active: false, updatedAt: at(-10, '18:00') },
  ];

  const customerNames = [
    'Ahmed Khan', 'Hira Malik', 'Bilal Siddiqui', 'Sana Javed', 'Faisal Raza', 'Zainab Qureshi', 'Usman Tariq', 'Mariam Aslam',
    'Hamza Sheikh', 'Ayesha Butt', 'Omar Farooq', 'Fatima Nadeem', 'Saad Chaudhry', 'Mahnoor Iqbal', 'Ali Haider', 'Rabia Anwar',
    'Danish Mirza', 'Iqra Rehman', 'Taimur Hassan', 'Noor ul Ain Abbasi', 'Shehryar Awan', 'Laiba Zafar', 'Muhammad Abdullah Rizwan Siddiqui',
    'Kiran Yousaf', 'Asad Mehmood', 'Emaan Saleem', 'Junaid Akhtar', 'Sadia Khalid',
  ];
  const customers: StoredCustomer[] = customerNames.map((name, i) => {
    const slug = name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/\.$/, '');
    return {
      id: `cust_${i + 1}`,
      name,
      phone: `+92 3${String(10 + ((i * 7) % 40)).padStart(2, '0')} ${String(2000000 + (((i + 3) * 2654435761) % 7999999)).padStart(7, '0')}`,
      email: i % 3 === 2 ? undefined : `${slug}@gmail.com`,
      status: i === 26 ? 'INACTIVE' : 'ACTIVE',
      isRegular: i < 6,
      createdAt: at(-300 + i * 9, '12:00'),
      notes: [],
    };
  });
  customers[0].regularSlot = { courtId: 'court_1', weekday: 2, startTime: '20:00', durationMinutes: 60 };
  customers[1].regularSlot = { courtId: 'court_2', weekday: 4, startTime: '18:30', durationMinutes: 90 };
  customers[2].regularSlot = { courtId: 'court_1', weekday: 5, startTime: '19:00', durationMinutes: 60 };
  customers[5].regularSlot = { courtId: 'court_1', weekday: 4, startTime: '19:00', durationMinutes: 60 };
  customers[6].regularSlot = { courtId: 'court_4', weekday: 6, startTime: '21:00', durationMinutes: 90 };
  customers[0].notes.push({ id: 'note_1', body: 'Prefers Court 1. Pays by bank transfer at the end of the month.', createdAt: at(-40, '14:10'), author: 'Hamid Nawaz' });
  customers[6].notes.push({ id: 'note_2', body: 'Captain of the Saturday futsal league team (10 players).', createdAt: at(-75, '21:40'), author: 'Hamid Nawaz' });
  customers[4].notes.push({ id: 'note_3', body: 'Two late cancellations in August. Ask for advance payment on weekend slots.', createdAt: at(-25, '11:00'), author: 'Hamid Nawaz' });

  /* ----- bookings and payments ----- */
  const bookings: StoredBooking[] = [];
  const payments: StoredPayment[] = [];
  const activeCourts = courts.filter((c) => c.id !== 'court_5');
  const weighted = customers.filter((c) => c.status === 'ACTIVE').flatMap((c, i) => (i < 6 ? [c, c, c, c] : [c]));
  const methods: PaymentMethod[] = ['CASH', 'CASH', 'CASH', 'BANK_TRANSFER', 'CARD', 'WALLET'];
  const cancelReasons = ['Weather', 'Player unavailable', 'Rescheduled by customer', 'Double booking', 'Illness'];
  let seq = 1040;

  for (let offset = -42; offset <= 12; offset++) {
    const date = addDays(today, offset);
    const weekday = weekdayOf(date);
    const hours = facility.businessHours[weekday];
    for (const court of activeCourts) {
      // Court 3 went into maintenance 5 days ago.
      if (court.id === 'court_3' && offset > -5) continue;
      let cursor = minutesOf(hours.open);
      const close = minutesOf(hours.close);
      while (cursor + 60 <= close) {
        const hour = Math.floor(cursor / 60);
        const peak = hour >= 18 && hour < 23;
        const weekend = weekday === 0 || weekday === 6;
        let p = peak ? 0.78 : hour < 12 ? 0.3 : 0.18;
        if (weekend) p += 0.15;
        if (court.id === 'court_2' && hour >= 13 && hour < 17 && !weekend) p = 0.06;
        if (court.id === 'court_4' && !peak) p *= 0.5;
        if (offset > 0) p *= Math.max(0.25, 1 - offset * 0.07);
        if (random() > p) {
          cursor += 60;
          continue;
        }
        const duration = court.id === 'court_4' || random() < 0.25 ? 90 : 60;
        if (cursor + duration > close) break;
        const startAt = naive(date, cursor);
        const endAt = naive(date, cursor + duration);
        const customer = pick(weighted);
        const q = quote(court, rules, startAt, endAt);
        const past = toEpoch(endAt) <= toEpoch(now);
        let status: BookingStatus = past ? 'COMPLETED' : random() < 0.1 ? 'PENDING' : 'CONFIRMED';
        const roll = random();
        if (roll < 0.06) status = 'CANCELLED';
        else if (past && roll < 0.08) status = 'NO_SHOW';
        const id = `bk_${seq}`;
        const createdAt = naive(addDays(date, -Math.floor(random() * 6) - 1), 600 + Math.floor(random() * 600));
        const booking: StoredBooking = {
          id,
          reference: `BPC-${seq}`,
          courtId: court.id,
          customerId: customer.id,
          startAt,
          endAt,
          status,
          price: q.price,
          discountAmount: 0,
          createdAt,
          history: [{ id: `${id}_h1`, at: createdAt, type: 'CREATED', description: `Booked ${court.name}`, actor: pick(['Hamid Nawaz', 'Online booking', 'Online booking']) }],
        };
        if (status === 'CANCELLED') {
          booking.cancelReason = pick(cancelReasons);
          booking.history.push({ id: `${id}_h2`, at: naive(date, Math.max(cursor - 240, 0)), type: 'CANCELLED', description: `Cancelled: ${booking.cancelReason}`, actor: 'Hamid Nawaz' });
        }
        seq += 1;
        bookings.push(booking);

        if (status !== 'CANCELLED') {
          const payRoll = random();
          const fraction = past ? (payRoll < 0.93 ? 1 : payRoll < 0.97 ? 0.5 : 0) : payRoll < 0.4 ? 1 : payRoll < 0.6 ? 0.4 : 0;
          const amount = Math.round(q.price * fraction);
          if (amount > 0) {
            const receivedAt = past ? naive(date, cursor + duration) : createdAt;
            payments.push({
              id: `pay_${payments.length + 1}`,
              bookingId: id,
              customerId: customer.id,
              amount,
              method: pick(methods),
              receivedAt,
              recordedBy: 'Hamid Nawaz',
            });
            booking.history.push({ id: `${id}_h3`, at: receivedAt, type: 'PAYMENT', description: `Payment received`, actor: 'Hamid Nawaz' });
          }
        }
        cursor += duration;
      }
    }
  }

  const bookingRef = (id: string) => bookings.find((b) => b.id === id);
  const outstandingOf = (b: StoredBooking) =>
    b.status === 'CANCELLED' ? 0 : Math.max(0, b.price - b.discountAmount - payments.filter((p) => p.bookingId === b.id).reduce((s, p) => s + p.amount, 0));
  const biggestDebt = [...bookings].filter((b) => toEpoch(b.startAt) < toEpoch(now)).sort((a, b) => outstandingOf(b) - outstandingOf(a))[0];
  const upcomingFriday = bookings.find((b) => b.courtId === 'court_1' && weekdayOf(dateOf(b.startAt)) === 5 && toEpoch(b.startAt) > toEpoch(now));
  const riskBooking = bookings.find((b) => b.customerId === 'cust_5' && toEpoch(b.startAt) > toEpoch(now) && b.status !== 'CANCELLED');
  const nextTuesday = (() => {
    let d = today;
    for (let i = 1; i <= 7; i++) {
      d = addDays(today, i);
      if (weekdayOf(d) === 2) break;
    }
    return d;
  })();

  const opportunities: Opportunity[] = [
    {
      id: 'opp_1',
      type: 'LOW_UTILIZATION',
      status: 'OPEN',
      title: 'Court 2 is quiet on weekday afternoons',
      description: 'Court 2 averaged 6% utilization between 1 PM and 5 PM on weekdays over the last 4 weeks.',
      courtId: 'court_2',
      courtName: 'Court 2',
      startAt: `${nextTuesday}T13:00:00`,
      endAt: `${nextTuesday}T17:00:00`,
      recommendedAction: { type: 'DISCOUNT', value: 15, unit: 'PERCENT', window: { weekdays: WEEKDAYS, startTime: '13:00', endTime: '17:00' } },
      potentialRevenue: 64000,
      createdAt: at(-2, '06:00'),
    },
    ...(biggestDebt
      ? [
          {
            id: 'opp_2',
            type: 'OUTSTANDING_PAYMENT',
            status: 'OPEN',
            title: `${customers.find((c) => c.id === biggestDebt.customerId)!.name} has an unpaid balance`,
            description: `The ${courts.find((c) => c.id === biggestDebt.courtId)!.name} booking on ${dateOf(biggestDebt.startAt)} has not been fully paid.`,
            courtId: biggestDebt.courtId,
            courtName: courts.find((c) => c.id === biggestDebt.courtId)!.name,
            bookingId: biggestDebt.id,
            bookingReference: biggestDebt.reference,
            customerId: biggestDebt.customerId,
            customerName: customers.find((c) => c.id === biggestDebt.customerId)!.name,
            recommendedAction: { type: 'REMIND' },
            potentialRevenue: outstandingOf(biggestDebt),
            createdAt: at(-1, '06:00'),
          } satisfies Opportunity,
        ]
      : []),
    {
      id: 'opp_3',
      type: 'REPEAT_CUSTOMER',
      status: 'OPEN',
      title: 'Zainab Qureshi has not booked in 3 weeks',
      description: 'She played Court 1 every Thursday at 7 PM until early September.',
      customerId: 'cust_6',
      customerName: 'Zainab Qureshi',
      courtId: 'court_1',
      courtName: 'Court 1',
      recommendedAction: { type: 'CONTACT' },
      potentialRevenue: 26000,
      createdAt: at(-3, '06:00'),
    },
    {
      id: 'opp_4',
      type: 'PRICE_OPPORTUNITY',
      status: 'IN_PROGRESS',
      title: 'Friday evenings on Court 1 sell out',
      description: 'Every Friday slot from 6 PM to 11 PM was booked for 6 weeks running, usually 4 or more days ahead.',
      courtId: 'court_1',
      courtName: 'Court 1',
      startAt: upcomingFriday?.startAt,
      endAt: upcomingFriday?.endAt,
      recommendedAction: { type: 'PRICE_INCREASE', value: 10, unit: 'PERCENT', window: { weekdays: [5], startTime: '18:00', endTime: '23:00' } },
      potentialRevenue: 32500,
      createdAt: at(-6, '06:00'),
    },
    ...(riskBooking
      ? [
          {
            id: 'opp_5',
            type: 'CANCELLATION_RISK',
            status: 'OPEN',
            title: 'Faisal Raza may cancel',
            description: 'Faisal cancelled 2 of his last 5 bookings less than 12 hours before start.',
            bookingId: riskBooking.id,
            bookingReference: riskBooking.reference,
            customerId: 'cust_5',
            customerName: 'Faisal Raza',
            courtId: riskBooking.courtId,
            courtName: courts.find((c) => c.id === riskBooking.courtId)!.name,
            startAt: riskBooking.startAt,
            endAt: riskBooking.endAt,
            recommendedAction: { type: 'CONTACT' },
            potentialRevenue: riskBooking.price,
            createdAt: at(-1, '06:00'),
          } satisfies Opportunity,
        ]
      : []),
    {
      id: 'opp_6',
      type: 'FULLY_BOOKED_PERIOD',
      status: 'RESOLVED',
      title: 'Saturday nights on the Futsal Pitch were full',
      description: 'Demand exceeded capacity for 5 straight Saturdays.',
      courtId: 'court_4',
      courtName: 'Futsal Pitch',
      recommendedAction: { type: 'PRICE_INCREASE', value: 10, unit: 'PERCENT' },
      potentialRevenue: 18000,
      createdAt: at(-30, '06:00'),
      resolution: { outcome: 'ACTIONED', note: 'Added the Floodlit evenings rate.', at: at(-28, '10:15'), by: 'Hamid Nawaz' },
    },
    {
      id: 'opp_7',
      type: 'LOW_UTILIZATION',
      status: 'DISMISSED',
      title: 'Squash Court bookings are down',
      description: 'Squash utilization fell below 10% in August.',
      courtId: 'court_5',
      courtName: 'Squash Court',
      createdAt: at(-40, '06:00'),
      resolution: { outcome: 'DISMISSED', note: 'Court closed for the season.', at: at(-38, '09:00'), by: 'Hamid Nawaz' },
    },
  ];

  const recentPaid = [...payments].sort((a, b) => toEpoch(b.receivedAt) - toEpoch(a.receivedAt))[0];
  const nextBooking = [...bookings].filter((b) => toEpoch(b.startAt) > toEpoch(now) && b.status !== 'CANCELLED').sort((a, b) => toEpoch(a.startAt) - toEpoch(b.startAt))[0];
  const lastCancelled = [...bookings].filter((b) => b.status === 'CANCELLED').sort((a, b) => toEpoch(b.startAt) - toEpoch(a.startAt))[0];
  const nameOf = (id: string) => customers.find((c) => c.id === id)!.name;
  const courtOf = (id: string) => courts.find((c) => c.id === id)!.name;
  const minutesAgo = (m: number) => {
    const t = new Date(toEpoch(now) - m * 60000).toISOString().slice(0, 19);
    return t;
  };

  const notifications: AppNotification[] = [
    ...(nextBooking
      ? [{ id: 'ntf_1', type: 'BOOKING_REMINDER' as const, title: `Upcoming: ${courtOf(nextBooking.courtId)}`, body: `${nameOf(nextBooking.customerId)} is booked for ${nextBooking.startAt.slice(11, 16)}. The court should be ready 10 minutes before.`, createdAt: minutesAgo(12), read: false, link: { kind: 'booking' as const, id: nextBooking.id } }]
      : []),
    ...(recentPaid
      ? [{ id: 'ntf_2', type: 'PAYMENT_RECEIVED' as const, title: 'Payment received', body: `${nameOf(recentPaid.customerId)} paid for booking ${bookingRef(recentPaid.bookingId)?.reference}.`, createdAt: minutesAgo(48), read: false, link: { kind: 'payment' as const, id: recentPaid.id } }]
      : []),
    ...(biggestDebt
      ? [{ id: 'ntf_3', type: 'PAYMENT_REMINDER' as const, title: 'Balance still unpaid', body: `${nameOf(biggestDebt.customerId)} has not paid for ${biggestDebt.reference}. Send a reminder or record a payment.`, createdAt: minutesAgo(180), read: false, link: { kind: 'booking' as const, id: biggestDebt.id } }]
      : []),
    { id: 'ntf_4', type: 'SYSTEM', title: 'Court 3 is in maintenance', body: 'Bookings on Court 3 are paused until you set it back to active.', createdAt: minutesAgo(60 * 20), read: true, link: { kind: 'court', id: 'court_3' } },
    ...(lastCancelled
      ? [{ id: 'ntf_5', type: 'BOOKING_CANCELLED' as const, title: 'Booking cancelled', body: `${nameOf(lastCancelled.customerId)} cancelled ${lastCancelled.reference} (${lastCancelled.cancelReason}).`, createdAt: minutesAgo(60 * 26), read: true, link: { kind: 'booking' as const, id: lastCancelled.id } }]
      : []),
    { id: 'ntf_6', type: 'SYSTEM', title: 'New revenue opportunity', body: 'Court 2 is quiet on weekday afternoons. See the suggested action.', createdAt: minutesAgo(60 * 40), read: true, link: { kind: 'opportunity', id: 'opp_1' } },
    { id: 'ntf_7', type: 'BOOKING_CREATED', title: 'New booking', body: 'Usman Tariq booked the Futsal Pitch for Saturday at 9:00 PM.', createdAt: minutesAgo(60 * 50), read: true, link: { kind: 'customer', id: 'cust_7' } },
    { id: 'ntf_8', type: 'SYSTEM', title: 'Your invoice is ready', body: 'The September invoice for the Growth plan has been paid.', createdAt: minutesAgo(60 * 24 * 6), read: true },
  ];

  const users: UserProfile[] = [
    { id: 'user_hamid', firstName: 'Hamid', lastName: 'Nawaz', email: 'hamid@baselinepadel.pk', phone: '+92 321 4550918', role: 'OWNER' },
  ];

  const pricingHistory: PricingHistoryEntry[] = [
    { id: 'ph_1', at: at(-10, '18:00'), actor: 'Hamid Nawaz', subject: 'DISCOUNT', subjectName: 'League night', change: 'Deactivated' },
    { id: 'ph_2', at: at(-20, '10:00'), actor: 'Hamid Nawaz', subject: 'DISCOUNT', subjectName: 'Weekday afternoons', change: 'Created: 15% off on Court 2, weekdays 1:00 PM - 5:00 PM' },
    { id: 'ph_3', at: at(-30, '16:40'), actor: 'Hamid Nawaz', subject: 'RULE', subjectName: 'Morning off-peak', change: 'Court 2 rate changed from Rs 4,000 to Rs 3,500 per hour' },
    { id: 'ph_4', at: at(-45, '09:05'), actor: 'Hamid Nawaz', subject: 'RULE', subjectName: 'Weekend', change: 'Created: Court 1, Sat and Sun, Rs 6,500 per hour' },
    { id: 'ph_5', at: at(-60, '11:22'), actor: 'Hamid Nawaz', subject: 'RULE', subjectName: 'Evening peak', change: 'Court 2 rate changed from Rs 5,000 to Rs 5,500 per hour' },
    { id: 'ph_6', at: at(-90, '12:00'), actor: 'Hamid Nawaz', subject: 'COURT_RATE', subjectName: 'Futsal Pitch', change: 'Base rate changed from Rs 8,000 to Rs 9,000 per hour' },
  ];

  return {
    facility,
    courts,
    customers,
    bookings,
    payments,
    rules,
    discounts,
    pricingHistory,
    opportunities,
    notifications,
    users,
    preferences: {
      push: true,
      email: true,
      bookingReminders: true,
      reminderLeadMinutes: 60,
      newBookings: true,
      cancellations: true,
      paymentReminders: true,
      paymentsReceived: false,
      dailySummary: true,
    },
    subscription: {
      plan: 'Growth',
      status: 'ACTIVE',
      price: 14900,
      currency: 'PKR',
      interval: 'MONTH',
      renewsOn: addDays(today, 17),
      courtsLimit: 8,
      courtsUsed: courts.length,
      paymentMethod: { brand: 'Visa', last4: '4417', expires: '08/28' },
      invoices: [0, 1, 2, 3].map((i) => ({ id: `inv_${i}`, date: addDays(today, -13 - i * 30), amount: 14900, status: 'PAID' as const })),
    },
    sessions: new Map(),
    bookingSeq: seq,
  };
}

/**
 * A brand-new owner: facility profile and account only. No courts, bookings,
 * customers, payments, pricing, opportunities or notifications, so every
 * empty state in the app can be exercised.
 */
function emptyFacility(): FacilityData {
  const today = todayIn(TZ);
  return {
    facility: {
      id: 'facility_greenline',
      name: 'Greenline Sports Arena',
      sports: [],
      address: '',
      city: 'Karachi',
      phone: '+92 300 7718245',
      email: 'sana@greenlinearena.pk',
      timezone: TZ,
      currency: 'PKR',
      businessHours: ALL_DAYS.map((weekday) => ({ weekday, closed: false, open: '08:00', close: '22:00' })),
      settings: { defaultSlotMinutes: 60, bufferMinutes: 0, cancellationWindowHours: 12, bookingLeadDays: 30 },
    },
    courts: [],
    customers: [],
    bookings: [],
    payments: [],
    rules: [],
    discounts: [],
    pricingHistory: [],
    opportunities: [],
    notifications: [],
    preferences: {
      push: true,
      email: true,
      bookingReminders: true,
      reminderLeadMinutes: 60,
      newBookings: true,
      cancellations: true,
      paymentReminders: true,
      paymentsReceived: false,
      dailySummary: true,
    },
    subscription: {
      plan: 'Starter',
      status: 'TRIALING',
      price: 7900,
      currency: 'PKR',
      interval: 'MONTH',
      renewsOn: addDays(today, 14),
      courtsLimit: 4,
      courtsUsed: 0,
      invoices: [],
    },
    bookingSeq: 1001,
  };
}

/** Everything that belongs to one facility (one owner). Users and sessions are shared. */
type FacilityData = Omit<Db, 'users' | 'sessions'>;
const FACILITY_KEYS = ['facility', 'courts', 'customers', 'bookings', 'payments', 'rules', 'discounts', 'pricingHistory', 'opportunities', 'notifications', 'preferences', 'subscription', 'bookingSeq'] as const;

const seeded = seed();

/**
 * The live view of the signed-in owner's data. Route handlers read and write
 * `db.<field>` as before; `activateOwner` points it at the right facility for
 * each request and `persistOwner` saves any reassigned fields back.
 */
export const db: Db = seeded;

const stores = new Map<string, FacilityData>([
  ['user_hamid', pickFacility(seeded)],
  ['user_sana', emptyFacility()],
]);

db.users.push({ id: 'user_sana', firstName: 'Sana', lastName: 'Tariq', email: 'sana@greenlinearena.pk', phone: '+92 333 5102847', role: 'OWNER' });

function pickFacility(source: Db | FacilityData): FacilityData {
  const out = {} as Record<string, unknown>;
  for (const k of FACILITY_KEYS) out[k] = source[k];
  return out as FacilityData;
}

export function activateOwner(userId: string) {
  const data = stores.get(userId);
  if (data) Object.assign(db, data);
}

export function persistOwner(userId: string) {
  if (stores.has(userId)) stores.set(userId, pickFacility(db));
}

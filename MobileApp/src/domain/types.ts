/**
 * SportVenue sports-facility domain types (API contract).
 *
 * Conventions:
 * - Money is in major units of the facility currency (2500 = Rs 2,500).
 * - Timestamps without an offset ("2026-09-29T20:00:00") are facility-local wall time.
 * - Every derived figure (totals, balances, utilization, analytics) is computed by the server.
 */

import type { CalendarDate } from '@/lib/datetime';

export type ID = string;
export type LocalDateTime = string;
/** "HH:MM", 24-hour, facility-local. */
export type ClockTime = string;
/** 0 = Sunday ... 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Page<T> = { items: T[]; nextCursor: string | null; total: number };

/* ---------- Facility ---------- */

export type BusinessHoursDay = { weekday: Weekday; closed: boolean; open: ClockTime; close: ClockTime };

export type FacilitySettings = {
  defaultSlotMinutes: 30 | 60 | 90;
  bufferMinutes: number;
  cancellationWindowHours: number;
  bookingLeadDays: number;
};

export type Facility = {
  id: ID;
  name: string;
  description?: string;
  sports: string[];
  address: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  timezone: string;
  currency: string;
  businessHours: BusinessHoursDay[];
  settings: FacilitySettings;
};

/* ---------- Courts ---------- */

export type CourtStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

export type Court = {
  id: ID;
  name: string;
  sport: string;
  surface?: string;
  indoor: boolean;
  status: CourtStatus;
  /** Base price per hour before time-based rules and discounts. */
  hourlyRate: number;
  slotMinutes: 30 | 60 | 90;
  notes?: string;
  createdAt: LocalDateTime;
};

export type CourtSummary = Court & {
  todayUtilization: number;
  todayBookedSlots: number;
  todayTotalSlots: number;
  upcomingBookings: number;
  revenue30d: number;
};

export type SlotStatus = 'FREE' | 'BOOKED' | 'CLOSED' | 'PAST';

export type AvailabilitySlot = {
  startAt: LocalDateTime;
  endAt: LocalDateTime;
  status: SlotStatus;
  bookingId?: ID;
  customerName?: string;
  /** Server-resolved hourly price for this slot, when FREE. */
  rate?: number;
};

export type CourtAvailability = { courtId: ID; date: CalendarDate; slotMinutes: number; slots: AvailabilitySlot[] };

/* ---------- Customers ---------- */

export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export type RegularSlot = { courtId: ID; courtName: string; weekday: Weekday; startTime: ClockTime; durationMinutes: number };

export type CustomerNote = { id: ID; body: string; createdAt: LocalDateTime; author: string };

export type Customer = {
  id: ID;
  name: string;
  phone: string;
  email?: string;
  status: CustomerStatus;
  isRegular: boolean;
  regularSlot?: RegularSlot;
  createdAt: LocalDateTime;
  /** Server-computed. */
  totalBookings: number;
  totalSpent: number;
  outstanding: number;
  lastBookingAt?: LocalDateTime;
};

export type CustomerDetail = Customer & { notes: CustomerNote[]; cancellations: number; noShows: number };

export type CustomerInput = {
  name: string;
  phone: string;
  email?: string;
  isRegular: boolean;
  regularSlot?: Omit<RegularSlot, 'courtName'>;
};

/* ---------- Bookings ---------- */

export type BookingStatus = 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type PaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'REFUNDED';

export type BookingEvent = {
  id: ID;
  at: LocalDateTime;
  type: 'CREATED' | 'UPDATED' | 'RESCHEDULED' | 'CANCELLED' | 'PAYMENT' | 'REMINDER' | 'STATUS';
  description: string;
  actor: string;
};

export type Booking = {
  id: ID;
  reference: string;
  courtId: ID;
  courtName: string;
  customerId: ID;
  customerName: string;
  customerPhone: string;
  startAt: LocalDateTime;
  endAt: LocalDateTime;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  price: number;
  discountAmount: number;
  discountName?: string;
  total: number;
  paid: number;
  outstanding: number;
  notes?: string;
  cancelReason?: string;
  createdAt: LocalDateTime;
};

export type BookingDetail = Booking & { history: BookingEvent[]; payments: Payment[] };

export type BookingQuote = {
  price: number;
  discountAmount: number;
  discountName?: string;
  total: number;
  breakdown: { label: string; amount: number }[];
};

/* ---------- Payments ---------- */

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'WALLET';

export type Payment = {
  id: ID;
  bookingId: ID;
  bookingReference: string;
  customerId: ID;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  receivedAt: LocalDateTime;
  note?: string;
  recordedBy: string;
};

export type OutstandingBalance = Pick<
  Booking,
  'id' | 'reference' | 'customerId' | 'customerName' | 'courtName' | 'startAt' | 'endAt' | 'total' | 'paid' | 'outstanding' | 'paymentStatus'
> & { daysOverdue: number };

/* ---------- Opportunities ---------- */

export type OpportunityStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';

export type OpportunityType =
  | 'LOW_UTILIZATION'
  | 'OUTSTANDING_PAYMENT'
  | 'CANCELLATION_RISK'
  | 'REPEAT_CUSTOMER'
  | 'PRICE_OPPORTUNITY'
  | 'FULLY_BOOKED_PERIOD';

export type RecommendedAction = {
  type: 'DISCOUNT' | 'PRICE_INCREASE' | 'REMIND' | 'CONTACT' | (string & {});
  value?: number;
  unit?: 'PERCENT' | 'AMOUNT' | (string & {});
  /** Server-provided prefill for the discount/price form when the owner applies it. */
  window?: { weekdays: Weekday[]; startTime: ClockTime; endTime: ClockTime };
};

export type Opportunity = {
  id: ID;
  type: OpportunityType | (string & {});
  status: OpportunityStatus;
  title: string;
  description?: string;
  courtId?: ID;
  courtName?: string;
  bookingId?: ID;
  bookingReference?: string;
  customerId?: ID;
  customerName?: string;
  startAt?: LocalDateTime;
  endAt?: LocalDateTime;
  recommendedAction?: RecommendedAction;
  /** Server estimate of revenue at stake. */
  potentialRevenue?: number;
  createdAt: LocalDateTime;
  resolution?: { outcome: 'ACTIONED' | 'DISMISSED'; note?: string; at: LocalDateTime; by: string };
};

/* ---------- Pricing ---------- */

export type PricingRule = {
  id: ID;
  name: string;
  /** null = all courts. */
  courtId: ID | null;
  courtName?: string;
  weekdays: Weekday[];
  startTime: ClockTime;
  endTime: ClockTime;
  hourlyRate: number;
  active: boolean;
  updatedAt: LocalDateTime;
};

export type PricingRuleInput = Omit<PricingRule, 'id' | 'courtName' | 'updatedAt'>;

export type Discount = {
  id: ID;
  name: string;
  code?: string;
  kind: 'PERCENT' | 'AMOUNT';
  value: number;
  /** Empty = all courts. */
  courtIds: ID[];
  validFrom: CalendarDate;
  validTo?: CalendarDate;
  weekdays: Weekday[];
  startTime?: ClockTime;
  endTime?: ClockTime;
  maxUses?: number;
  usageCount: number;
  active: boolean;
  updatedAt: LocalDateTime;
};

export type DiscountInput = Omit<Discount, 'id' | 'usageCount' | 'updatedAt'>;

export type PricingHistoryEntry = {
  id: ID;
  at: LocalDateTime;
  actor: string;
  subject: 'COURT_RATE' | 'RULE' | 'DISCOUNT';
  subjectName: string;
  change: string;
};

/* ---------- Notifications ---------- */

export type NotificationType =
  | 'BOOKING_REMINDER'
  | 'BOOKING_CREATED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_REMINDER'
  | 'PAYMENT_RECEIVED'
  | 'SYSTEM';

export type NotificationLink = { kind: 'booking' | 'customer' | 'payment' | 'court' | 'opportunity'; id: ID };

export type AppNotification = {
  id: ID;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: LocalDateTime;
  read: boolean;
  link?: NotificationLink;
};

export type NotificationPreferences = {
  push: boolean;
  email: boolean;
  bookingReminders: boolean;
  reminderLeadMinutes: 30 | 60 | 120 | 1440;
  newBookings: boolean;
  cancellations: boolean;
  paymentReminders: boolean;
  paymentsReceived: boolean;
  dailySummary: boolean;
};

/* ---------- Team & account ---------- */

/** SportVenue is currently owner-only: one account runs the facility. */
export type Role = 'OWNER';


export type UserProfile = { id: ID; firstName: string; lastName: string; email: string; phone?: string; role: Role };

export type Subscription = {
  plan: string;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED';
  price: number;
  currency: string;
  interval: 'MONTH' | 'YEAR';
  renewsOn: CalendarDate;
  courtsLimit: number;
  courtsUsed: number;
  paymentMethod?: { brand: string; last4: string; expires: string };
  invoices: { id: ID; date: CalendarDate; amount: number; status: 'PAID' | 'OPEN' | 'FAILED' }[];
};

/* ---------- Analytics ---------- */

export type Analytics = {
  period: { startDate: CalendarDate; endDate: CalendarDate };
  currency: string;
  revenue: { total: number; changePercent: number | null; byDay: { date: CalendarDate; amount: number }[] };
  bookings: { total: number; changePercent: number | null; averagePerDay: number; averageValue: number };
  utilization: { overall: number; byCourt: { courtId: ID; courtName: string; utilization: number }[] };
  revenueByCourt: { courtId: ID; courtName: string; amount: number }[];
  customers: { active: number; new: number; returning: number; top: { customerId: ID; name: string; spent: number; bookings: number }[] };
  outstanding: { total: number; bookingCount: number; aging: { label: string; amount: number }[] };
  cancellations: { count: number; rate: number; noShows: number; reasons: { reason: string; count: number }[] };
  /** Booked share (0-100) per weekday x hour. */
  peakHours: { weekday: Weekday; hour: number; utilization: number }[];
};

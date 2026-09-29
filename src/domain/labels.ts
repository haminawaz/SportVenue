import type { ComponentType } from 'react';
import {
  ArrowsClockwise,
  Bank,
  Bell,
  CalendarCheck,
  CalendarX,
  ChartLineDown,
  CreditCard,
  CurrencyCircleDollar,
  Gear,
  Info,
  Money,
  Tag,
  Wallet,
  WarningCircle,
  type IconProps,
} from 'phosphor-react-native';

import type { BadgeTone } from '@/ui/StatusBadge';

import type {
  BookingStatus,
  CourtStatus,
  NotificationType,
  OpportunityStatus,
  OpportunityType,
  PaymentMethod,
  PaymentStatus,
} from './types';

type Meta = { label: string; tone: BadgeTone };

export const BOOKING_STATUS: Record<BookingStatus, Meta> = {
  CONFIRMED: { label: 'Confirmed', tone: 'positive' },
  PENDING: { label: 'Pending', tone: 'warning' },
  COMPLETED: { label: 'Completed', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  NO_SHOW: { label: 'No-show', tone: 'danger' },
};

export const PAYMENT_STATUS: Record<PaymentStatus, Meta> = {
  PAID: { label: 'Paid', tone: 'positive' },
  PARTIALLY_PAID: { label: 'Part paid', tone: 'warning' },
  UNPAID: { label: 'Unpaid', tone: 'danger' },
  REFUNDED: { label: 'Refunded', tone: 'neutral' },
};

export const COURT_STATUS: Record<CourtStatus, Meta & { description: string }> = {
  ACTIVE: { label: 'Active', tone: 'positive', description: 'Open for bookings' },
  MAINTENANCE: { label: 'Maintenance', tone: 'warning', description: 'Temporarily closed, bookings paused' },
  INACTIVE: { label: 'Inactive', tone: 'neutral', description: 'Hidden from booking, history kept' },
};

export const PAYMENT_METHOD: Record<PaymentMethod, { label: string; icon: ComponentType<IconProps> }> = {
  CASH: { label: 'Cash', icon: Money },
  CARD: { label: 'Card', icon: CreditCard },
  BANK_TRANSFER: { label: 'Bank transfer', icon: Bank },
  WALLET: { label: 'Mobile wallet', icon: Wallet },
};

export const OPPORTUNITY_STATUS: Record<OpportunityStatus, Meta> = {
  OPEN: { label: 'Open', tone: 'warning' },
  IN_PROGRESS: { label: 'In progress', tone: 'positive' },
  RESOLVED: { label: 'Resolved', tone: 'neutral' },
  DISMISSED: { label: 'Dismissed', tone: 'neutral' },
};

export const OPPORTUNITY_TYPE: Record<OpportunityType, { label: string; icon: ComponentType<IconProps> }> = {
  LOW_UTILIZATION: { label: 'Low demand', icon: ChartLineDown },
  OUTSTANDING_PAYMENT: { label: 'Unpaid balance', icon: Wallet },
  CANCELLATION_RISK: { label: 'Cancellation risk', icon: CalendarX },
  REPEAT_CUSTOMER: { label: 'Lapsed customer', icon: ArrowsClockwise },
  PRICE_OPPORTUNITY: { label: 'Pricing', icon: Tag },
  FULLY_BOOKED_PERIOD: { label: 'High demand', icon: CalendarCheck },
};

export function opportunityTypeMeta(type: string) {
  return OPPORTUNITY_TYPE[type as OpportunityType] ?? { label: 'Opportunity', icon: Info };
}

export const NOTIFICATION_TYPE: Record<NotificationType, { label: string; icon: ComponentType<IconProps>; group: 'BOOKING' | 'PAYMENT' | 'SYSTEM' }> = {
  BOOKING_REMINDER: { label: 'Booking reminder', icon: Bell, group: 'BOOKING' },
  BOOKING_CREATED: { label: 'New booking', icon: CalendarCheck, group: 'BOOKING' },
  BOOKING_CANCELLED: { label: 'Cancellation', icon: CalendarX, group: 'BOOKING' },
  PAYMENT_REMINDER: { label: 'Payment reminder', icon: WarningCircle, group: 'PAYMENT' },
  PAYMENT_RECEIVED: { label: 'Payment received', icon: CurrencyCircleDollar, group: 'PAYMENT' },
  SYSTEM: { label: 'System', icon: Gear, group: 'SYSTEM' },
};


export const CANCEL_REASONS = ['Customer request', 'Weather', 'Player unavailable', 'Court issue', 'Double booking', 'Illness', 'Other'];

export const SPORTS = ['Padel', 'Tennis', 'Futsal', 'Football', 'Squash', 'Badminton', 'Basketball', 'Cricket nets', 'Pickleball', 'Volleyball'];

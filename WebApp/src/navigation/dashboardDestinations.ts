import type { CalendarDate } from '@/lib/datetime';

import { routes, type Href } from './routes';

/** Where dashboard items lead. Kept as one table so tests can swap destinations. */
export const dashboardDestinations = {
  courtDay: (courtId: string, date: CalendarDate): Href | null => routes.courtCalendar(courtId, date),
  bookingDetail: (bookingId: string): Href | null => routes.booking(bookingId),
  customerDetail: (customerId: string): Href | null => routes.customer(customerId),
  newBooking: (): Href | null => routes.bookingNew(),
};

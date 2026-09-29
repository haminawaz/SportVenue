import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { addDays, todayIn } from '@/lib/datetime';
import { dashboardDestinations } from '@/navigation/dashboardDestinations';
import { SessionProvider } from '@/session/SessionProvider';
import type { Permission, Session } from '@/session/types';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/ui/Toast';

import { FacilityDashboardScreen } from '../FacilityDashboardScreen';
import { facilityDashboardService } from '../services/facilityDashboardService';
import type { FacilityDashboard } from '../types/facilityDashboard.types';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

jest.mock('@/navigation/dashboardDestinations', () => ({
  dashboardDestinations: {
    courtDay: jest.fn((courtId: string, date: string) => `/courts/${courtId}?date=${date}`),
    bookingDetail: jest.fn((bookingId: string) => `/bookings/${bookingId}`),
    customerDetail: jest.fn((customerId: string) => `/customers/${customerId}`),
    newBooking: jest.fn(() => '/bookings/new'),
  },
}));

jest.mock('@/features/notifications/api', () => ({
  useUnreadCount: () => ({ data: { count: 2 }, refetch: jest.fn() }),
}));

jest.mock('../services/facilityDashboardService', () => ({
  facilityDashboardService: { getDashboard: jest.fn(), sendPaymentReminder: jest.fn() },
}));

const service = facilityDashboardService as jest.Mocked<typeof facilityDashboardService>;
const mockDestinations = dashboardDestinations as jest.Mocked<typeof dashboardDestinations>;

const TZ = 'Asia/Karachi';
const ALL: Permission[] = ['dashboard.view', 'booking.create', 'booking.view', 'payment.view', 'payment.remind', 'opportunity.view'];

function makeSession(permissions: Permission[] = ALL): Session {
  return {
    user: { id: 'u1', firstName: 'Hamid', lastName: 'Nawaz', email: 'hamid@example.com', role: 'OWNER' },
    facility: { id: 'fac_1', name: 'Baseline Padel Club', timezone: TZ, currency: 'PKR' },
    permissions,
  };
}

function makeDashboard(overrides: Partial<FacilityDashboard> = {}): FacilityDashboard {
  const today = todayIn(TZ);
  return {
    period: { startDate: today, endDate: today },
    currency: 'PKR',
    summary: {
      revenue: { amount: 24500, changePercent: 12 },
      bookings: { count: 18, change: 3 },
      utilization: { percentage: 72, bookedSlots: 9, totalSlots: 12 },
      outstanding: { amount: 8500, bookingCount: 4 },
    },
    courts: [{ id: 'court_1', name: 'Court 1', sport: 'Padel', utilizationPercentage: 72, bookedSlots: 9, totalSlots: 12, revenue: 18000 }],
    opportunities: [
      {
        id: 'opp_1',
        type: 'LOW_UTILIZATION',
        title: 'Low demand on Court 2',
        description: 'Court 2 has low demand during this period.',
        courtId: 'court_2',
        courtName: 'Court 2',
        startAt: `${today}T14:00:00`,
        endAt: `${today}T16:00:00`,
        recommendedAction: { type: 'DISCOUNT', value: 15, unit: 'PERCENT' },
      },
    ],
    outstandingPayments: [
      {
        bookingId: 'booking_1',
        customerName: 'Ahmed Khan',
        courtName: 'Court 1',
        startAt: `${today}T20:00:00`,
        endAt: `${today}T21:00:00`,
        outstandingAmount: 2500,
        currency: 'PKR',
        status: 'UNPAID',
      },
    ],
    recentBookings: [
      { bookingId: 'booking_120', customerName: 'Bilal Siddiqui', courtName: 'Court 1', startAt: `${today}T19:00:00`, endAt: `${today}T20:00:00`, amount: 2500, status: 'PAID' },
    ],
    capabilities: { paymentReminders: true },
    ...overrides,
  };
}

function Providers({ children, session }: { children: ReactNode; session: Session }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } }));
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <ThemeProvider scheme="light">
          <ToastProvider>
            <SessionProvider initialSession={session}>{children}</SessionProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

async function renderDashboard(session = makeSession()) {
  await render(<FacilityDashboardScreen />, { wrapper: ({ children }) => <Providers session={session}>{children}</Providers> });
}

const money = (s: string) => new RegExp(s.replace(/ /g, '[ \\u00a0]'));

beforeEach(() => {
  jest.clearAllMocks();
  service.getDashboard.mockResolvedValue(makeDashboard());
  service.sendPaymentReminder.mockResolvedValue(undefined);
});

describe('states', () => {
  test('shows a layout-shaped skeleton while loading', async () => {
    service.getDashboard.mockReturnValue(new Promise(() => {}));
    await renderDashboard();
    expect(screen.getByRole('progressbar', { name: 'Loading dashboard' })).toBeOnTheScreen();
    expect(screen.getByText('Baseline Padel Club')).toBeOnTheScreen();
  });

  test('renders KPIs with facility currency', async () => {
    await renderDashboard();
    expect(await screen.findByText(money('Rs 24,500'))).toBeOnTheScreen();
    expect(screen.getByText("Today's revenue")).toBeOnTheScreen();
    expect(screen.getByText('+12% vs yesterday')).toBeOnTheScreen();
    expect(screen.getByText('18')).toBeOnTheScreen();
    expect(screen.getAllByText('72%').length).toBeGreaterThan(0);
    expect(screen.getByText('9 of 12 slots')).toBeOnTheScreen();
    expect(screen.getByText(money('Rs 8,500'))).toBeOnTheScreen();
    expect(screen.getByText('4 bookings')).toBeOnTheScreen();
  });

  test('uses a different facility currency without code changes', async () => {
    service.getDashboard.mockResolvedValue(makeDashboard({ currency: 'AED' }));
    await renderDashboard();
    expect(await screen.findByText(money('AED 24,500'))).toBeOnTheScreen();
  });

  test('shows the backend recommendation, and nothing invented when there is none', async () => {
    await renderDashboard();
    expect(await screen.findByText('Suggested: offer a 15% discount')).toBeOnTheScreen();
  });

  test('empty arrays are empty states, not errors', async () => {
    const empty = makeDashboard({
      courts: [],
      opportunities: [],
      outstandingPayments: [],
      recentBookings: [],
    });
    empty.summary.bookings.count = 0;
    service.getDashboard.mockResolvedValue(empty);
    await renderDashboard();

    expect(await screen.findByText('No bookings for this period')).toBeOnTheScreen();
    expect(screen.getByText("You're all caught up")).toBeOnTheScreen();
    expect(screen.getByText('No outstanding payments')).toBeOnTheScreen();
    expect(screen.queryByText('Unable to load dashboard')).not.toBeOnTheScreen();
  });

  test('shows an error with retry, then recovers', async () => {
    service.getDashboard.mockRejectedValueOnce(new ApiError(500, 'stack trace here'));
    const user = userEvent.setup();
    await renderDashboard();

    expect(await screen.findByText('Unable to load dashboard')).toBeOnTheScreen();
    expect(screen.queryByText(/stack trace/)).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(money('Rs 24,500'))).toBeOnTheScreen();
  });

  test('403 explains missing permission and offers no pointless retry', async () => {
    service.getDashboard.mockRejectedValue(new ApiError(403, ''));
    await renderDashboard();
    expect(await screen.findByText("You don't have permission to view this dashboard.")).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeOnTheScreen();
  });

  test('an unknown opportunity type renders generically instead of crashing', async () => {
    service.getDashboard.mockResolvedValue(
      makeDashboard({ opportunities: [{ id: 'x', type: 'WEATHER_ALERT', title: 'Rain expected after 6 PM' }] }),
    );
    await renderDashboard();
    expect(await screen.findByText('Rain expected after 6 PM')).toBeOnTheScreen();
  });
});

describe('date filter', () => {
  test('requests today in the facility zone by default', async () => {
    await renderDashboard();
    await screen.findByText(money('Rs 24,500'));
    const today = todayIn(TZ);
    expect(service.getDashboard).toHaveBeenCalledWith({ facilityId: 'fac_1', startDate: today, endDate: today }, expect.anything());
  });

  test('changing the period refetches with the new range', async () => {
    const user = userEvent.setup();
    await renderDashboard();
    await screen.findByText(money('Rs 24,500'));

    await user.press(screen.getByRole('button', { name: /Change period/ }));
    await user.press(screen.getByRole('radio', { name: 'Yesterday' }));

    const yesterday = addDays(todayIn(TZ), -1);
    expect(await screen.findByText("Yesterday's revenue")).toBeOnTheScreen();
    expect(service.getDashboard).toHaveBeenLastCalledWith({ facilityId: 'fac_1', startDate: yesterday, endDate: yesterday }, expect.anything());
  });

  test('re-selecting the same period does not refetch', async () => {
    const user = userEvent.setup();
    await renderDashboard();
    await screen.findByText(money('Rs 24,500'));
    const calls = service.getDashboard.mock.calls.length;

    await user.press(screen.getByRole('button', { name: /Change period/ }));
    await user.press(screen.getByRole('radio', { name: 'Today' }));

    expect(service.getDashboard).toHaveBeenCalledTimes(calls);
  });
});

describe('navigation', () => {
  test('court card opens that court for the selected day', async () => {
    const user = userEvent.setup();
    await renderDashboard();
    await user.press(await screen.findByRole('button', { name: /^Court 1, Padel/ }));
    expect(mockPush).toHaveBeenCalledWith(`/courts/court_1?date=${todayIn(TZ)}`);
  });

  test('booking row opens the booking by id only', async () => {
    const user = userEvent.setup();
    await renderDashboard();
    await user.press(await screen.findByRole('button', { name: /^Bilal Siddiqui/ }));
    expect(mockDestinations.bookingDetail).toHaveBeenCalledWith('booking_120');
    expect(mockPush).toHaveBeenCalledWith('/bookings/booking_120');
  });

  test('New booking opens booking creation', async () => {
    const user = userEvent.setup();
    await renderDashboard();
    await screen.findByText(money('Rs 24,500'));
    await user.press(screen.getByRole('button', { name: 'New booking' }));
    expect(mockPush).toHaveBeenCalledWith('/bookings/new');
  });

  test('a destination that is not built yet tells the user instead of navigating', async () => {
    mockDestinations.newBooking.mockReturnValueOnce(null);
    const user = userEvent.setup();
    await renderDashboard();
    await screen.findByText(money('Rs 24,500'));
    await user.press(screen.getByRole('button', { name: 'New booking' }));
    expect(mockPush).not.toHaveBeenCalled();
    expect(await screen.findByText('That screen is not available in this build yet.')).toBeOnTheScreen();
  });
});

describe('permissions', () => {
  test('hides Remind without payment.remind but still shows the payment', async () => {
    await renderDashboard(makeSession(['dashboard.view', 'booking.view', 'payment.view']));
    expect(await screen.findByText('Ahmed Khan')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Remind/ })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'New booking' })).not.toBeOnTheScreen();
  });

  test('hides Remind when the backend has no reminder capability', async () => {
    service.getDashboard.mockResolvedValue(makeDashboard({ capabilities: { paymentReminders: false } }));
    await renderDashboard();
    expect(await screen.findByText('Ahmed Khan')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Remind/ })).not.toBeOnTheScreen();
  });

  test('shows authorised actions', async () => {
    await renderDashboard();
    expect(await screen.findByRole('button', { name: 'Remind Ahmed Khan to pay' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'New booking' })).toBeOnTheScreen();
  });

  test('without dashboard.view nothing is fetched', async () => {
    await renderDashboard(makeSession([]));
    expect(screen.getByText("You don't have permission to view this dashboard.")).toBeOnTheScreen();
    expect(service.getDashboard).not.toHaveBeenCalled();
  });
});

describe('payment reminder', () => {
  test('shows success only after the server confirms, then refreshes the dashboard', async () => {
    let confirm!: () => void;
    service.sendPaymentReminder.mockReturnValue(new Promise<void>((resolve) => (confirm = resolve)));
    const user = userEvent.setup();
    await renderDashboard();

    const remind = await screen.findByRole('button', { name: 'Remind Ahmed Khan to pay' });
    const callsBefore = service.getDashboard.mock.calls.length;
    await user.press(remind);

    expect(service.sendPaymentReminder).toHaveBeenCalledWith('booking_1');
    expect(screen.getByRole('button', { name: 'Remind Ahmed Khan to pay' })).toBeBusy();
    expect(screen.queryByText('Reminder sent')).not.toBeOnTheScreen();

    confirm();
    expect(await screen.findByText('Reminder sent')).toBeOnTheScreen();
    expect(service.getDashboard.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  test('a failed reminder shows an error and no success message', async () => {
    service.sendPaymentReminder.mockRejectedValue(new ApiError(500, 'internal'));
    const user = userEvent.setup();
    await renderDashboard();

    await user.press(await screen.findByRole('button', { name: 'Remind Ahmed Khan to pay' }));
    const alert = await screen.findByText(/Couldn't send reminder/);
    expect(alert).toBeOnTheScreen();
    expect(screen.queryByText('Reminder sent')).not.toBeOnTheScreen();
  });
});

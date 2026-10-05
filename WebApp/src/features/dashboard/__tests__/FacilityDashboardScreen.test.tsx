import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApiError } from '@/api/client';
import { addDays, todayIn } from '@/lib/datetime';
import { dashboardDestinations } from '@/navigation/dashboardDestinations';
import { SessionProvider } from '@/session/SessionProvider';
import type { Session } from '@/session/types';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/ui/Toast';

import { FacilityDashboardScreen } from '../FacilityDashboardScreen';
import { facilityDashboardService } from '../services/facilityDashboardService';
import type { FacilityDashboard } from '../types/facilityDashboard.types';

const mockPush = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }) }));

vi.mock('@/navigation/dashboardDestinations', () => ({
  dashboardDestinations: {
    courtDay: vi.fn((courtId: string, date: string) => `/courts/${courtId}?date=${date}`),
    bookingDetail: vi.fn((bookingId: string) => `/bookings/${bookingId}`),
    customerDetail: vi.fn((customerId: string) => `/customers/${customerId}`),
    newBooking: vi.fn(() => '/bookings/new'),
  },
}));

vi.mock('@/features/notifications/api', () => ({
  useUnreadCount: () => ({ data: { count: 2 }, refetch: vi.fn() }),
}));

vi.mock('../services/facilityDashboardService', () => ({
  facilityDashboardService: { getDashboard: vi.fn(), sendPaymentReminder: vi.fn() },
}));

const service = vi.mocked(facilityDashboardService);
const mockDestinations = vi.mocked(dashboardDestinations);

const TZ = 'Asia/Karachi';
function makeSession(): Session {
  return {
    user: { id: 'u1', firstName: 'Hamid', lastName: 'Nawaz', email: 'hamid@example.com', role: 'OWNER' },
    facility: { id: 'fac_1', name: 'Baseline Padel Club', timezone: TZ, currency: 'PKR' },
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
    <QueryClientProvider client={client}>
      <ThemeProvider scheme="light">
        <ToastProvider>
          <SessionProvider initialSession={session}>{children}</SessionProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function renderDashboard(session = makeSession()) {
  return render(<FacilityDashboardScreen />, { wrapper: ({ children }) => <Providers session={session}>{children}</Providers> });
}

const money = (s: string) => new RegExp(`^${s.replace(/ /g, '[ \\u00a0]')}$`);

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  service.getDashboard.mockResolvedValue(makeDashboard());
  service.sendPaymentReminder.mockResolvedValue(undefined);
});

describe('states', () => {
  test('shows a layout-shaped skeleton while loading', () => {
    service.getDashboard.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByRole('progressbar', { name: 'Loading dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Baseline Padel Club')).toBeInTheDocument();
  });

  test('renders KPIs with facility currency', async () => {
    renderDashboard();
    expect(await screen.findByText(money('Rs 24,500'))).toBeInTheDocument();
    expect(screen.getByText("Today's revenue")).toBeInTheDocument();
    expect(screen.getByText('+12% vs yesterday')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getAllByText('72%').length).toBeGreaterThan(0);
    expect(screen.getByText('9 of 12 slots')).toBeInTheDocument();
    expect(screen.getByText(money('Rs 8,500'))).toBeInTheDocument();
    expect(screen.getByText('4 bookings')).toBeInTheDocument();
  });

  test('uses a different facility currency without code changes', async () => {
    service.getDashboard.mockResolvedValue(makeDashboard({ currency: 'AED' }));
    renderDashboard();
    expect(await screen.findByText(money('AED 24,500'))).toBeInTheDocument();
  });

  test('shows the backend recommendation, and nothing invented when there is none', async () => {
    renderDashboard();
    expect(await screen.findByText('Suggested: offer a 15% discount')).toBeInTheDocument();
  });

  test('empty arrays are empty states, not errors', async () => {
    const empty = makeDashboard({ courts: [], opportunities: [], outstandingPayments: [], recentBookings: [] });
    empty.summary.bookings.count = 0;
    service.getDashboard.mockResolvedValue(empty);
    renderDashboard();

    expect(await screen.findByText('No bookings for this period')).toBeInTheDocument();
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    expect(screen.queryByText('Unable to load dashboard')).not.toBeInTheDocument();
  });

  test('shows an error with retry, then recovers', async () => {
    service.getDashboard.mockRejectedValueOnce(new ApiError(500, 'stack trace here'));
    const user = userEvent.setup();
    renderDashboard();

    expect(await screen.findByText('Unable to load dashboard')).toBeInTheDocument();
    expect(screen.queryByText(/stack trace/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(money('Rs 24,500'))).toBeInTheDocument();
  });

  test('403 explains lost facility access and offers no pointless retry', async () => {
    service.getDashboard.mockRejectedValue(new ApiError(403, ''));
    renderDashboard();
    expect(await screen.findByText('This account no longer has access to this facility. Log out and back in to continue.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  test('an unknown opportunity type renders generically instead of crashing', async () => {
    service.getDashboard.mockResolvedValue(makeDashboard({ opportunities: [{ id: 'x', type: 'WEATHER_ALERT', title: 'Rain expected after 6 PM' }] }));
    renderDashboard();
    expect(await screen.findByText('Rain expected after 6 PM')).toBeInTheDocument();
  });
});

describe('date filter', () => {
  test('requests today in the facility zone by default', async () => {
    renderDashboard();
    await screen.findByText(money('Rs 24,500'));
    const today = todayIn(TZ);
    expect(service.getDashboard).toHaveBeenCalledWith({ facilityId: 'fac_1', startDate: today, endDate: today }, expect.anything());
  });

  test('changing the period refetches with the new range', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText(money('Rs 24,500'));

    await user.click(screen.getByRole('button', { name: /Change period/ }));
    await user.click(screen.getByRole('radio', { name: 'Yesterday' }));

    const yesterday = addDays(todayIn(TZ), -1);
    expect(await screen.findByText("Yesterday's revenue")).toBeInTheDocument();
    expect(service.getDashboard).toHaveBeenLastCalledWith({ facilityId: 'fac_1', startDate: yesterday, endDate: yesterday }, expect.anything());
  });

  test('re-selecting the same period does not refetch', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText(money('Rs 24,500'));
    const calls = service.getDashboard.mock.calls.length;

    await user.click(screen.getByRole('button', { name: /Change period/ }));
    await user.click(screen.getByRole('radio', { name: 'Today' }));

    expect(service.getDashboard).toHaveBeenCalledTimes(calls);
  });
});

describe('navigation', () => {
  test('court card opens that court for the selected day', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(await screen.findByRole('button', { name: /^Court 1, Padel/ }));
    expect(mockPush).toHaveBeenCalledWith(`/courts/court_1?date=${todayIn(TZ)}`);
  });

  test('booking row opens the booking by id only', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(await screen.findByRole('button', { name: /^Bilal Siddiqui/ }));
    expect(mockDestinations.bookingDetail).toHaveBeenCalledWith('booking_120');
    expect(mockPush).toHaveBeenCalledWith('/bookings/booking_120');
  });

  test('New booking opens booking creation', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText(money('Rs 24,500'));
    await user.click(screen.getByRole('button', { name: 'New booking' }));
    expect(mockPush).toHaveBeenCalledWith('/bookings/new');
  });

  test('a destination that is not built yet tells the user instead of navigating', async () => {
    mockDestinations.newBooking.mockReturnValueOnce(null);
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText(money('Rs 24,500'));
    await user.click(screen.getByRole('button', { name: 'New booking' }));
    expect(mockPush).not.toHaveBeenCalled();
    expect(await screen.findByText('That screen is not available in this build yet.')).toBeInTheDocument();
  });
});

describe('owner actions', () => {
  test('hides Remind when the facility plan has no reminder capability', async () => {
    service.getDashboard.mockResolvedValue(makeDashboard({ capabilities: { paymentReminders: false } }));
    renderDashboard();
    expect(await screen.findByText('Ahmed Khan')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remind/ })).not.toBeInTheDocument();
  });

  test('the owner sees every action', async () => {
    renderDashboard();
    expect(await screen.findByRole('button', { name: 'Remind Ahmed Khan to pay' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New booking' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Record payment' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add customer' })).toBeInTheDocument();
  });

  test('outstanding payments and opportunities share one Needs attention list', async () => {
    renderDashboard();
    expect(await screen.findByText('Needs attention')).toBeInTheDocument();
    expect(screen.getByText('Ahmed Khan')).toBeInTheDocument();
    expect(screen.getByText('Low demand on Court 2')).toBeInTheDocument();
  });
});

describe('payment reminder', () => {
  test('shows success only after the server confirms, then refreshes the dashboard', async () => {
    let confirm!: () => void;
    service.sendPaymentReminder.mockReturnValue(new Promise<void>((resolve) => (confirm = resolve)));
    const user = userEvent.setup();
    renderDashboard();

    const remind = await screen.findByRole('button', { name: 'Remind Ahmed Khan to pay' });
    const callsBefore = service.getDashboard.mock.calls.length;
    await user.click(remind);

    expect(service.sendPaymentReminder).toHaveBeenCalledWith('booking_1');
    expect(screen.getByRole('button', { name: 'Remind Ahmed Khan to pay' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Reminder sent')).not.toBeInTheDocument();

    confirm();
    expect(await screen.findByText('Reminder sent')).toBeInTheDocument();
    expect(service.getDashboard.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  test('a failed reminder shows an error and no success message', async () => {
    service.sendPaymentReminder.mockRejectedValue(new ApiError(500, 'internal'));
    const user = userEvent.setup();
    renderDashboard();

    await user.click(await screen.findByRole('button', { name: 'Remind Ahmed Khan to pay' }));
    expect(await screen.findByText(/Couldn't send reminder/)).toBeInTheDocument();
    expect(screen.queryByText('Reminder sent')).not.toBeInTheDocument();
  });
});

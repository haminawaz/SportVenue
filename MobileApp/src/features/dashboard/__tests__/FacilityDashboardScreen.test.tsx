import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { apiRequest, ApiError } from '@/api/client';
import type { Analytics } from '@/domain/types';
import { todayIn } from '@/lib/datetime';
import { SessionProvider } from '@/session/SessionProvider';
import type { Session } from '@/session/types';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/ui/Toast';

import { FacilityDashboardScreen } from '../FacilityDashboardScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

jest.mock('@/features/notifications/api', () => ({
  useUnreadCount: () => ({ data: { count: 2 }, refetch: jest.fn() }),
}));

jest.mock('@/api/client', () => ({ ...jest.requireActual('@/api/client'), apiRequest: jest.fn() }));
const request = apiRequest as jest.MockedFunction<typeof apiRequest>;

const TZ = 'Asia/Karachi';
function makeSession(): Session {
  return {
    user: { id: 'u1', firstName: 'John', lastName: 'Miller', email: 'john@example.com', role: 'OWNER' },
    facility: { id: 'fac_1', name: 'Baseline Padel Club', timezone: TZ, currency: 'PKR' },
  };
}

function makeAnalytics(startDate: string, endDate: string): Analytics {
  return {
    period: { startDate, endDate },
    currency: 'PKR',
    revenue: { total: 24500, changePercent: 12, byDay: [{ date: endDate, amount: 24500 }] },
    bookings: { total: 18, changePercent: -5, averagePerDay: 18, averageValue: 1361 },
    utilization: { overall: 72, byCourt: [{ courtId: 'court_1', courtName: 'Court 1', utilization: 72 }] },
    revenueByCourt: [{ courtId: 'court_1', courtName: 'Court 1', amount: 24500 }],
    customers: { active: 12, new: 2, returning: 10, top: [{ customerId: 'cus_1', name: 'James Carter', spent: 9000, bookings: 3 }] },
    outstanding: { total: 8500, bookingCount: 4, aging: [{ label: '0-7 days', amount: 8500 }] },
    cancellations: { count: 1, rate: 5, noShows: 0, reasons: [] },
    peakHours: [{ weekday: 1, hour: 19, utilization: 90 }, { weekday: 2, hour: 10, utilization: 10 }],
  };
}

function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }));
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <ThemeProvider scheme="light">
          <ToastProvider>
            <SessionProvider initialSession={makeSession()}>{children}</SessionProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const renderDashboard = () => render(<FacilityDashboardScreen />, { wrapper: Providers });
const lastQuery = () => (request.mock.calls.at(-1)?.[1] as { query: { startDate: string; endDate: string } }).query;

beforeEach(() => {
  jest.clearAllMocks();
  request.mockImplementation(async (_path, opts) => {
    const q = (opts as { query: { startDate: string; endDate: string } }).query;
    return makeAnalytics(q.startDate, q.endDate) as never;
  });
});

test('greets the owner for the time of day, above the facility name', async () => {
  await renderDashboard();
  expect(screen.getByText(/^Good (morning|afternoon|evening|night), John$/)).toBeOnTheScreen();
  expect(screen.getByText('Baseline Padel Club')).toBeOnTheScreen();
  expect(await screen.findByText('Revenue over time')).toBeOnTheScreen();
});

test('shows the full report for today in the facility zone by default', async () => {
  await renderDashboard();
  expect(await screen.findByText('Peak and off-peak hours')).toBeOnTheScreen();
  expect(request).toHaveBeenCalledWith('/api/analytics', { query: { startDate: todayIn(TZ), endDate: todayIn(TZ) } });
  for (const heading of ['Revenue by court', 'Court utilization', 'Customers', 'Outstanding payments', 'Cancellations']) {
    expect(screen.getByText(heading)).toBeOnTheScreen();
  }
  expect(screen.getByText('+12% vs previous period')).toBeOnTheScreen();
});

test('changing the period reloads the report for the new dates', async () => {
  const user = userEvent.setup();
  await renderDashboard();
  await screen.findByText('Revenue over time');
  await user.press(screen.getByRole('button', { name: /Change period$/ }));
  await user.press(screen.getByRole('radio', { name: 'This month' }));
  const today = todayIn(TZ);
  await waitFor(() => expect(lastQuery()).toEqual({ startDate: `${today.slice(0, 8)}01`, endDate: today }));
});

test('an error offers a retry, then the report recovers', async () => {
  const user = userEvent.setup();
  request.mockRejectedValueOnce(new ApiError(503, 'Service unavailable'));
  await renderDashboard();
  await user.press(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Revenue over time')).toBeOnTheScreen();
});

test('the bell opens notifications', async () => {
  const user = userEvent.setup();
  await renderDashboard();
  await user.press(screen.getByRole('button', { name: /Notifications/ }));
  expect(mockPush).toHaveBeenCalledWith('/notifications');
});

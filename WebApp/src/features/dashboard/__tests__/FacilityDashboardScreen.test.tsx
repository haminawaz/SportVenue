import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { apiRequest, ApiError } from '@/api/client';
import type { Analytics } from '@/domain/types';
import { addDays, todayIn } from '@/lib/datetime';
import { SessionProvider } from '@/session/SessionProvider';
import type { Session } from '@/session/types';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/ui/Toast';

import { FacilityDashboardScreen } from '../FacilityDashboardScreen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }), usePathname: () => '/' }));

vi.mock('@/api/client', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/client')>()), apiRequest: vi.fn() }));
const request = vi.mocked(apiRequest);

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
    <QueryClientProvider client={client}>
      <ThemeProvider scheme="light">
        <ToastProvider>
          <SessionProvider initialSession={makeSession()}>{children}</SessionProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const renderDashboard = () => render(<FacilityDashboardScreen />, { wrapper: Providers });
const lastQuery = () => (request.mock.calls.at(-1)?.[1] as { query: { startDate: string; endDate: string } }).query;
const money = (s: string) => new RegExp(`^${s.replace(/ /g, '[ \\u00a0]')}$`);

beforeEach(() => {
  vi.clearAllMocks();
  request.mockImplementation(async (_path, opts) => {
    const q = (opts as { query: { startDate: string; endDate: string } }).query;
    return makeAnalytics(q.startDate, q.endDate);
  });
});

test('greets the owner for the time of day, with the facility and period', async () => {
  renderDashboard();
  expect(screen.getByRole('heading', { level: 1, name: /^Good (morning|afternoon|evening|night), John$/ })).toBeInTheDocument();
  expect(screen.getByText('Baseline Padel Club')).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: 'Revenue over time' })).toBeInTheDocument();
});

test('shows the full report for today in the facility zone by default', async () => {
  renderDashboard();
  expect(await screen.findByRole('heading', { name: 'Peak and off-peak hours' })).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith('/api/analytics', { query: { startDate: todayIn(TZ), endDate: todayIn(TZ) } });
  for (const heading of ['Revenue by court', 'Court utilization', 'Customers', 'Outstanding payments', 'Cancellations']) {
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  }
  expect(screen.getAllByText(money('Rs 24,500')).length).toBeGreaterThan(0);
  expect(screen.getByText('+12% vs previous period')).toBeInTheDocument();
});

test('changing the period reloads the report for the new dates', async () => {
  const user = userEvent.setup();
  renderDashboard();
  await screen.findByRole('heading', { name: 'Revenue over time' });
  await user.click(screen.getByRole('radio', { name: 'This month' }));
  const today = todayIn(TZ);
  await vi.waitFor(() => expect(lastQuery()).toEqual({ startDate: `${today.slice(0, 8)}01`, endDate: today }));
});

test('a custom date range loads once both ends are set', async () => {
  renderDashboard();
  await screen.findByRole('heading', { name: 'Revenue over time' });
  const today = todayIn(TZ);
  const start = addDays(today, -40);
  fireEvent.change(screen.getByLabelText('From'), { target: { value: start } });
  expect(lastQuery()).toEqual({ startDate: today, endDate: today });
  fireEvent.change(screen.getByLabelText('To'), { target: { value: today } });
  await vi.waitFor(() => expect(lastQuery()).toEqual({ startDate: start, endDate: today }));
});

test('a custom range longer than a year is refused with a reason', async () => {
  renderDashboard();
  await screen.findByRole('heading', { name: 'Revenue over time' });
  const today = todayIn(TZ);
  fireEvent.change(screen.getByLabelText('From'), { target: { value: addDays(today, -400) } });
  fireEvent.change(screen.getByLabelText('To'), { target: { value: today } });
  expect(screen.getByRole('alert')).toHaveTextContent('Pick a range of one year or less.');
  expect(lastQuery()).toEqual({ startDate: today, endDate: today });
});

test('Revenue over time has no table toggle', async () => {
  renderDashboard();
  await screen.findByRole('heading', { name: 'Revenue over time' });
  expect(screen.queryByRole('button', { name: /Show as table|Show chart/ })).not.toBeInTheDocument();
});

test('an error offers a retry, then the report recovers', async () => {
  const user = userEvent.setup();
  request.mockRejectedValueOnce(new ApiError(503, 'Service unavailable'));
  renderDashboard();
  await user.click(await screen.findByRole('button', { name: /try again/i }));
  expect(await screen.findByRole('heading', { name: 'Revenue over time' })).toBeInTheDocument();
});

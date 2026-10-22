import type { ReactNode } from 'react';
import { act, renderHook, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ApiError, NetworkError } from '@/api/client';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/ui/Toast';

import { useForm } from '../useForm';

const wrapper = ({ children }: { children: ReactNode }) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
    <ThemeProvider scheme="light">
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);
const noRules = () => ({});

test('a failure that is not about a field is reported, so a save never fails silently', async () => {
  const { result } = await renderHook(() => useForm({ name: 'x' }, noRules), { wrapper });
  let ok = true;
  await act(async () => {
    ok = await result.current.submit(async () => {
      throw new ApiError(409, 'Court 1 is already booked 7:00 PM - 8:00 PM. Pick another slot.');
    });
  });
  expect(ok).toBe(false);
  expect(await screen.findByText(/Court 1 is already booked 7:00 PM - 8:00 PM\. Pick another slot\./)).toBeOnTheScreen();
});

test('being offline is reported too', async () => {
  const { result } = await renderHook(() => useForm({ name: 'x' }, noRules), { wrapper });
  await act(async () => {
    await result.current.submit(async () => {
      throw new NetworkError();
    });
  });
  expect(await screen.findByText(/Check your connection and try again/)).toBeOnTheScreen();
});

test('422 field errors stay on their fields, with no toast', async () => {
  const { result } = await renderHook(() => useForm({ phone: '' }, noRules), { wrapper });
  await act(async () => {
    await result.current.submit(async () => {
      throw new ApiError(422, 'Invalid', 'VALIDATION', { phone: 'Another customer uses this phone number.' });
    });
  });
  expect(result.current.errors.phone).toBe('Another customer uses this phone number.');
  expect(screen.queryByText(/Couldn't save/)).not.toBeOnTheScreen();
});

test('screens with their own inline error can opt out', async () => {
  const { result } = await renderHook(() => useForm({ name: 'x' }, noRules, { reportErrors: false }), { wrapper });
  await act(async () => {
    await result.current.submit(async () => {
      throw new ApiError(500, 'Boom');
    });
  });
  expect(screen.queryByText(/Couldn't save/)).not.toBeOnTheScreen();
});

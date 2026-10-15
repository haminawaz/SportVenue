import type { ReactNode } from 'react';
import { act, renderHook, screen } from '@testing-library/react';

import { ApiError, NetworkError } from '@/api/client';
import { ToastProvider } from '@/ui/Toast';

import { useForm } from '../useForm';

const wrapper = ({ children }: { children: ReactNode }) => <ToastProvider>{children}</ToastProvider>;
const noRules = () => ({});

test('a failure that is not about a field is reported, so a save never fails silently', async () => {
  const { result } = renderHook(() => useForm({ name: 'x' }, noRules), { wrapper });
  let ok = true;
  await act(async () => {
    ok = await result.current.submit(async () => {
      throw new ApiError(409, 'Court 1 is already booked 7:00 PM - 8:00 PM. Pick another slot.');
    });
  });
  expect(ok).toBe(false);
  expect(await screen.findByText(/Court 1 is already booked 7:00 PM - 8:00 PM\. Pick another slot\./)).toBeInTheDocument();
});

test('being offline is reported too', async () => {
  const { result } = renderHook(() => useForm({ name: 'x' }, noRules), { wrapper });
  await act(async () => {
    await result.current.submit(async () => {
      throw new NetworkError();
    });
  });
  expect(await screen.findByText(/Check your connection and try again/)).toBeInTheDocument();
});

test('422 field errors stay on their fields, with no toast', async () => {
  const { result } = renderHook(() => useForm({ phone: '' }, noRules), { wrapper });
  await act(async () => {
    await result.current.submit(async () => {
      throw new ApiError(422, 'Invalid', 'VALIDATION', { phone: 'Another customer uses this phone number.' });
    });
  });
  expect(result.current.errors.phone).toBe('Another customer uses this phone number.');
  expect(screen.queryByText(/Couldn't save/)).not.toBeInTheDocument();
});

test('screens with their own inline error can opt out', async () => {
  const { result } = renderHook(() => useForm({ name: 'x' }, noRules, { reportErrors: false }), { wrapper });
  await act(async () => {
    await result.current.submit(async () => {
      throw new ApiError(500, 'Boom');
    });
  });
  expect(screen.queryByText(/Couldn't save/)).not.toBeInTheDocument();
});

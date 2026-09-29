import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';

import { useToast } from '@/ui/Toast';

import { ApiError } from './client';
import { toUserFacingError } from './errors';

type Options<TVars, TData> = {
  mutationFn: (vars: TVars) => Promise<TData>;
  /** Query roots to refetch after the server confirms. */
  invalidate?: readonly QueryKey[];
  /** Toast text once the server confirms. */
  successMessage?: string | ((data: TData, vars: TVars) => string);
  /** Title for the error toast. */
  errorTitle?: string;
  /** 422 field errors are usually shown inline by the form, so skip the toast. */
  toastValidationErrors?: boolean;
  onSuccess?: (data: TData, vars: TVars) => void;
};

/**
 * Mutations never assume success: feedback and cache refresh happen only
 * after the server responds OK. Errors surface as a toast with safe copy.
 */
export function useAppMutation<TVars = void, TData = unknown>({
  mutationFn,
  invalidate = [],
  successMessage,
  errorTitle = 'Something went wrong',
  toastValidationErrors = false,
  onSuccess,
}: Options<TVars, TData>) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<TData, unknown, TVars>({
    mutationFn,
    onSuccess: async (data, vars) => {
      if (successMessage) toast.show(typeof successMessage === 'function' ? successMessage(data, vars) : successMessage);
      onSuccess?.(data, vars);
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
    onError: (error) => {
      if (!toastValidationErrors && error instanceof ApiError && error.status === 422 && error.fieldErrors) return;
      const { title, message } = toUserFacingError(error, errorTitle);
      toast.show(`${title}. ${message}`, 'error');
    },
  });
}

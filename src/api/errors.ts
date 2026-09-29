import { ApiError, NetworkError } from './client';

export type UserFacingError = {
  title: string;
  message: string;
  /** False when retrying cannot help (for example, missing permission). */
  retryable: boolean;
};

/**
 * Maps any thrown error to copy that is safe to show a user.
 * Backend messages are shown only for 409 conflicts and 422 validation
 * errors, which the backend writes for end users.
 */
export function toUserFacingError(error: unknown, fallbackTitle = 'Something went wrong'): UserFacingError {
  if (error instanceof NetworkError) {
    return { title: "Can't reach CoyoteOS", message: 'Check your connection and try again.', retryable: true };
  }
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return { title: 'Session expired', message: 'Sign in again to continue.', retryable: false };
      case 403:
        return { title: 'No access', message: "You don't have permission to do that.", retryable: false };
      case 404:
        return { title: 'Not found', message: 'This item no longer exists. It may have been deleted.', retryable: false };
      case 409:
        return { title: fallbackTitle, message: error.message || 'This item changed. Refresh to see the latest.', retryable: false };
      case 410:
        return { title: 'No longer available', message: 'This item changed. Refresh to see the latest.', retryable: true };
      case 422:
        return { title: 'Check the details', message: error.message || 'The request was not valid.', retryable: false };
      case 429:
        return { title: 'Too many requests', message: 'Wait a moment, then try again.', retryable: true };
      default:
        if (error.status >= 500) return { title: fallbackTitle, message: 'Try again in a moment.', retryable: true };
    }
  }
  return { title: fallbackTitle, message: 'Try again in a moment.', retryable: true };
}

/** Field errors from a 422, for showing under the matching inputs. */
export function fieldErrorsOf(error: unknown): Record<string, string> {
  return error instanceof ApiError && error.status === 422 ? (error.fieldErrors ?? {}) : {};
}

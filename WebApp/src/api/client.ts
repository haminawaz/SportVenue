import { API_BASE_URL, USE_MOCKS } from '@/config/env';

/**
 * Shared API client. Screens and hooks never call fetch() directly;
 * feature services call apiRequest().
 *
 * Never logs requests, headers, tokens or response bodies.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
    /** Field-level validation messages from a 422, keyed by input name. */
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Thrown when the request never reached the server (offline, DNS, timeout). */
export class NetworkError extends Error {
  constructor() {
    super('Network request failed');
    this.name = 'NetworkError';
  }
}

type AuthHooks = {
  getAccessToken: () => string | null | Promise<string | null>;
  /** Called on 401 so the session layer can sign the user out. */
  onUnauthorized: () => void;
};

let authHooks: AuthHooks = {
  getAccessToken: () => null,
  onUnauthorized: () => {},
};

/** Registered once by the session layer at app start. */
export function configureApiAuth(hooks: AuthHooks) {
  authHooks = hooks;
}

export type Query = Record<string, string | number | boolean | undefined | null>;

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
};

function buildQueryString(query?: Query) {
  return Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

export async function apiRequest<T>(path: string, { method = 'GET', query, body, signal }: RequestOptions = {}): Promise<T> {
  const token = await authHooks.getAccessToken();

  // When USE_MOCKS is enabled (e.g. local dev, preview/demo deployment, or no backend URL),
  // the in-memory mock server answers instead of the network.
  if (USE_MOCKS) {
    // The in-memory mock server answers instead of the network.
    const { handleMockRequest } = await import('@/dev/mockServer');
    try {
      return (await handleMockRequest({ method, path, query: query ?? {}, body, token })) as T;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) authHooks.onUnauthorized();
      throw error;
    }
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const qs = buildQueryString(query);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    throw new NetworkError();
  }

  if (response.status === 401) authHooks.onUnauthorized();

  if (!response.ok) {
    let message = '';
    let code: string | undefined;
    let fieldErrors: Record<string, string> | undefined;
    try {
      const payload = (await response.json()) as { message?: string | string[]; code?: string; fieldErrors?: Record<string, string> };
      message = Array.isArray(payload.message) ? payload.message.join('\n') : (payload.message ?? '');
      code = payload.code;
      fieldErrors = payload.fieldErrors;
    } catch {
      // Non-JSON error body; fall through with an empty message.
    }
    throw new ApiError(response.status, message, code, fieldErrors);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

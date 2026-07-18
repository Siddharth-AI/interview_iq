import type { ApiResponse } from '@interview-iq/shared';

// When NEXT_PUBLIC_API_URL is empty or unset (production behind the Vercel /api proxy),
// requests go to the same origin at /api. Local development sets it to the API origin.
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || ''}/api`;

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  isForm?: boolean;
  skipRefresh?: boolean;
  signal?: AbortSignal;
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (options.isForm) {
    body = options.body as FormData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  return fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body,
    credentials: 'include',
    signal: options.signal,
  });
}

/**
 * Typed request that unwraps the API envelope. On a 401 it transparently attempts a
 * single token refresh, then retries once, so short-lived access tokens are seamless.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await rawRequest<T>(path, options);

  if (res.status === 401 && !options.skipRefresh && path !== '/auth/refresh') {
    const refreshed = await rawRequest('/auth/refresh', { method: 'POST', skipRefresh: true });
    if (refreshed.ok) {
      res = await rawRequest<T>(path, { ...options, skipRefresh: true });
    }
  }

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!json) {
    throw new ApiClientError('NETWORK', 'Could not reach the server', res.status);
  }
  if (!json.success) {
    throw new ApiClientError(json.error.code, json.error.message, res.status, json.error.details);
  }
  return json.data;
}

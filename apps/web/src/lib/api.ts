import type { ApiEnvelope } from '@coastline/api-contracts';

export const DEMO_COOKIE = 'coastline_demo_user';
/** Seeded tourist used before the visitor picks a persona. */
export const DEFAULT_DEMO_USER = '00000000-0000-4000-8000-000000000002';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly requestId: string;

  constructor(
    status: number,
    body: { code?: string; message?: string; details?: unknown; requestId?: string },
  ) {
    super(body.message ?? 'The request failed.');
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code ?? 'INTERNAL_ERROR';
    this.details = body.details ?? null;
    this.requestId = body.requestId ?? '';
  }
}

function serverApiUrl(path: string): string {
  const base = (process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');
  return `${base}/api/v1${path}`;
}

function readClientUserId(): string {
  if (typeof document === 'undefined') {
    return DEFAULT_DEMO_USER;
  }
  const match = document.cookie.split('; ').find((entry) => entry.startsWith(`${DEMO_COOKIE}=`));
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : DEFAULT_DEMO_USER;
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const errorBody =
      payload && typeof payload === 'object' && 'error' in payload
        ? (
            payload as {
              error: { code?: string; message?: string; details?: unknown; requestId?: string };
            }
          ).error
        : {};
    throw new ApiError(response.status, errorBody);
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

/** Server-side fetch straight to the API, authenticated by the demo cookie. */
export async function serverApi<T>(
  path: string,
  userId: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(serverApiUrl(path), {
    ...init,
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      'x-demo-user-id': userId,
      ...init.headers,
    },
  });
  return parse<T>(response);
}

/** Browser fetch through the Next rewrite. */
export async function clientApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      'x-demo-user-id': readClientUserId(),
      ...init.headers,
    },
  });
  return parse<T>(response);
}

export function setDemoUser(userId: string): void {
  document.cookie = `${DEMO_COOKIE}=${encodeURIComponent(userId)}; path=/; max-age=31536000; samesite=lax`;
}

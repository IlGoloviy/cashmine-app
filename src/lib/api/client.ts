import type { z } from 'zod';

import { getToken } from '@/lib/auth/token-storage';
import { env } from '@/lib/env';

import { ApiError } from './errors';

const DEFAULT_TIMEOUT_MS = 15_000;

type Query = Record<string, string | number | boolean | undefined | null>;

export type RequestOptions<TSchema extends z.ZodType> = {
  /** Every response is validated: we never trust the wire format with money. */
  schema: TSchema;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  /** Pass TanStack Query's `signal` so unmounted screens cancel their requests. */
  signal?: AbortSignal;
  /**
   * Required for anything that moves funds: if the client retries after a timeout,
   * the server can de-duplicate instead of executing the transfer twice.
   */
  idempotencyKey?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  /** Skip the Authorization header (e.g. sign-in endpoint). */
  anonymous?: boolean;
};

export function buildUrl(path: string, query?: Query): string {
  const url = `${env.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function request<TSchema extends z.ZodType>(
  path: string,
  options: RequestOptions<TSchema>,
): Promise<z.output<TSchema>> {
  const { schema, method = 'GET', query, body, signal, idempotencyKey, anonymous } = options;

  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  if (!anonymous) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // Own controller so we can combine caller cancellation with our timeout.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (cause) {
    // Caller cancelled (screen unmounted / query superseded): rethrow untouched,
    // TanStack Query recognises AbortError and ignores it.
    if (signal?.aborted) throw cause;
    if (timedOut) throw new ApiError('timeout', `${method} ${path} timed out`, { cause });
    throw new ApiError('network', `${method} ${path} failed`, { cause });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }

  const payload = await readBody(response);

  if (!response.ok) {
    throw new ApiError('http', extractServerMessage(payload) ?? response.statusText, {
      status: response.status,
      body: payload,
    });
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    if (__DEV__) {
      console.warn(`[api] ${method} ${path} schema mismatch`, result.error.issues, payload);
    }
    throw new ApiError('parse', `Unexpected response from ${method} ${path}`, {
      status: response.status,
      body: payload,
      cause: result.error,
    });
  }
  return result.data;
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractServerMessage(payload: unknown): string | undefined {
  if (typeof payload === 'string' && payload.length < 200) return payload;
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['message', 'error', 'detail', 'title']) {
      const value = record[key];
      if (typeof value === 'string') return value;
    }
  }
  return undefined;
}

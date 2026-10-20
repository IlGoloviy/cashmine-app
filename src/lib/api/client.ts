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
    const envelope = readErrorEnvelope(payload);
    throw new ApiError('http', envelope.message ?? response.statusText, {
      status: response.status,
      body: payload,
      code: envelope.code,
      field: envelope.field,
      retryAfterMs: envelope.retryAfterMs ?? retryAfterHeaderMs(response),
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

type ErrorEnvelope = { message?: string; code?: string; field?: string; retryAfterMs?: number };

/** API errors look like `{ "error": { "code", "message", "field"?, "retryAfterMs"? } }`. */
function readErrorEnvelope(payload: unknown): ErrorEnvelope {
  if (typeof payload === 'string') return { message: payload.length < 200 ? payload : undefined };
  if (!payload || typeof payload !== 'object') return {};
  const record = payload as Record<string, unknown>;
  const inner =
    record.error && typeof record.error === 'object'
      ? (record.error as Record<string, unknown>)
      : record;
  const str = (value: unknown) => (typeof value === 'string' ? value : undefined);
  return {
    message: str(inner.message) ?? str(record.error) ?? str(inner.detail),
    code: str(inner.code),
    field: str(inner.field),
    retryAfterMs:
      typeof inner.retryAfterMs === 'number' && inner.retryAfterMs >= 0
        ? inner.retryAfterMs
        : undefined,
  };
}

function retryAfterHeaderMs(response: Response): number | undefined {
  const seconds = Number(response.headers.get('Retry-After'));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : undefined;
}

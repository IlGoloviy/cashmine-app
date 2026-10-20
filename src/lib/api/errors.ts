export type ApiErrorKind =
  /** Server answered with a non-2xx status. */
  | 'http'
  /** Request never got a response (offline, DNS, TLS, CORS on web). */
  | 'network'
  /** We aborted because the server was too slow. */
  | 'timeout'
  /** Server answered 2xx but the body did not match our schema. */
  | 'parse';

export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  readonly body: unknown;
  /** API error code, e.g. VALIDATION, RATE_LIMITED, IDEMPOTENCY_MISMATCH. */
  readonly code: string | undefined;
  /** For VALIDATION: the request field the server rejected (e.g. "amount"). */
  readonly field: string | undefined;
  /** For 429: how long the server asks us to wait. */
  readonly retryAfterMs: number | undefined;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: {
      status?: number;
      body?: unknown;
      cause?: unknown;
      code?: string;
      field?: string;
      retryAfterMs?: number;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.kind = kind;
    this.status = options.status;
    this.body = options.body;
    this.code = options.code;
    this.field = options.field;
    this.retryAfterMs = options.retryAfterMs;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  /** 4xx means "your request is wrong" — repeating it will not help. */
  get isClientError() {
    return this.status !== undefined && this.status >= 400 && this.status < 500;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Human-readable message for UI. Never leak raw server internals. */
export function getErrorMessage(error: unknown): string {
  if (!isApiError(error)) return 'Something went wrong. Please try again.';
  switch (error.kind) {
    case 'network':
      return 'No connection. Check your internet and try again.';
    case 'timeout':
      return 'The server is taking too long. Please try again.';
    case 'parse':
      return 'We received unexpected data from the server.';
    case 'http':
      if (error.isUnauthorized) return 'Your session has expired. Please sign in again.';
      if (error.status === 429) return 'Too many requests. Please wait a moment.';
      if (error.status === 504) return 'The server did not finish in time. Please try again.';
      if (error.status !== undefined && error.status >= 500) {
        return 'The server had a temporary problem. Please try again.';
      }
      return error.message || `Request failed (${error.status}).`;
  }
}

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

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: { status?: number; body?: unknown; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.kind = kind;
    this.status = options.status;
    this.body = options.body;
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
      return error.message || `Request failed (${error.status}).`;
  }
}

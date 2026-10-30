import { ApiError } from '@/lib/api';

import { isOutcomeUnknown } from '../outcome';

describe('isOutcomeUnknown (POST /v1/claims failed — was a claim created?)', () => {
  it.each([
    ['network', new ApiError('network', 'x')],
    ['timeout', new ApiError('timeout', 'x')],
    ['unparseable 2xx', new ApiError('parse', 'x', { status: 201 })],
    ['500', new ApiError('http', 'x', { status: 500 })],
    ['503', new ApiError('http', 'x', { status: 503 })],
    ['504 TIMEOUT', new ApiError('http', 'x', { status: 504, code: 'TIMEOUT' })],
    ['non-ApiError', new Error('boom')],
    // Rate limited: the server didn't process THIS request; the original may exist.
    ['429 on "Check again"', new ApiError('http', 'x', { status: 429, retryAfterMs: 2000 })],
    // Auth can lapse between the original request and the resend.
    ['401', new ApiError('http', 'x', { status: 401 })],
    ['403', new ApiError('http', 'x', { status: 403 })],
    ['408', new ApiError('http', 'x', { status: 408 })],
  ])('%s → unknown, keep the key', (_, error) => expect(isOutcomeUnknown(error)).toBe(true));

  it.each([
    ['400 VALIDATION', new ApiError('http', 'x', { status: 400, code: 'VALIDATION' })],
    ['422', new ApiError('http', 'x', { status: 422 })],
    ['409 IDEMPOTENCY_MISMATCH', new ApiError('http', 'x', { status: 409 })],
  ])('%s → definitely not created', (_, error) => expect(isOutcomeUnknown(error)).toBe(false));
});

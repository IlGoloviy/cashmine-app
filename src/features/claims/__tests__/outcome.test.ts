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
  ])('%s → unknown', (_, error) => expect(isOutcomeUnknown(error)).toBe(true));

  it.each([
    ['400 VALIDATION', new ApiError('http', 'x', { status: 400, code: 'VALIDATION' })],
    ['401', new ApiError('http', 'x', { status: 401 })],
    ['409 IDEMPOTENCY_MISMATCH', new ApiError('http', 'x', { status: 409 })],
    ['429', new ApiError('http', 'x', { status: 429 })],
  ])('%s → definitely not created', (_, error) => expect(isOutcomeUnknown(error)).toBe(false));
});

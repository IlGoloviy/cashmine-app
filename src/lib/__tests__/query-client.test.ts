import { ApiError } from '@/lib/api';
import { retryDelay, shouldRetry } from '@/lib/query-client';

const http = (status: number) => new ApiError('http', 'x', { status });

describe('shouldRetry', () => {
  it.each([
    ['network', new ApiError('network', 'x')],
    ['timeout', new ApiError('timeout', 'x')],
    ['500', http(500)],
    ['503', http(503)],
    ['408', http(408)],
  ])('retries transient %s twice, then stops', (_, error) => {
    expect(shouldRetry(0, error)).toBe(true);
    expect(shouldRetry(1, error)).toBe(true);
    expect(shouldRetry(2, error)).toBe(false);
  });

  it.each([401, 403, 404, 422])('never retries client error %s', (status) => {
    expect(shouldRetry(0, http(status))).toBe(false);
  });

  it('gives 429 one extra retry', () => {
    expect(shouldRetry(2, http(429))).toBe(true);
    expect(shouldRetry(3, http(429))).toBe(false);
  });

  it('never retries schema mismatches or non-API errors', () => {
    expect(shouldRetry(0, new ApiError('parse', 'x'))).toBe(false);
    expect(shouldRetry(0, new TypeError('undefined is not a function'))).toBe(false);
  });
});

describe('retryDelay', () => {
  it('grows exponentially, stays within jitter bounds and is capped', () => {
    for (let i = 0; i < 20; i++) {
      const first = retryDelay(0, http(500));
      expect(first).toBeGreaterThanOrEqual(500);
      expect(first).toBeLessThanOrEqual(1_000);
      expect(retryDelay(10, http(500))).toBeLessThanOrEqual(30_000);
    }
  });

  it('waits longer after a 429', () => {
    expect(retryDelay(0, http(429))).toBeGreaterThanOrEqual(2_000);
  });
});

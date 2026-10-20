import { z } from 'zod';

import { ApiError, request } from '@/lib/api';
import { setToken } from '@/lib/auth/token-storage';

const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const Schema = z.object({ id: z.string() });

beforeAll(() => setToken('test-token'));
afterEach(() => mockFetch.mockReset());

describe('request', () => {
  it('sends auth + query and returns parsed data', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: 'a1', extra: true }));

    const data = await request('/assets', { schema: Schema, query: { page: 2, q: undefined } });

    expect(data).toEqual({ id: 'a1' });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://task-api.cashmine.io/assets?page=2');
    expect(init.headers.Authorization).toBe('Bearer test-token');
  });

  it('throws http ApiError with server message', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ message: 'Insufficient funds' }, 422));

    await expect(
      request('/transfers', { schema: Schema, method: 'POST', body: {} }),
    ).rejects.toMatchObject({
      kind: 'http',
      status: 422,
      message: 'Insufficient funds',
    });
  });

  it('reads the API error envelope (code, field, retryAfterMs)', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ error: { code: 'VALIDATION', message: 'Too small', field: 'amount' } }, 400),
    );
    await expect(request('/v1/claims', { schema: Schema, method: 'POST' })).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION',
      field: 'amount',
      message: 'Too small',
    });

    mockFetch.mockResolvedValue(
      jsonResponse(
        { error: { code: 'RATE_LIMITED', message: 'Slow down', retryAfterMs: 2300 } },
        429,
      ),
    );
    await expect(request('/v1/balances', { schema: Schema })).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      retryAfterMs: 2300,
    });
  });

  it('throws parse ApiError when the response does not match the schema', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: 42 }));
    await expect(request('/x', { schema: Schema })).rejects.toMatchObject({ kind: 'parse' });
  });

  it('maps fetch failures to network errors', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));
    const error = await request('/x', { schema: Schema }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('network');
  });

  it('sends the idempotency key for money-moving calls', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: 't1' }, 201));
    await request('/transfers', {
      schema: Schema,
      method: 'POST',
      body: {},
      idempotencyKey: 'k-1',
    });
    expect(mockFetch.mock.calls[0][1].headers['Idempotency-Key']).toBe('k-1');
  });
});

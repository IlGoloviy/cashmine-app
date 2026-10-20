import { z } from 'zod';

import { request } from '@/lib/api';

/**
 * Check a token before saving it: any authenticated read works. We pass the
 * header explicitly (anonymous: true skips the stored token) so "change token"
 * tests the new value, not the old one.
 */
export async function verifyToken(token: string, signal?: AbortSignal): Promise<void> {
  await request('/v1/balances', {
    schema: z.unknown(),
    anonymous: true,
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
}

import { request } from '@/lib/api';

import { ClaimOptionsSchema, ClaimSchema, type CreateClaimInput } from './schemas';

export function fetchClaimOptions(asset: string, signal?: AbortSignal) {
  return request('/v1/claim-options', { schema: ClaimOptionsSchema, query: { asset }, signal });
}

/**
 * Moves money. `idempotencyKey` must be created once per user intent and reused
 * for every resend of the same body — the server then returns the original claim
 * instead of creating a second one.
 */
export function createClaim(input: CreateClaimInput, idempotencyKey: string) {
  return request('/v1/claims', {
    schema: ClaimSchema,
    method: 'POST',
    body: input,
    idempotencyKey,
  });
}

export function fetchClaim(id: string, signal?: AbortSignal) {
  return request(`/v1/claims/${encodeURIComponent(id)}`, { schema: ClaimSchema, signal });
}

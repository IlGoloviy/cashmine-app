import { isApiError } from '@/lib/api';

/**
 * Responses that prove the server looked at this request and refused it, so no
 * claim exists under this idempotency key:
 * - 400 / 422: validation rejected the body.
 * - 409: the key is already bound to a different body (IDEMPOTENCY_MISMATCH).
 * Everything else — 401/403 (auth can lapse mid-flow), 429 (rate limited: "not now",
 * says nothing about the original request), 408, 5xx, network, timeout, unreadable
 * 2xx, non-API errors — leaves the outcome unknown.
 */
const DEFINITELY_NOT_CREATED = new Set([400, 409, 422]);

/**
 * Did a failed POST /v1/claims possibly create a claim anyway?
 * Allowlist, not denylist: the saved attempt and its key may only be dropped when
 * we know for certain nothing was created. When unsure, keep the key (the safe
 * side for money) — a resend with the same key can never create a second claim.
 */
export function isOutcomeUnknown(error: unknown): boolean {
  if (!isApiError(error) || error.kind !== 'http' || error.status === undefined) return true;
  return !DEFINITELY_NOT_CREATED.has(error.status);
}

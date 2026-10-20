import { isApiError } from '@/lib/api';

/**
 * Did a failed POST /v1/claims possibly create a claim anyway?
 * - 4xx: the server rejected the request → definitely not created.
 * - network / timeout / 5xx / 504: we never saw the answer → unknown.
 * - parse on a 2xx: the server said yes but we couldn't read it → unknown.
 * - anything unexpected: treat as unknown (the safe side for money).
 */
export function isOutcomeUnknown(error: unknown): boolean {
  if (!isApiError(error)) return true;
  if (error.kind !== 'http') return true;
  if (error.status === 408) return true;
  return !error.isClientError;
}

import { randomUUID } from 'expo-crypto';

/**
 * Create the key ONCE per user intent (e.g. when the confirm screen mounts),
 * not per request — retries of the same intent must reuse it.
 */
export function newIdempotencyKey(): string {
  return randomUUID();
}

import { useSyncExternalStore } from 'react';

import type { Claim } from './schemas';

/**
 * Claims created in this browser session, kept with their latest known status.
 * Feeds the balance overlay (overlay.ts). In memory only: after a reload the
 * next balance snapshot (≤ 15 s) already includes them.
 */
let claims: readonly Claim[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function upsertLocalClaim(claim: Claim) {
  const existing = claims.find((c) => c.id === claim.id);
  // Ignore stale responses that would move a claim backwards in time.
  if (existing && Date.parse(existing.updatedAt) > Date.parse(claim.updatedAt)) return;
  claims = [...claims.filter((c) => c.id !== claim.id), claim];
  emit();
}

export function getLocalClaim(id: string): Claim | undefined {
  return claims.find((c) => c.id === id);
}

export function clearLocalClaims() {
  claims = [];
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLocalClaims(): readonly Claim[] {
  return useSyncExternalStore(
    subscribe,
    () => claims,
    () => claims,
  );
}

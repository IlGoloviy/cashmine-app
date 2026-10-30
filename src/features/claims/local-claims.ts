import { useSyncExternalStore } from 'react';

import type { Claim } from './schemas';

/**
 * Claims created in this browser session, kept with their latest known status.
 * Feeds the balance overlay (overlay.ts), the app-wide pending-claim watcher
 * (pending-claims-watcher.tsx) and the settle notices shown on Home.
 * In memory only: after a reload the next balance snapshot (≤ 15 s) already includes them.
 */
let claims: readonly Claim[] = [];
let notices: readonly Claim[] = [];
const listeners = new Set<() => void>();
/** Claim ids whose status screen is open — the user is already watching the result. */
const viewing = new Map<string, number>();

function emit() {
  for (const listener of listeners) listener();
}

export function upsertLocalClaim(claim: Claim) {
  const existing = claims.find((c) => c.id === claim.id);
  if (existing) {
    // Ignore stale responses that would move a claim backwards in time.
    if (Date.parse(existing.updatedAt) > Date.parse(claim.updatedAt)) return;
    // Nothing new: don't wake subscribers (the watcher re-upserts on every render).
    if (existing.updatedAt === claim.updatedAt && existing.status === claim.status) return;
  }
  claims = [...claims.filter((c) => c.id !== claim.id), claim];
  // Settled while the user wasn't looking: tell them on Home instead of silently
  // moving the balance (review finding).
  if (existing?.status === 'pending' && claim.status !== 'pending' && !viewing.has(claim.id)) {
    notices = [...notices.filter((n) => n.id !== claim.id), claim];
  }
  emit();
}

export function getLocalClaim(id: string): Claim | undefined {
  return claims.find((c) => c.id === id);
}

export function dismissClaimNotice(id: string) {
  notices = notices.filter((n) => n.id !== id);
  emit();
}

/** Call while a claim's status screen is mounted; returns the cleanup. */
export function markClaimViewed(id: string): () => void {
  viewing.set(id, (viewing.get(id) ?? 0) + 1);
  // Opening the claim answers any pending notice about it.
  if (notices.some((n) => n.id === id)) dismissClaimNotice(id);
  return () => {
    const count = (viewing.get(id) ?? 1) - 1;
    if (count <= 0) viewing.delete(id);
    else viewing.set(id, count);
  };
}

export function clearLocalClaims() {
  claims = [];
  notices = [];
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

export function useClaimNotices(): readonly Claim[] {
  return useSyncExternalStore(
    subscribe,
    () => notices,
    () => notices,
  );
}

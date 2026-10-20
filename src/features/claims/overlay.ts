import type { Balance, Balances } from '@/features/balances/schemas';
import { fromBaseUnits, toBaseUnits } from '@/lib/money';

import type { Claim } from './schemas';

/**
 * Balance-after-claim (see NOTES.md, decision B3).
 *
 * Balances are server snapshots recomputed every ~15 s, so a snapshot can be older
 * than a claim we just created (or older than its latest status change). For each
 * claim created in this session we work out what state the snapshot saw it in
 * (from `asOf` vs the claim's server timestamps — no client clock involved) and
 * move only the difference between that and the claim's current state:
 *
 *   seen \ now   pending                      completed        failed
 *   absent       available −a, claiming +a    available −a     —
 *   pending      —                            claiming −a      claiming −a, available +a
 *
 * Once a snapshot catches up, the difference is zero and the overlay disappears
 * by itself, so numbers never "jump back" unless a claim really failed.
 */
type SeenState = 'absent' | Claim['status'];

function seenBySnapshot(claim: Claim, asOf: number): SeenState {
  if (asOf < Date.parse(claim.createdAt)) return 'absent';
  // We only know the latest transition: if it happened after the snapshot,
  // the snapshot still saw the claim as pending.
  if (claim.status !== 'pending' && asOf < Date.parse(claim.updatedAt)) return 'pending';
  return claim.status;
}

type Delta = { available: bigint; claiming: bigint };

function deltaFor(claim: Claim, asOf: number, decimals: number): Delta {
  const a = toBaseUnits(claim.amount, decimals);
  const seen = seenBySnapshot(claim, asOf);
  const now = claim.status;
  if (seen === now) return { available: 0n, claiming: 0n };
  if (seen === 'absent') {
    if (now === 'pending') return { available: -a, claiming: a };
    if (now === 'completed') return { available: -a, claiming: 0n };
    return { available: 0n, claiming: 0n };
  }
  if (seen === 'pending') {
    if (now === 'completed') return { available: 0n, claiming: -a };
    if (now === 'failed') return { available: a, claiming: -a };
  }
  // Terminal states don't change; anything else would be inconsistent data — leave as is.
  return { available: 0n, claiming: 0n };
}

export type DisplayBalance = Balance & {
  /** True when local claims changed these numbers relative to the snapshot. */
  adjusted: boolean;
};

export function applyLocalClaims(
  balances: Balances,
  claims: readonly Claim[],
): { asOf: string; items: DisplayBalance[]; adjusted: boolean } {
  const asOf = Date.parse(balances.asOf);
  const items = balances.items.map((balance): DisplayBalance => {
    let available = toBaseUnits(balance.available, balance.decimals);
    let claiming = toBaseUnits(balance.claiming, balance.decimals);
    let adjusted = false;
    for (const claim of claims) {
      if (claim.asset !== balance.asset) continue;
      const delta = deltaFor(claim, asOf, balance.decimals);
      if (delta.available === 0n && delta.claiming === 0n) continue;
      available += delta.available;
      claiming += delta.claiming;
      adjusted = true;
    }
    if (!adjusted) return { ...balance, adjusted };
    // Never display negative money if snapshots and claims disagree momentarily.
    const clamp = (units: bigint) => (units < 0n ? 0n : units);
    return {
      ...balance,
      available: fromBaseUnits(clamp(available), balance.decimals),
      claiming: fromBaseUnits(clamp(claiming), balance.decimals),
      adjusted,
    };
  });
  return { asOf: balances.asOf, items, adjusted: items.some((item) => item.adjusted) };
}

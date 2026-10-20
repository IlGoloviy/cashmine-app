import { multiply, scaledToString, sumScaled, type Scaled } from '@/lib/money';

import type { Balance } from './schemas';

/** Everything the user owns in this asset: available + pending + claiming (exact). */
function holdings(balance: Balance): Scaled[] {
  return [balance.available, balance.pending, balance.claiming].map((amount) =>
    multiply(amount, balance.usdPrice),
  );
}

/** USD value of one asset's holdings, truncated to cents (never shows more than owned). */
export function assetUsd(balance: Balance): string {
  return scaledToString(sumScaled(holdings(balance)), 2);
}

/**
 * Portfolio total in USD. Summed exactly across assets first and truncated once,
 * so per-asset rounding can't add up to a visible error.
 */
export function totalUsd(balances: Balance[]): string {
  return scaledToString(sumScaled(balances.flatMap(holdings)), 2);
}

import { fromBaseUnits, isApiAmount, toBaseUnits } from '@/lib/money';

export type AmountRules = {
  asset: string;
  decimals: number;
  /** What the user can claim now (snapshot, with this session's claims applied). */
  available: string;
  minAmount: string;
  fee: string;
};

export type AmountCheck =
  { ok: true; amount: string; receive: string } | { ok: false; error: string };

/** Phone keyboards in many locales type "," as the decimal separator. */
export function normalizeAmountInput(input: string): string {
  return input.trim().replace(',', '.');
}

/**
 * Validate a claim amount against the API rules: amount grammar, at most
 * `decimals` places, minAmount <= amount <= available, and the user must receive
 * something after the fee. All math in bigint base units.
 */
export function validateClaimAmount(input: string, rules: AmountRules): AmountCheck {
  const { asset, decimals } = rules;
  const value = normalizeAmountInput(input);
  if (!value) return { ok: false, error: 'Enter an amount.' };
  if (!isApiAmount(value)) return { ok: false, error: 'Use digits and one dot, e.g. 0.5' };
  const fraction = value.split('.')[1] ?? '';
  if (fraction.length > decimals) {
    return { ok: false, error: `${asset} allows at most ${decimals} decimal places.` };
  }

  const units = toBaseUnits(value, decimals);
  const min = toBaseUnits(rules.minAmount, decimals);
  const available = toBaseUnits(rules.available, decimals);
  const fee = toBaseUnits(rules.fee, decimals);

  if (units <= 0n) return { ok: false, error: 'Amount must be greater than 0.' };
  if (units < min) return { ok: false, error: `Minimum claim is ${rules.minAmount} ${asset}.` };
  if (units > available) {
    return {
      ok: false,
      error: `You can claim at most ${fromBaseUnits(available, decimals)} ${asset}.`,
    };
  }
  if (units <= fee) {
    return { ok: false, error: `Amount must be more than the ${rules.fee} ${asset} fee.` };
  }
  return {
    ok: true,
    amount: fromBaseUnits(units, decimals),
    receive: fromBaseUnits(units - fee, decimals),
  };
}

/** "Max" fills in everything available, in canonical form. */
export function maxAmount(available: string, decimals: number): string {
  return fromBaseUnits(toBaseUnits(available, decimals), decimals);
}

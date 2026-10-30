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

/**
 * "1,500" / "10,000" / "1,000,000": could be thousands grouping (en-US) or a decimal
 * comma (uk-UA, de-DE). Guessing would silently change the amount by 1000×, so
 * these are rejected instead.
 */
const GROUPED_THOUSANDS_RE = /^\d{1,3}(,\d{3})+$/;

export const AMBIGUOUS_AMOUNT_ERROR =
  'Use a dot for decimals and no thousands separators, e.g. 10000 or 10.5';

/**
 * Phone keyboards in many locales type "," as the decimal separator, so a single
 * comma that can't be thousands grouping ("0,5", "10,25") is read as a decimal point.
 * Returns null when the input is ambiguous.
 */
export function normalizeAmountInput(input: string): string | null {
  const value = input.trim();
  if (GROUPED_THOUSANDS_RE.test(value)) return null;
  if (value.includes(',') && value.includes('.')) return null;
  return value.replace(',', '.');
}

/**
 * Validate a claim amount against the API rules: amount grammar, at most
 * `decimals` places, minAmount <= amount <= available, and the user must receive
 * something after the fee. All math in bigint base units.
 */
export function validateClaimAmount(input: string, rules: AmountRules): AmountCheck {
  const { asset, decimals } = rules;
  if (!input.trim()) return { ok: false, error: 'Enter an amount.' };
  const value = normalizeAmountInput(input);
  if (value === null) return { ok: false, error: AMBIGUOUS_AMOUNT_ERROR };
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

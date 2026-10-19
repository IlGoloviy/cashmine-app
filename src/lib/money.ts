/**
 * Crypto amounts must never go through JS `number`:
 *   0.1 + 0.2 !== 0.3, and 18-decimal token amounts exceed 2^53.
 * Keep amounts as decimal strings (or bigint base units) end-to-end and only
 * format for display.
 */

const DECIMAL_RE = /^-?\d+(\.\d+)?$/;

export function isDecimalString(value: string): boolean {
  return DECIMAL_RE.test(value);
}

/** "1.5" with 6 decimals -> 1500000n. Throws on too many fraction digits. */
export function toBaseUnits(amount: string, decimals: number): bigint {
  if (!isDecimalString(amount)) throw new Error(`Invalid amount: ${amount}`);
  const negative = amount.startsWith('-');
  const [whole = '0', fraction = ''] = amount.replace('-', '').split('.');
  if (fraction.length > decimals) {
    throw new Error(`Amount ${amount} has more than ${decimals} decimals`);
  }
  const units = BigInt(whole + fraction.padEnd(decimals, '0'));
  return negative ? -units : units;
}

/** 1500000n with 6 decimals -> "1.5" */
export function fromBaseUnits(units: bigint, decimals: number): string {
  const negative = units < 0n;
  const digits = (negative ? -units : units).toString().padStart(decimals + 1, '0');
  const whole = digits.slice(0, digits.length - decimals);
  const fraction = digits.slice(digits.length - decimals).replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

/**
 * Display formatting: thousands separators + capped fraction digits, truncated
 * (never rounded up — showing more than the user owns is worse than showing less).
 */
export function formatAmount(
  amount: string,
  { maxFractionDigits = 8, symbol }: { maxFractionDigits?: number; symbol?: string } = {},
): string {
  if (!isDecimalString(amount)) return amount;
  const negative = amount.startsWith('-');
  const [whole = '0', fraction = ''] = amount.replace('-', '').split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const cut = fraction.slice(0, maxFractionDigits).replace(/0+$/, '');
  const value = `${negative ? '-' : ''}${grouped}${cut ? `.${cut}` : ''}`;
  return symbol ? `${value} ${symbol}` : value;
}

/** Fiat values from the API (usually 2 decimals). Uses Intl, fine for display only. */
export function formatFiat(amount: string | number, currency = 'USD'): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(value)) return String(amount);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

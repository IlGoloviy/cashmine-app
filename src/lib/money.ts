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

/**
 * The API's amount grammar: digits, optional dot + digits, no leading zeros, no sign.
 * "0.5" / "12" ok; ".5", "1.", "05", "1e-3", "-1" not. Used for user input.
 */
const API_AMOUNT_RE = /^(0|[1-9]\d*)(\.\d+)?$/;

export function isApiAmount(value: string): boolean {
  return API_AMOUNT_RE.test(value);
}

/** Number of fraction digits a decimal string carries ("1.50" -> 2). */
function scaleOf(amount: string): number {
  const dot = amount.indexOf('.');
  return dot === -1 ? 0 : amount.length - dot - 1;
}

/** A decimal as exact integer + scale: { units: 1234n, scale: 2 } is 12.34. */
export type Scaled = { units: bigint; scale: number };

export function toScaled(amount: string): Scaled {
  const scale = scaleOf(amount);
  return { units: toBaseUnits(amount, scale), scale };
}

/** Exact product of two decimal strings (e.g. amount × usdPrice). */
export function multiply(a: string, b: string): Scaled {
  const x = toScaled(a);
  const y = toScaled(b);
  return { units: x.units * y.units, scale: x.scale + y.scale };
}

/** Exact sum of scaled values at the largest scale. */
export function sumScaled(values: Scaled[]): Scaled {
  const scale = Math.max(0, ...values.map((v) => v.scale));
  const units = values.reduce((acc, v) => acc + v.units * 10n ** BigInt(scale - v.scale), 0n);
  return { units, scale };
}

/** Truncate (toward zero) to `digits` fraction digits and render as a decimal string. */
export function scaledToString({ units, scale }: Scaled, digits: number): string {
  const truncated = scale > digits ? units / 10n ** BigInt(scale - digits) : units;
  const outScale = Math.min(scale, digits);
  const raw = fromBaseUnits(truncated, outScale);
  if (digits === 0) return raw;
  const [whole, fraction = ''] = raw.split('.');
  return `${whole}.${fraction.padEnd(digits, '0')}`;
}

/** "$1,234.50" from an exact USD decimal string (already truncated to cents). */
export function formatUsd(usd: string): string {
  const negative = usd.startsWith('-');
  const [whole = '0', fraction = '00'] = usd.replace('-', '').split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}$${grouped}.${fraction.padEnd(2, '0').slice(0, 2)}`;
}

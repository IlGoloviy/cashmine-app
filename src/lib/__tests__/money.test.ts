import { formatAmount, fromBaseUnits, toBaseUnits } from '@/lib/money';

describe('money', () => {
  it('round-trips base units without float error', () => {
    expect(toBaseUnits('0.1', 18) + toBaseUnits('0.2', 18)).toBe(toBaseUnits('0.3', 18));
    expect(fromBaseUnits(toBaseUnits('1234.000001', 6), 6)).toBe('1234.000001');
    expect(fromBaseUnits(1n, 18)).toBe('0.000000000000000001');
    expect(fromBaseUnits(-1500000n, 6)).toBe('-1.5');
  });

  it('rejects amounts with too many decimals', () => {
    expect(() => toBaseUnits('1.1234567', 6)).toThrow();
    expect(() => toBaseUnits('abc', 6)).toThrow();
  });

  it('formats with grouping and truncates instead of rounding up', () => {
    expect(formatAmount('1234567.999999999', { maxFractionDigits: 4 })).toBe('1,234,567.9999');
    expect(formatAmount('0.5000', { symbol: 'ETH' })).toBe('0.5 ETH');
    expect(formatAmount('-1000')).toBe('-1,000');
  });
});

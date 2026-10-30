import {
  AMBIGUOUS_AMOUNT_ERROR,
  maxAmount,
  validateClaimAmount,
  type AmountRules,
} from '../amount';

const ETH: AmountRules = {
  asset: 'ETH',
  decimals: 18,
  available: '12.345678901234591676',
  minAmount: '0.01',
  fee: '0.0012',
};

const err = (input: string, rules = ETH) => {
  const result = validateClaimAmount(input, rules);
  return result.ok ? null : result.error;
};

describe('validateClaimAmount', () => {
  it('computes receive = amount − fee exactly (docs example)', () => {
    expect(validateClaimAmount('0.5', ETH)).toEqual({ ok: true, amount: '0.5', receive: '0.4988' });
  });

  it('rejects anything outside the API amount grammar', () => {
    for (const bad of ['.5', '1.', '05', '1e-3', '-1', '1.2.3', '1 000', 'abc', '+1', '0x10']) {
      expect(err(bad)).toMatch(/digits/);
    }
    expect(err('')).toBe('Enter an amount.');
    expect(err('   ')).toBe('Enter an amount.');
  });

  it('accepts a comma decimal separator and canonicalises the amount sent', () => {
    expect(validateClaimAmount('0,5', ETH)).toMatchObject({ ok: true, amount: '0.5' });
    expect(validateClaimAmount('10,25', ETH)).toMatchObject({ ok: true, amount: '10.25' });
    expect(validateClaimAmount('1,5000', ETH)).toMatchObject({ ok: true, amount: '1.5' });
    expect(validateClaimAmount('1.500', ETH)).toMatchObject({ ok: true, amount: '1.5' });
  });

  it('rejects comma input that could be thousands grouping instead of guessing', () => {
    // Review finding: "10,000" used to be accepted as 10.
    const big = { ...ETH, available: '2000000' };
    for (const ambiguous of ['10,000', '1,500', '100,000', '1,000,000', '1.000,5', '1,000.5']) {
      expect(err(ambiguous, big)).toBe(AMBIGUOUS_AMOUNT_ERROR);
    }
  });

  it('enforces the asset decimals', () => {
    const usdt = { ...ETH, asset: 'USDT', decimals: 6, available: '820.413207', fee: '1' };
    expect(err('2.1234567', usdt)).toBe('USDT allows at most 6 decimal places.');
    expect(validateClaimAmount('2.123456', usdt)).toMatchObject({ ok: true, receive: '1.123456' });
  });

  it('enforces minAmount <= amount <= available, inclusive at both ends', () => {
    expect(err('0.009999')).toBe('Minimum claim is 0.01 ETH.');
    expect(validateClaimAmount('0.01', ETH).ok).toBe(true);
    expect(validateClaimAmount('12.345678901234591676', ETH).ok).toBe(true);
    // One base unit (1 wei) over available — a float would never see this.
    expect(err('12.345678901234591677')).toMatch(/at most 12.345678901234591676 ETH/);
  });

  it('requires the user to receive something after the fee', () => {
    const rules = { ...ETH, minAmount: '0.001' };
    expect(err('0.0012', rules)).toMatch(/more than the 0.0012 ETH fee/);
    expect(validateClaimAmount('0.001200000000000001', rules)).toMatchObject({
      ok: true,
      receive: '0.000000000000000001',
    });
  });

  it('Max fills the exact available balance', () => {
    expect(maxAmount('12.345678901234591676', 18)).toBe('12.345678901234591676');
    expect(maxAmount('5.10', 6)).toBe('5.1');
    expect(validateClaimAmount(maxAmount(ETH.available, 18), ETH).ok).toBe(true);
  });
});

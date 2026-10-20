import type { Balance } from '../schemas';
import { assetUsd, totalUsd } from '../totals';

const balance = (overrides: Partial<Balance>): Balance => ({
  asset: 'USDT',
  decimals: 6,
  available: '0',
  pending: '0',
  claiming: '0',
  usdPrice: '1',
  ...overrides,
});

describe('USD totals', () => {
  it('counts available + pending + claiming at the asset price (docs example)', () => {
    // (820.413207 + 50.12 + 0) × 1.0002 = 870.7073136... → truncated to cents
    const usdt = balance({ available: '820.413207', pending: '50.12', usdPrice: '1.0002' });
    expect(assetUsd(usdt)).toBe('870.70');
  });

  it('never rounds up', () => {
    expect(assetUsd(balance({ available: '0.999999', usdPrice: '1' }))).toBe('0.99');
  });

  it('sums exactly across assets before truncating once', () => {
    const items = [
      balance({ available: '0.005' }), // $0.005
      balance({ asset: 'BTC', decimals: 8, available: '0.00000001', usdPrice: '500000' }), // $0.005
    ];
    expect(items.map(assetUsd)).toEqual(['0.00', '0.00']);
    expect(totalUsd(items)).toBe('0.01');
  });

  it('keeps 18-decimal precision that floats would lose', () => {
    const eth = balance({
      asset: 'ETH',
      decimals: 18,
      available: '12.345678901234591676',
      usdPrice: '1000000',
    });
    expect(assetUsd(eth)).toBe('12345678.90');
  });

  it('handles an empty portfolio', () => {
    expect(totalUsd([])).toBe('0.00');
  });
});

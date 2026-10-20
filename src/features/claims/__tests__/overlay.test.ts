import type { Balances } from '@/features/balances/schemas';

import { applyLocalClaims } from '../overlay';
import type { Claim } from '../schemas';

const snapshot = (asOf: string, available = '10', claiming = '0'): Balances => ({
  asOf,
  items: [{ asset: 'ETH', decimals: 18, available, pending: '0', claiming, usdPrice: '2000' }],
});

const claim = (overrides: Partial<Claim>): Claim => ({
  id: 'clm_1',
  asset: 'ETH',
  amount: '2',
  fee: '0.0012',
  receiveAmount: '1.9988',
  destinationId: 'dest_wallet',
  status: 'pending',
  failureReason: null,
  createdAt: '2026-10-20T10:00:10.000Z',
  updatedAt: '2026-10-20T10:00:10.000Z',
  ...overrides,
});

const eth = (result: ReturnType<typeof applyLocalClaims>) => result.items[0];

describe('applyLocalClaims (balance right after a claim)', () => {
  it('moves the amount to claiming when the snapshot predates the claim', () => {
    const r = applyLocalClaims(snapshot('2026-10-20T10:00:00.000Z'), [claim({})]);
    expect(eth(r)).toMatchObject({ available: '8', claiming: '2', adjusted: true });
  });

  it('does nothing once a snapshot includes the claim — no double subtraction, no jump', () => {
    const r = applyLocalClaims(snapshot('2026-10-20T10:00:15.000Z', '8', '2'), [claim({})]);
    expect(eth(r)).toMatchObject({ available: '8', claiming: '2', adjusted: false });
  });

  it('completed after an old snapshot: available drops, claiming unchanged', () => {
    const done = claim({ status: 'completed', updatedAt: '2026-10-20T10:00:30.000Z' });
    const r = applyLocalClaims(snapshot('2026-10-20T10:00:00.000Z'), [done]);
    expect(eth(r)).toMatchObject({ available: '8', claiming: '0' });
  });

  it('failed after the snapshot saw it pending: amount returns to available', () => {
    const failed = claim({ status: 'failed', updatedAt: '2026-10-20T10:00:30.000Z' });
    const r = applyLocalClaims(snapshot('2026-10-20T10:00:15.000Z', '8', '2'), [failed]);
    expect(eth(r)).toMatchObject({ available: '10', claiming: '0', adjusted: true });
  });

  it('failed before the snapshot was taken: nothing to adjust', () => {
    const failed = claim({ status: 'failed', updatedAt: '2026-10-20T10:00:20.000Z' });
    const r = applyLocalClaims(snapshot('2026-10-20T10:00:30.000Z'), [failed]);
    expect(eth(r)?.adjusted).toBe(false);
  });

  it('keeps the asset total unchanged while a claim is in flight', () => {
    const r = applyLocalClaims(snapshot('2026-10-20T10:00:00.000Z'), [claim({ amount: '0.1' })]);
    expect(eth(r)).toMatchObject({ available: '9.9', claiming: '0.1' });
  });

  it('ignores claims for other assets', () => {
    const r = applyLocalClaims(snapshot('2026-10-20T10:00:00.000Z'), [claim({ asset: 'BTC' })]);
    expect(r.adjusted).toBe(false);
  });
});

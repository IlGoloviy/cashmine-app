import { act, renderHook } from '@testing-library/react-native';

import {
  clearLocalClaims,
  dismissClaimNotice,
  markClaimViewed,
  upsertLocalClaim,
  useClaimNotices,
  useLocalClaims,
} from '../local-claims';
import type { Claim } from '../schemas';

const claim = (status: Claim['status'], updatedAt: string, id = 'c1'): Claim => ({
  id,
  asset: 'ETH',
  amount: '0.5',
  fee: '0.0012',
  receiveAmount: '0.4988',
  destinationId: 'd1',
  status,
  failureReason: status === 'failed' ? 'Destination rejected the transfer' : null,
  createdAt: '2026-10-20T13:00:00Z',
  updatedAt,
});

const notices = async () => (await renderHook(() => useClaimNotices())).result.current;

beforeEach(async () => {
  await act(async () => clearLocalClaims());
});

describe('claim settle notices (review: results must not go unseen)', () => {
  it('creates a notice when a pending claim settles while nobody is viewing it', async () => {
    await act(async () => upsertLocalClaim(claim('pending', '2026-10-20T13:00:00Z')));
    await act(async () => upsertLocalClaim(claim('failed', '2026-10-20T13:00:20Z')));
    expect(await notices()).toEqual([expect.objectContaining({ id: 'c1', status: 'failed' })]);
  });

  it('creates no notice when the status screen is open — the user sees the result there', async () => {
    const unview = markClaimViewed('c1');
    await act(async () => upsertLocalClaim(claim('pending', '2026-10-20T13:00:00Z')));
    await act(async () => upsertLocalClaim(claim('completed', '2026-10-20T13:00:20Z')));
    unview();
    expect(await notices()).toEqual([]);
  });

  it('opening the claim or dismissing clears its notice', async () => {
    await act(async () => upsertLocalClaim(claim('pending', '2026-10-20T13:00:00Z', 'a')));
    await act(async () => upsertLocalClaim(claim('completed', '2026-10-20T13:00:20Z', 'a')));
    await act(async () => upsertLocalClaim(claim('pending', '2026-10-20T13:00:00Z', 'b')));
    await act(async () => upsertLocalClaim(claim('failed', '2026-10-20T13:00:20Z', 'b')));
    expect(await notices()).toHaveLength(2);

    await act(async () => markClaimViewed('a')());
    await act(async () => dismissClaimNotice('b'));
    expect(await notices()).toEqual([]);
  });

  it('ignores stale and identical updates (no notice, no re-render loop)', async () => {
    const { result } = await renderHook(() => useLocalClaims());
    await act(async () => upsertLocalClaim(claim('completed', '2026-10-20T13:00:20Z')));
    const before = result.current;
    await act(async () => upsertLocalClaim(claim('pending', '2026-10-20T13:00:00Z')));
    await act(async () => upsertLocalClaim(claim('completed', '2026-10-20T13:00:20Z')));
    expect(result.current).toBe(before);
    expect(await notices()).toEqual([]);
  });
});

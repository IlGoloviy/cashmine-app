import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { activityKeys } from '@/features/activity/queries';
import { balanceKeys } from '@/features/balances/queries';

import { fetchClaim } from './api';
import { upsertLocalClaim, useLocalClaims } from './local-claims';
import { CLAIM_POLL_MS, claimKeys } from './queries';

/**
 * Keeps polling every claim that is still pending, whichever screen is open.
 * The status screen tells the user they can leave — this is what makes that true
 * (review finding: polling used to stop when the screen unmounted).
 *
 * Shares query keys with useClaimQuery, so an open status screen doesn't double the
 * requests. Like every query here, polling pauses while the tab is hidden.
 */
export function PendingClaimsWatcher() {
  const claims = useLocalClaims();
  const pendingIds = useMemo(
    () => claims.filter((c) => c.status === 'pending').map((c) => c.id),
    [claims],
  );
  const queryClient = useQueryClient();

  const results = useQueries({
    queries: pendingIds.map((id) => ({
      queryKey: claimKeys.detail(id),
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchClaim(id, signal),
      refetchInterval: CLAIM_POLL_MS,
    })),
  });

  // Runs after every render on purpose: upsertLocalClaim is a no-op for unchanged
  // data, and a settled claim leaves `pendingIds` right after its upsert, so the
  // invalidation below fires once per settle.
  useEffect(() => {
    let settled = false;
    for (const { data: claim } of results) {
      if (!claim) continue;
      upsertLocalClaim(claim);
      if (claim.status !== 'pending') settled = true;
    }
    if (settled) {
      void queryClient.invalidateQueries({ queryKey: balanceKeys.all });
      void queryClient.invalidateQueries({ queryKey: activityKeys.all });
    }
  });

  return null;
}

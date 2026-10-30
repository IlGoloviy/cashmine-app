import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { activityKeys } from '@/features/activity/queries';
import { balanceKeys } from '@/features/balances/queries';

import { createClaim, fetchClaim, fetchClaimOptions } from './api';
import { getLocalClaim, markClaimViewed, upsertLocalClaim } from './local-claims';
import type { CreateClaimInput } from './schemas';

export const claimKeys = {
  all: ['claims'] as const,
  options: (asset: string) => [...claimKeys.all, 'options', asset] as const,
  detail: (id: string) => [...claimKeys.all, 'detail', id] as const,
};

/** Pending claims settle within ~20 s; poll often enough to feel live. */
export const CLAIM_POLL_MS = 2_000;

export function useClaimOptionsQuery(asset: string | undefined) {
  return useQuery({
    queryKey: claimKeys.options(asset ?? ''),
    queryFn: ({ signal }) => fetchClaimOptions(asset!, signal),
    enabled: !!asset,
    staleTime: 60_000,
  });
}

export function useClaimQuery(id: string) {
  const local = getLocalClaim(id);
  const query = useQuery({
    queryKey: claimKeys.detail(id),
    queryFn: ({ signal }) => fetchClaim(id, signal),
    // Show what we already know instantly, but always fetch fresh status.
    initialData: local,
    initialDataUpdatedAt: 0,
    refetchInterval: (q) => (q.state.data?.status === 'pending' ? CLAIM_POLL_MS : false),
  });
  const queryClient = useQueryClient();
  // The user is looking at this claim: no Home notice needed when it settles.
  useEffect(() => markClaimViewed(id), [id]);
  const status = query.data?.status;
  useEffect(() => {
    if (!query.data) return;
    upsertLocalClaim(query.data);
    // Settled: available/claiming changed on the server — refresh balances now.
    if (query.data.status !== 'pending') {
      void queryClient.invalidateQueries({ queryKey: balanceKeys.all });
      void queryClient.invalidateQueries({ queryKey: activityKeys.all });
    }
  }, [query.data, status, queryClient]);
  return query;
}

export type CreateClaimVariables = { input: CreateClaimInput; idempotencyKey: string };

export function useCreateClaimMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: CreateClaimVariables) =>
      createClaim(input, idempotencyKey),
    // Moves money: never retried automatically. A resend is an explicit user action
    // with the same idempotency key (see claim screen).
    retry: false,
    onSuccess: (claim) => {
      upsertLocalClaim(claim);
      queryClient.setQueryData(claimKeys.detail(claim.id), claim);
      void queryClient.invalidateQueries({ queryKey: balanceKeys.all });
      void queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

import { useQuery } from '@tanstack/react-query';

import { fetchBalances } from './api';

export const balanceKeys = {
  all: ['balances'] as const,
};

/** Server recomputes snapshots every 15 s — poll at the same pace while the screen is open. */
export const BALANCES_REFRESH_MS = 15_000;

export function useBalancesQuery() {
  return useQuery({
    queryKey: balanceKeys.all,
    queryFn: ({ signal }) => fetchBalances(signal),
    refetchInterval: BALANCES_REFRESH_MS,
    staleTime: 5_000,
  });
}

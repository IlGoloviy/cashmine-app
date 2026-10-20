import { useMemo } from 'react';

import { useBalancesQuery } from '@/features/balances/queries';

import { useLocalClaims } from './local-claims';
import { applyLocalClaims } from './overlay';

/** Balances query + this session's claims applied on top (see overlay.ts). */
export function useDisplayBalances() {
  const query = useBalancesQuery();
  const claims = useLocalClaims();
  const display = useMemo(
    () => (query.data ? applyLocalClaims(query.data, claims) : undefined),
    [query.data, claims],
  );
  return { query, display };
}

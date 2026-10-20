import { request } from '@/lib/api';

import { BalancesSchema } from './schemas';

export function fetchBalances(signal?: AbortSignal) {
  return request('/v1/balances', { schema: BalancesSchema, signal });
}

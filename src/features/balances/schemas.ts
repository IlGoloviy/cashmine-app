import { z } from 'zod';

import { DecimalString, IsoDateTime } from '@/lib/schemas';

export const BalanceSchema = z.object({
  asset: z.string(),
  decimals: z.number().int().min(0).max(36),
  available: DecimalString,
  pending: DecimalString,
  claiming: DecimalString,
  usdPrice: DecimalString,
});

export const BalancesSchema = z.object({
  asOf: IsoDateTime,
  items: z.array(BalanceSchema),
});

export type Balance = z.infer<typeof BalanceSchema>;
export type Balances = z.infer<typeof BalancesSchema>;

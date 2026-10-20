import { z } from 'zod';

import { DecimalString, IsoDateTime } from '@/lib/schemas';

export const ClaimStatusSchema = z.enum(['pending', 'completed', 'failed']);

export const ClaimSchema = z.object({
  id: z.string(),
  asset: z.string(),
  amount: DecimalString,
  fee: DecimalString,
  receiveAmount: DecimalString,
  destinationId: z.string(),
  status: ClaimStatusSchema,
  failureReason: z.string().nullable(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
});

export const DestinationSchema = z.object({ id: z.string(), label: z.string() });

export const ClaimOptionsSchema = z.object({
  asset: z.string(),
  minAmount: DecimalString,
  fee: DecimalString,
  destinations: z.array(DestinationSchema),
});

export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;
export type Claim = z.infer<typeof ClaimSchema>;
export type ClaimOptions = z.infer<typeof ClaimOptionsSchema>;

/** POST /v1/claims body. Amount must already be validated (see amount.ts). */
export type CreateClaimInput = { asset: string; amount: string; destinationId: string };

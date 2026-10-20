import { z } from 'zod';

import { DecimalString, IsoDateTime } from '@/lib/schemas';

export const ActivityTypeSchema = z.enum(['accrual', 'reversal', 'claim']);

export const ActivityItemSchema = z.object({
  id: z.string(),
  type: ActivityTypeSchema,
  asset: z.string(),
  /** Signed: negative for reversals and claims. */
  amount: DecimalString,
  status: z.enum(['pending', 'confirmed', 'completed', 'failed']),
  /** Where the payback came from; null for claims. */
  exchange: z.string().nullable(),
  createdAt: IsoDateTime,
  /** reversal → the accrual it takes back; claim → claim id (null for older claims). */
  relatedId: z.string().nullable(),
});

export const ActivityPageSchema = z.object({
  items: z.array(ActivityItemSchema),
  nextCursor: z.string().nullable(),
});

export type ActivityItem = z.infer<typeof ActivityItemSchema>;
export type ActivityPage = z.infer<typeof ActivityPageSchema>;

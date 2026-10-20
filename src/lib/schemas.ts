import { z } from 'zod';

import { isDecimalString } from '@/lib/money';

/** API amounts are decimal strings, never JSON numbers — reject anything else loudly. */
export const DecimalString = z.string().refine(isDecimalString, 'Expected a decimal string');

/** API times are ISO 8601 UTC strings. */
export const IsoDateTime = z.iso.datetime({ offset: true });

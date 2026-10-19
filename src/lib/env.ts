import { z } from 'zod';

/**
 * Env is validated once at startup so a missing/typoed variable fails loudly
 * instead of surfacing later as a confusing network error.
 *
 * EXPO_PUBLIC_* vars must be accessed as literal `process.env.EXPO_PUBLIC_X`
 * (no destructuring / dynamic keys) or Metro will not inline them.
 */
const EnvSchema = z.object({
  apiUrl: z.url(),
  apiToken: z.string().optional(),
});

const parsed = EnvSchema.safeParse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  apiToken: process.env.EXPO_PUBLIC_API_TOKEN || undefined,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment. Copy .env.example to .env.local.\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = {
  ...parsed.data,
  apiUrl: parsed.data.apiUrl.replace(/\/+$/, ''),
};

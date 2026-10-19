import { env } from '@/lib/env';

import { keyValueStore } from './key-value-store';

const TOKEN_KEY = 'cashmine.auth.token';

/**
 * Platform-specific persistence lives in key-value-store(.web).ts — Metro picks
 * the right file per platform. The in-memory cache avoids a storage hit per request.
 */
let cached: string | null | undefined;

export async function getToken(): Promise<string | null> {
  if (cached === undefined) {
    cached = (await keyValueStore.get(TOKEN_KEY)) ?? env.apiToken ?? null;
  }
  return cached;
}

export async function setToken(token: string): Promise<void> {
  await keyValueStore.set(TOKEN_KEY, token);
  cached = token;
}

export async function clearToken(): Promise<void> {
  await keyValueStore.remove(TOKEN_KEY);
  cached = null;
}

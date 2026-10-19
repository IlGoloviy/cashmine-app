import * as SecureStore from 'expo-secure-store';

import { env } from '@/lib/env';

const TOKEN_KEY = 'cashmine.auth.token';

/**
 * Tokens live in the Keychain / Android Keystore via SecureStore — never AsyncStorage,
 * which is plain-text on disk. The in-memory cache avoids a native round-trip per request.
 */
let cached: string | null | undefined;

export async function getToken(): Promise<string | null> {
  if (cached === undefined) {
    cached = (await SecureStore.getItemAsync(TOKEN_KEY)) ?? env.apiToken ?? null;
  }
  return cached;
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  cached = token;
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  cached = null;
}

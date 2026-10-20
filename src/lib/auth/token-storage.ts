import { keyValueStore } from './key-value-store';

const TOKEN_KEY = 'cashmine.auth.token';

/**
 * The token is entered by the user at runtime and never comes from env/bundle.
 * Platform-specific persistence lives in key-value-store(.web).ts — Metro picks
 * the right file per platform. The in-memory cache avoids a storage hit per request,
 * and listeners let the UI (route guard) react to sign-in / 401 / change token.
 */
let cached: string | null | undefined;
let signOutReason: 'rejected' | undefined;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToken(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getToken(): Promise<string | null> {
  if (cached === undefined) {
    cached = await keyValueStore.get(TOKEN_KEY);
  }
  return cached;
}

export async function setToken(token: string): Promise<void> {
  await keyValueStore.set(TOKEN_KEY, token);
  cached = token;
  signOutReason = undefined;
  emit();
}

/** Why the token was last cleared ("rejected" = the API answered 401), for the token screen. */
export function getSignOutReason() {
  return signOutReason;
}

export async function clearToken(reason?: 'rejected'): Promise<void> {
  await keyValueStore.remove(TOKEN_KEY);
  cached = null;
  signOutReason = reason;
  emit();
}

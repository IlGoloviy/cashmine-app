import { focusManager, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { isApiError } from '@/lib/api';
import { clearToken } from '@/lib/auth/token-storage';

const MAX_RETRIES = 2;
const MAX_RATE_LIMIT_RETRIES = 3;

/**
 * Retry only failures that can succeed on a second attempt.
 * `retriesSoFar` is 0 when the first attempt has just failed (TanStack semantics).
 *
 * - network / timeout / 5xx / 408 → transient, retry up to MAX_RETRIES
 * - 429                          → rate-limited, retry a bit more with longer delays
 * - other 4xx (401, 403, 404, 422) → our request is wrong; repeating it can't help
 *   and on 401 would only hammer the API with a dead token
 * - parse                        → server sent an unexpected shape; it will send it again
 * - anything else (not ApiError) → a bug in our code, fail fast so it's visible
 */
export function shouldRetry(retriesSoFar: number, error: unknown): boolean {
  if (!isApiError(error)) return false;
  switch (error.kind) {
    case 'network':
    case 'timeout':
      return retriesSoFar < MAX_RETRIES;
    case 'parse':
      return false;
    case 'http':
      if (error.status === 429) return retriesSoFar < MAX_RATE_LIMIT_RETRIES;
      if (error.status === 408) return retriesSoFar < MAX_RETRIES;
      return !error.isClientError && retriesSoFar < MAX_RETRIES;
  }
}

/** Exponential backoff with jitter (so many clients don't retry in lockstep); slower for 429. */
export function retryDelay(retriesSoFar: number, error: unknown): number {
  // The API tells us exactly how long to wait on 429 — honour it (plus a little jitter).
  if (isApiError(error) && error.retryAfterMs !== undefined) {
    return error.retryAfterMs + Math.random() * 250;
  }
  const base = isApiError(error) && error.status === 429 ? 4_000 : 1_000;
  const delay = Math.min(base * 2 ** retriesSoFar, 30_000);
  return delay / 2 + Math.random() * (delay / 2);
}

/** A 401 means the token is missing/invalid/expired: drop it so the route guard asks again. */
function onGlobalError(error: unknown) {
  if (isApiError(error) && error.isUnauthorized) void clearToken('rejected');
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: onGlobalError }),
    mutationCache: new MutationCache({ onError: onGlobalError }),
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay,
        // Balances are live data: short staleTime, but don't refetch on every mount.
        staleTime: 30_000,
      },
      mutations: {
        // Never auto-retry mutations: a retried transfer can move money twice.
        retry: false,
      },
    },
  });
}

/**
 * RN has no window "focus" event — map AppState to TanStack's focusManager so
 * data refetches when the user returns to the app.
 * https://tanstack.com/query/latest/docs/framework/react/react-native
 */
export function subscribeAppFocus() {
  if (Platform.OS === 'web') return () => {};
  const sub = AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
  });
  return () => sub.remove();
}

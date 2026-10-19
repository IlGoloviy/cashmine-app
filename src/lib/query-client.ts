import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { isApiError } from '@/lib/api';

/**
 * Decide whether a failed query should be retried.
 * Called by TanStack Query with the number of failures so far (1 after the first failure).
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  // TODO(Ілля): define the retry policy — see the note in the chat.
  return failureCount < 2;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
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

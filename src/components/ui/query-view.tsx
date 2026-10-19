import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { EmptyView, ErrorView, LoadingView } from './state-views';

type Props<T> = {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
  isEmpty?: (data: T) => boolean;
  empty?: { title: string; message?: string };
};

/**
 * One place for the loading → error → empty → data state machine, so every
 * screen handles all four states the same way.
 * If cached data exists we keep showing it on background refetch errors
 * (stale-while-revalidate) instead of replacing the screen with an error.
 */
export function QueryView<T>({ query, children, isEmpty, empty }: Props<T>) {
  if (query.isPending) return <LoadingView />;
  if (query.isError && query.data === undefined) {
    return <ErrorView error={query.error} onRetry={() => void query.refetch()} />;
  }
  const data = query.data as T;
  if (isEmpty?.(data)) {
    return <EmptyView title={empty?.title ?? 'Nothing here yet'} message={empty?.message} />;
  }
  return <>{children(data)}</>;
}

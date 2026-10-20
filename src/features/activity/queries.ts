import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchActivity } from './api';
import type { ActivityItem } from './schemas';

export const activityKeys = {
  all: ['activity'] as const,
};

export function useActivityQuery() {
  const query = useInfiniteQuery({
    queryKey: activityKeys.all,
    queryFn: ({ pageParam, signal }) => fetchActivity(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  // Flatten pages; drop duplicates in case new items shifted a page boundary.
  const items = useMemo(() => {
    const seen = new Set<string>();
    const out: ActivityItem[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const item of page.items) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        out.push(item);
      }
    }
    return out;
  }, [query.data]);
  return { query, items };
}

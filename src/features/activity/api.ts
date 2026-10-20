import { request } from '@/lib/api';

import { ActivityPageSchema } from './schemas';

/** API maximum; fewer round trips on a phone connection. */
export const ACTIVITY_PAGE_SIZE = 20;

export function fetchActivity(cursor: string | undefined, signal?: AbortSignal) {
  return request('/v1/activity', {
    schema: ActivityPageSchema,
    query: { limit: ACTIVITY_PAGE_SIZE, cursor },
    signal,
  });
}

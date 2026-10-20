import { useEffect, useState } from 'react';

import { getToken, subscribeToken } from '@/lib/auth/token-storage';

export type TokenStatus = 'loading' | 'missing' | 'present';

/** Reactive "do we have a token?" for the route guard (storage read is async on native). */
export function useTokenStatus(): TokenStatus {
  const [status, setStatus] = useState<TokenStatus>('loading');
  useEffect(() => {
    let alive = true;
    const read = () =>
      void getToken().then((token) => {
        if (alive) setStatus(token ? 'present' : 'missing');
      });
    read();
    const unsubscribe = subscribeToken(read);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);
  return status;
}

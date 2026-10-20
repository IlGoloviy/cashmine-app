import { ThemedText } from '@/components/themed-text';
import { useNow } from '@/hooks/use-now';
import { formatDateTime } from '@/lib/format';

/** Snapshots refresh every 15 s; older than this means refreshes are failing. */
const STALE_AFTER_MS = 60_000;

function describeAge(ms: number): string {
  // Client clocks can be ahead of/behind the server: never show "in 3 s".
  if (ms < 5_000) return 'just now';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return formatDateTime(new Date(Date.now() - ms).toISOString());
}

export function Freshness({ asOf }: { asOf: string }) {
  const now = useNow();
  const age = now - Date.parse(asOf);
  const stale = age > STALE_AFTER_MS;
  return (
    <ThemedText type="small" themeColor={stale ? 'danger' : 'textSecondary'}>
      {stale ? '⚠︎ Out of date — ' : ''}Balances as of {describeAge(age)}
    </ThemedText>
  );
}

import { useSyncExternalStore } from 'react';
import { z } from 'zod';

import { keyValueStore } from '@/lib/auth/key-value-store';
import { DecimalString } from '@/lib/schemas';

/**
 * The claim request currently in flight or with an unknown outcome, persisted
 * (write-ahead, before the POST) so a reload, a closed tab or navigating away
 * can't lose the idempotency key. While it exists, the only way forward is
 * resending the SAME key + body, or an explicit, warned "start over".
 */
const AttemptSchema = z.object({
  input: z.object({ asset: z.string(), amount: DecimalString, destinationId: z.string() }),
  idempotencyKey: z.string().min(1).max(100),
  savedAt: z.string(),
});

export type PendingAttempt = z.infer<typeof AttemptSchema>;

const STORAGE_KEY = 'cashmine.claim.pending-attempt';

// undefined = not loaded from storage yet.
let current: PendingAttempt | null | undefined;
let loading: Promise<void> | undefined;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function load() {
  loading ??= keyValueStore
    .get(STORAGE_KEY)
    .then((raw) => {
      // A newer save during the read wins over what was on disk.
      if (current !== undefined) return;
      let parsed: PendingAttempt | null = null;
      try {
        const result = AttemptSchema.safeParse(raw ? JSON.parse(raw) : null);
        parsed = result.success ? result.data : null;
      } catch {
        parsed = null;
      }
      current = parsed;
      emit();
    })
    .catch(() => {
      current ??= null;
      emit();
    });
}

export async function savePendingAttempt(attempt: PendingAttempt): Promise<void> {
  current = attempt;
  emit();
  await keyValueStore.set(STORAGE_KEY, JSON.stringify(attempt));
}

export async function clearPendingAttempt(): Promise<void> {
  current = null;
  emit();
  await keyValueStore.remove(STORAGE_KEY);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  load();
  return () => listeners.delete(listener);
}

/** `undefined` while reading storage, then the attempt or `null`. */
export function usePendingAttempt(): PendingAttempt | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}

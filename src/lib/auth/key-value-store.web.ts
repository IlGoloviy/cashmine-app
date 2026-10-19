/**
 * Web has no Keychain. sessionStorage is the least-bad option for a token:
 * survives reloads, dies with the tab, never shared across tabs/sessions.
 * (localStorage would persist indefinitely and widen the XSS blast radius.)
 * Falls back to memory when storage is blocked (e.g. some private modes).
 */
const memory = new Map<string, string>();

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export const keyValueStore = {
  async get(key: string): Promise<string | null> {
    return storage()?.getItem(key) ?? memory.get(key) ?? null;
  },
  async set(key: string, value: string): Promise<void> {
    memory.set(key, value);
    try {
      storage()?.setItem(key, value);
    } catch {
      // quota / blocked storage: memory copy is enough for this session
    }
  },
  async remove(key: string): Promise<void> {
    memory.delete(key);
    storage()?.removeItem(key);
  },
};

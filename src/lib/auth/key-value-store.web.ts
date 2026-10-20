/**
 * Web has no Keychain. The brief asks the app to keep the token in the browser
 * and only ask on first open, so we use localStorage (survives closing the tab).
 * Trade-off: it persists until "Change token" / 401 and is readable by any script
 * on this origin (XSS) — acceptable for a test token, see NOTES.md.
 * Falls back to memory when storage is blocked (e.g. some private modes).
 */
const memory = new Map<string, string>();

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
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
    try {
      storage()?.removeItem(key);
    } catch {
      // blocked storage: nothing persisted
    }
  },
};

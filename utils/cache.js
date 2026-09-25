/**
 * In-memory TTL cache with optional max size (FIFO eviction).
 */
export function createCache({
  enabled = true,
  defaultTtlMs = 60_000,
  maxEntries = 300,
} = {}) {
  const entries = new Map();

  function isExpired(entry) {
    return entry.expiresAt <= Date.now();
  }

  function evictExpired() {
    for (const [key, entry] of entries) {
      if (isExpired(entry)) entries.delete(key);
    }
  }

  function evictOverflow() {
    while (entries.size > maxEntries) {
      const oldest = entries.keys().next().value;
      entries.delete(oldest);
    }
  }

  return {
    enabled,

    get(key) {
      if (!enabled) return undefined;
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (isExpired(entry)) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },

    set(key, value, ttlMs = defaultTtlMs) {
      if (!enabled) return;
      evictExpired();
      entries.set(key, { value, expiresAt: Date.now() + ttlMs });
      evictOverflow();
    },

    del(key) {
      entries.delete(key);
    },

    invalidatePrefix(prefix) {
      for (const key of [...entries.keys()]) {
        if (key.startsWith(prefix)) entries.delete(key);
      }
    },

    clear() {
      entries.clear();
    },

    stats() {
      evictExpired();
      return { enabled, size: entries.size, maxEntries };
    },
  };
}

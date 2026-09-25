import { createCache } from "../utils/cache.js";

export const isCacheEnabled = process.env.CACHE_ENABLED !== "false";

const ttlSeconds = parseInt(process.env.CACHE_TTL_SECONDS, 10);
export const cacheTtlMs =
  (Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 60) * 1000;

const maxEntries = parseInt(process.env.CACHE_MAX_ENTRIES, 10);

const cache = createCache({
  enabled: isCacheEnabled,
  defaultTtlMs: cacheTtlMs,
  maxEntries:
    Number.isFinite(maxEntries) && maxEntries > 0 ? maxEntries : 300,
});

export default cache;

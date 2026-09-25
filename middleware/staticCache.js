/**
 * Express static file caching (browser/CDN).
 */
export function getStaticCacheMaxAge() {
  if (process.env.STATIC_CACHE_MAX_AGE !== undefined) {
    return process.env.STATIC_CACHE_MAX_AGE;
  }
  return process.env.NODE_ENV === "production" ? "1d" : 0;
}

export function getStaticCacheOptions() {
  const maxAge = getStaticCacheMaxAge();
  const isProd = process.env.NODE_ENV === "production";
  return {
    maxAge,
    etag: true,
    lastModified: true,
    immutable: isProd && maxAge !== 0 && maxAge !== "0",
  };
}

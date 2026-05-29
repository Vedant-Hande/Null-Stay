import crypto from "crypto";

import cache, { cacheTtlMs } from "../config/cache.js";
import { getPaginationMeta } from "./pagination.js";

export const CACHE_PREFIX = {
  LISTINGS: "listings:",
  HOME: "home:",
  LISTING: "listing:",
};

function stableHash(value) {
  const json = JSON.stringify(value);
  return crypto.createHash("sha256").update(json).digest("hex").slice(0, 16);
}

export function listingsSearchCacheKey(filter, page, perPage) {
  return `${CACHE_PREFIX.LISTINGS}search:${stableHash({ filter, page, perPage })}`;
}

export function listingDetailCacheKey(id) {
  return `${CACHE_PREFIX.LISTING}${id}`;
}

export function featuredListingsCacheKey(limit) {
  return `${CACHE_PREFIX.HOME}featured:${limit}`;
}

/** Clear catalog + home + detail caches after writes. */
export function invalidateListingsCache() {
  cache.invalidatePrefix(CACHE_PREFIX.LISTINGS);
  cache.invalidatePrefix(CACHE_PREFIX.HOME);
  cache.invalidatePrefix(CACHE_PREFIX.LISTING);
}

export function invalidateListingDetail(id) {
  cache.del(listingDetailCacheKey(String(id)));
  cache.invalidatePrefix(CACHE_PREFIX.LISTINGS);
  cache.invalidatePrefix(CACHE_PREFIX.HOME);
}

/**
 * Cached listing search (rows are lean; wishlist is resolved per request).
 */
export async function getCachedListingSearch(
  listingsModel,
  { filter, page, perPage },
) {
  const key = listingsSearchCacheKey(filter, page, perPage);
  const cached = cache.get(key);
  if (cached) {
    return { ...cached, cacheHit: true };
  }

  const total = await listingsModel.countDocuments(filter);
  const pagination = getPaginationMeta(total, page, perPage);
  const rows = await listingsModel
    .find(filter)
    .populate("reviews")
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit)
    .lean();

  const payload = { total, pagination, rows };
  cache.set(key, payload, cacheTtlMs);
  return { ...payload, cacheHit: false };
}

export async function getCachedFeaturedListings(listingsModel, limit = 8) {
  const key = featuredListingsCacheKey(limit);
  const cached = cache.get(key);
  if (cached) {
    return { rows: cached, cacheHit: true };
  }

  const rows = await listingsModel
    .find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("reviews")
    .lean();

  cache.set(key, rows, cacheTtlMs);
  return { rows, cacheHit: false };
}

export async function getCachedListingDetail(listingsModel, id) {
  const key = listingDetailCacheKey(id);
  const cached = cache.get(key);
  if (cached) {
    return { listing: cached, cacheHit: true };
  }

  const listing = await listingsModel
    .findById(id)
    .populate({
      path: "reviews",
      populate: { path: "owner" },
    })
    .populate("owner")
    .lean();

  if (listing) {
    cache.set(key, listing, cacheTtlMs);
  }
  return { listing, cacheHit: false };
}

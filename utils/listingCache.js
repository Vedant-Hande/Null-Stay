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
  return `${CACHE_PREFIX.LISTING}${String(id)}`;
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
    return {
      ...cached,
      rows: cloneSearchRows(cached.rows),
      cacheHit: true,
    };
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
    return { rows: cloneSearchRows(cached), cacheHit: true };
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

/** Shallow-clone listing rows without breaking MongoDB ObjectIds (structuredClone does). */
function cloneSearchRows(rows) {
  return rows.map((row) => ({
    ...row,
    reviews: Array.isArray(row.reviews)
      ? row.reviews.map((review) => ({ ...review }))
      : [],
  }));
}

/** Ensure cached/lean listings always have a reviews array for show + SEO. */
export function normalizeListingDetail(listing) {
  if (!listing) return null;
  const reviews = Array.isArray(listing.reviews)
    ? listing.reviews.map((review) => ({ ...review }))
    : [];
  return { ...listing, reviews };
}

export async function getCachedListingDetail(listingsModel, id) {
  const listingId = String(id);
  const key = listingDetailCacheKey(listingId);
  const cached = cache.get(key);

  if (cached) {
    if (String(cached._id) !== listingId) {
      cache.del(key);
    } else {
      return {
        listing: normalizeListingDetail({ ...cached }),
        cacheHit: true,
      };
    }
  }

  const listing = await listingsModel
    .findById(listingId)
    .populate({
      path: "reviews",
      populate: { path: "owner" },
    })
    .populate("owner")
    .lean();

  if (!listing) {
    return { listing: null, cacheHit: false };
  }

  const normalized = normalizeListingDetail(listing);
  cache.set(key, { ...normalized }, cacheTtlMs);
  return { listing: normalized, cacheHit: false };
}

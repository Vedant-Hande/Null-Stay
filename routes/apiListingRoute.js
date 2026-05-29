import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import listings from "../models/listing.js";
import { LISTINGS_PER_PAGE } from "../utils/constants.js";
import { buildListingFilter } from "../utils/listingSearch.js";
import {
  serializeListingForApi,
  serializeListingForGrid,
} from "../utils/serializeListing.js";
import { parsePage } from "../utils/pagination.js";
import { getCachedListingSearch } from "../utils/listingCache.js";
import { getWishlistedIdsForUser } from "../utils/wishlistIds.js";

const router = express.Router();

router.get(
  "/search",
  wrapAsync(async (req, res) => {
    const perPage = Math.min(
      Math.max(parseInt(req.query.limit, 10) || LISTINGS_PER_PAGE, 1),
      LISTINGS_PER_PAGE,
    );
    const page = parsePage(req.query.page);
    const filter = buildListingFilter(req.query);
    const { total, pagination, rows, cacheHit } = await getCachedListingSearch(
      listings,
      { filter, page, perPage },
    );

    const wishlistedIds =
      req.user && rows.length
        ? await getWishlistedIdsForUser(
            req.user._id,
            rows.map((r) => r._id),
          )
        : [];

    if (process.env.CACHE_DEBUG === "true") {
      res.set("X-Cache", cacheHit ? "HIT" : "MISS");
    }

    const useGrid = req.query.format === "grid";

    res.json({
      listings: useGrid
        ? rows.map(serializeListingForGrid)
        : rows.map(serializeListingForApi),
      wishlistedIds,
      count: rows.length,
      total,
      page: pagination.page,
      totalPages: pagination.totalPages,
      hasMore: pagination.hasNext,
      hasPrev: pagination.hasPrev,
      perPage,
      query: {
        q: req.query.q || "",
        category: req.query.category || "",
        country: req.query.country || "",
        guests: req.query.guests || "",
        minPrice: req.query.minPrice || "",
        maxPrice: req.query.maxPrice || "",
        page: pagination.page,
      },
    });
  }),
);

export default router;

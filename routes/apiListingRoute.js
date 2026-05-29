import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import listings from "../models/listing.js";
import { buildListingFilter } from "../utils/listingSearch.js";
import { serializeListingForApi } from "../utils/serializeListing.js";

const router = express.Router();

router.get(
  "/search",
  wrapAsync(async (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 12);
    const filter = buildListingFilter(req.query);
    const rows = await listings
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("title location country price cleaningFee serviceFee guests image images");

    res.json({
      listings: rows.map(serializeListingForApi),
      count: rows.length,
      query: {
        q: req.query.q || "",
        category: req.query.category || "",
        country: req.query.country || "",
        guests: req.query.guests || "",
      },
    });
  }),
);

export default router;

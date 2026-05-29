import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";
import Wishlist from "../models/wishlist.js";
import listings from "../models/listing.js";
import { FLASH_KEYS } from "../utils/constants.js";

const router = express.Router();

router.get(
  "/",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const items = await Wishlist.find({ user: req.user._id })
      .populate({
        path: "listing",
        populate: { path: "reviews" },
      })
      .sort({ createdAt: -1 });

    const wishlistListings = items.map((w) => w.listing).filter(Boolean);
    res.render("wishlists/index.ejs", { wishlistListings });
  }),
);

router.post(
  "/:listingId/toggle",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const listing = await listings.findById(req.params.listingId);
    if (!listing) {
      req.flash(FLASH_KEYS.ERROR, "Listing not found.");
      return res.redirect("/listings");
    }

    const existing = await Wishlist.findOne({
      user: req.user._id,
      listing: listing._id,
    });

    if (existing) {
      await existing.deleteOne();
      if (req.accepts("json") && req.get("X-Requested-With") === "XMLHttpRequest") {
        return res.json({ saved: false, listingId: String(listing._id) });
      }
      req.flash(FLASH_KEYS.SUCCESS, "Removed from wishlist.");
    } else {
      await Wishlist.create({ user: req.user._id, listing: listing._id });
      if (req.accepts("json") && req.get("X-Requested-With") === "XMLHttpRequest") {
        return res.json({ saved: true, listingId: String(listing._id) });
      }
      req.flash(FLASH_KEYS.SUCCESS, "Saved to wishlist.");
    }

    const back = req.get("Referer") || `/listings/${listing._id}`;
    res.redirect(back);
  }),
);

export default router;

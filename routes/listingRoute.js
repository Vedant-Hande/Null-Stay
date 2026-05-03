import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { validateListing } from "../middleware/validationMiddleware.js";
import listings from "../models/listing.js";
import ExpressError from "../utils/ExpressError.js";
import Review from "../models/review.js";
import { FLASH_KEYS, FLASH_MESSAGES } from "../utils/constants.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  wrapAsync(async (req, res, next) => {
    const allListing = await listings.find({}).populate("reviews");
    res.render("listings/listings", { allListing });
  }),
);

// new listing route
router.get("/new", isLoggedIn, (req, res) => {
  res.render("listings/newListing.ejs");
});

// Create listing route
router.post(
  "/",
  isLoggedIn,
  validateListing,
  wrapAsync(async (req, res, next) => {
    const newListing = new listings(req.body.listing);
    await newListing.save();
    req.flash(FLASH_KEYS.SUCCESS, FLASH_MESSAGES.LISTING.CREATE_SUCCESS);
    res.redirect("/listings");
  }),
);

// edit Listing route
router.get(
  "/:id/edit",
  isLoggedIn,
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const listingToEdit = await listings.findById(id);
    if (!listingToEdit) {
      req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.LISTING.NOT_FOUND);
      return res.redirect("/listings");
    }
    res.render("listings/editListing.ejs", { listingToEdit });
  }),
);

// update listing route
router.put(
  "/:id",
  isLoggedIn,
  validateListing,
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const updatedListing = await listings.findByIdAndUpdate(
      id,
      { ...req.body.listing },
      { new: true, runValidators: true },
    );
    if (!updatedListing) {
      req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.LISTING.NOT_FOUND);
      return res.redirect("/listings");
    }
    req.flash(FLASH_KEYS.SUCCESS, FLASH_MESSAGES.LISTING.UPDATE_SUCCESS);
    res.redirect(`/listings/${id}`);
  }),
);

// delete listing route
router.delete(
  "/:id/delete",
  isLoggedIn,
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const deletedListing = await listings.findByIdAndDelete(id);
    if (!deletedListing) {
      req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.LISTING.NOT_FOUND);
      return res.redirect("/listings");
    }
    req.flash(FLASH_KEYS.SUCCESS, FLASH_MESSAGES.LISTING.DELETE_SUCCESS);
    res.redirect("/listings");
  }),
);

// Show route
router.get(
  "/:id",
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const listing = await listings.findById(id).populate("reviews");
    if (!listing) {
      req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.LISTING.NOT_FOUND);
      return res.redirect("/listings");
    }

    const avgRating =
      listing.reviews.length > 0
        ? (
            listing.reviews.reduce((sum, r) => sum + r.rating, 0) /
            listing.reviews.length
          ).toFixed(2)
        : null;
    res.render("listings/show.ejs", { listing, avgRating }); // Render your view
  }),
);

export default router;

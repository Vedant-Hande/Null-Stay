import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { validateListing, validateReview } from "../middleware/validationMiddleware.js";
import listings from "../models/listing.js";
import Review from "../models/review.js";
import { FLASH_KEYS, FLASH_MESSAGES } from "../utils/constants.js";
import { isLoggedIn, isOwner, isReviewOwner } from "../middleware/authMiddleware.js";

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
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash(FLASH_KEYS.SUCCESS, FLASH_MESSAGES.LISTING.CREATE_SUCCESS);
    res.redirect("/listings");
  }),
);

// edit Listing route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const listingToEdit = await listings.findById(id);
    res.render("listings/editListing.ejs", { listingToEdit });
  }),
);

// update listing route
router.put(
  "/:id",
  isLoggedIn,
  isOwner,
  validateListing,
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    await listings.findByIdAndUpdate(
      id,
      { ...req.body.listing },
      { new: true, runValidators: true },
    );
    req.flash(FLASH_KEYS.SUCCESS, FLASH_MESSAGES.LISTING.UPDATE_SUCCESS);
    res.redirect(`/listings/${id}`);
  }),
);

// delete listing route
router.delete(
  "/:id/delete",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    await listings.findByIdAndDelete(id);
    req.flash(FLASH_KEYS.SUCCESS, FLASH_MESSAGES.LISTING.DELETE_SUCCESS);
    res.redirect("/listings");
  }),
);

// Show route
router.get(
  "/:id",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const listing = await listings
      .findById(id)
      .populate({
        path: "reviews",
        populate: {
          path: "owner",
        },
      })
      .populate("owner");
    console.log(
      "POPULATED LISTING REVIEWS:",
      JSON.stringify(listing.reviews, null, 2),
    );
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

// Review create route
router.post(
  "/:id/reviews",
  isLoggedIn,
  validateReview,
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const listing = await listings.findById(id);
    if (!listing) {
      req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.LISTING.NOT_FOUND);
      return res.redirect("/listings");
    }
    const reviewData = req.body.reviews;
    if (!reviewData || !reviewData.comment || !reviewData.rating) {
      req.flash(FLASH_KEYS.ERROR, "Review must include a rating and comment");
      return res.redirect(`/listings/${id}`);
    }

    const newReview = new Review(reviewData);
    newReview.owner = req.user._id;
    await newReview.save();
    listing.reviews.push(newReview._id);
    await listing.save();

    req.flash(FLASH_KEYS.SUCCESS, FLASH_MESSAGES.REVIEW.CREATE_SUCCESS);
    res.redirect(`/listings/${id}`);
  }),
);

// Review delete route
router.delete(
  "/:id/reviews/:reviewId",
  isLoggedIn,
  isReviewOwner,
  wrapAsync(async (req, res, next) => {
    const { id, reviewId } = req.params;
    const listing = await listings.findById(id);
    if (!listing) {
      req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.LISTING.NOT_FOUND);
      return res.redirect("/listings");
    }

    listing.reviews = listing.reviews.filter((r) => r.toString() !== reviewId);
    await listing.save();
    await Review.findByIdAndDelete(reviewId);

    req.flash(FLASH_KEYS.SUCCESS, FLASH_MESSAGES.REVIEW.DELETE_SUCCESS);
    res.redirect(`/listings/${id}`);
  }),
);

export default router;

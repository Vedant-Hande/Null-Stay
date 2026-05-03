import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { validateReview } from "../middleware/validationMiddleware.js";
import listings from "../models/listing.js";
import Review from "../models/review.js";
import { FLASH_KEYS, FLASH_MESSAGES } from "../utils/constants.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create review route
router.post(
  "/listings/:id/reviews",
  isLoggedIn,
  validateReview,
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    let listing = await listings.findById(id);
    if (!listing) {
      req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.LISTING.NOT_FOUND);
      return res.redirect("/listings");
    }
    const reviewData = req.body.reviews;
    if (!reviewData || !reviewData.comment || !reviewData.rating) {
      req.flash(FLASH_KEYS.ERROR, "Review must include a rating and comment");
      return res.redirect(`/listings/${id}`);
    }

    const newReview = new Review(reviewData); // Create a new review document
    newReview.owner = req.user._id;
    await newReview.save(); // Save the review to the database
    listing.reviews.push(newReview._id); // Add the review reference to the listing
    await listing.save();

    req.flash(FLASH_KEYS.SUCCESS, FLASH_MESSAGES.REVIEW.CREATE_SUCCESS);
    res.redirect(`/listings/${id}`);
  }),
);

// Delete review route
router.delete(
  "/listings/:id/reviews/:reviewId",
  wrapAsync(async (req, res, next) => {
    let { id, reviewId } = req.params;
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
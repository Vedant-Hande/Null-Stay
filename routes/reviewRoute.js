import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { validateReview } from "../middleware/validationMiddleware.js";
import listings from "../models/listing.js";
import ExpressError from "../utils/ExpressError.js";

const router = express.Router();
    
// Create review route
router.post(
  "/listings/:id/reviews",
  validateReview,
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    let listing = await listings.findById(id);
    if (!listing) {
      throw new ExpressError(404, "Listing not found");
    }
    const reviewData = req.body.reviews;
    if (!reviewData || !reviewData.comment || !reviewData.rating) {
      throw new ExpressError(400, "Review must include a rating and comment");
    }

    const newReview = new Review(reviewData); // Create a new review document
    await newReview.save(); // Save the review to the database
    listing.reviews.push(newReview._id); // Add the review reference to the listing
    await listing.save();

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
      throw new ExpressError(404, "Listing not found");
    }

    listing.reviews = listing.reviews.filter((r) => r.toString() !== reviewId);
    await listing.save();
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
  }),
);

export default router;
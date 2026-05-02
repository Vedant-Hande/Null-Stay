import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { validateListing } from "../middleware/validationMiddleware.js";
import listings from "../models/listing.js";
import ExpressError from "../utils/ExpressError.js";

const router = express.Router();

router.get(
  "/",
  wrapAsync(async (req, res, next) => {
    const allListing = await listings.find({});
    res.render("listings/listings", { allListing });
  }),
);

// new listing route
router.get("/new", (req, res) => {
  res.render("listings/newListing.ejs");
});

// Create listing route
router.post(
  "/",
  validateListing,
  wrapAsync(async (req, res, next) => {
    const newListing = new listings(req.body.listing);
    await newListing.save();
    console.log("New listing created:", newListing);
    res.redirect("/listings");
  }),
);

// edit Listing route
router.get(
  "/:id/edit",
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const listingToEdit = await listings.findById(id);
    if (!listingToEdit) {
      throw new ExpressError(404, "Listing not found");
    }
    res.render("listings/editListing.ejs", { listingToEdit });
  }),
);

// update listing route
router.put(
  "/:id",
  validateListing,
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const updatedListing = await listings.findByIdAndUpdate(
      id,
      { ...req.body.listing },
      { new: true, runValidators: true },
    );
    console.log(updatedListing);
    if (!updatedListing) {
      throw new ExpressError(404, "Listing not found");
    }
    res.redirect(`/listings/${id}`);
  }),
);

// delete listing route
router.delete(
  "/:id/delete",
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const deletedListing = await listings.findByIdAndDelete(id);
    if (!deletedListing) {
      throw new ExpressError(404, "Listing not found");
    }
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
      throw new ExpressError(404, "Listing not found");
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

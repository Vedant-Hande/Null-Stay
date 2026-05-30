import { FLASH_KEYS, FLASH_MESSAGES } from "../utils/constants.js";
import listings from "../models/listing.js";
import Review from "../models/review.js";
import {
  findUserReviewOnListing,
  userHasReviewOnListing,
  userIsListingOwner,
} from "../utils/reviewEligibility.js";

export const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    console.log(req.originalUrl);
    req.flash(FLASH_KEYS.ERROR, "You must be logged in!");
    return res.redirect("/login");
  }
  next();
};

export const saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

export const isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await listings.findById(id);
  if (!listing) {
    req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.LISTING.NOT_FOUND);
    return res.redirect("/listings");
  }

  if (!listing.owner || (!listing.owner.equals(req.user._id) && listing.owner.toString() !== req.user._id.toString())) {
    req.flash(FLASH_KEYS.ERROR, "You do not have permission to do that");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

export const isReviewOwner = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review) {
    req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.REVIEW.NOT_FOUND);
    return res.redirect(`/listings/${id}`);
  }

  if (
    !review.owner ||
    (!review.owner.equals(req.user._id) &&
      review.owner.toString() !== req.user._id.toString())
  ) {
    req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.REVIEW.UNAUTHORIZED);
    return res.redirect(`/listings/${id}`);
  }
  next();
};

/** Logged-in guest may post one review; hosts cannot review their own listing. */
export const canLeaveReview = async (req, res, next) => {
  const { id } = req.params;
  const listing = await listings.findById(id);
  if (!listing) {
    req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.LISTING.NOT_FOUND);
    return res.redirect("/listings");
  }

  if (userIsListingOwner(listing, req.user)) {
    req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.REVIEW.HOST_CANNOT_REVIEW);
    return res.redirect(`/listings/${id}`);
  }

  const existing = await findUserReviewOnListing(
    id,
    listing.reviews,
    req.user._id,
  );
  if (existing || userHasReviewOnListing(listing, req.user._id)) {
    req.flash(FLASH_KEYS.ERROR, FLASH_MESSAGES.REVIEW.ALREADY_REVIEWED);
    return res.redirect(`/listings/${id}`);
  }

  next();
};

export function isReviewAuthor(review, user) {
  if (!review?.owner || !user) return false;
  const ownerId = review.owner._id ?? review.owner;
  return (
    ownerId.equals(user._id) || ownerId.toString() === user._id.toString()
  );
}

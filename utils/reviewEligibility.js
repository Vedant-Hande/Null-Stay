import Review from "../models/review.js";

function sameUserId(a, b) {
  if (!a || !b) return false;
  const idA = a._id ?? a;
  const idB = b._id ?? b;
  return idA.equals(idB) || idA.toString() === idB.toString();
}

/** True if this user already has a review on the listing. */
export function userHasReviewOnListing(listing, userId) {
  if (!userId || !listing?.reviews?.length) return false;
  return listing.reviews.some((review) => {
    if (!review?.owner) return false;
    return sameUserId(review.owner, userId);
  });
}

/** True if the user is the listing host. */
export function userIsListingOwner(listing, user) {
  if (!user || !listing?.owner) return false;
  return sameUserId(listing.owner, user._id);
}

export async function findUserReviewOnListing(listingId, reviewIds, userId) {
  if (!userId || !reviewIds?.length) return null;
  return Review.findOne({
    _id: { $in: reviewIds },
    owner: userId,
  });
}

/**
 * Whether the listing show page should display the leave-review form.
 */
export function getReviewFormState(listing, user) {
  if (!user) {
    return { canLeaveReview: false, reason: "login" };
  }
  if (userIsListingOwner(listing, user)) {
    return { canLeaveReview: false, reason: "owner" };
  }
  if (userHasReviewOnListing(listing, user._id)) {
    return { canLeaveReview: false, reason: "already_reviewed" };
  }
  return { canLeaveReview: true, reason: null };
}

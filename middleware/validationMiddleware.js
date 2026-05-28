import { listingBodySchema } from "../schemas/listing.js";
import ExpressError from "../utils/ExpressError.js";
import { reviewSchema } from "../schemas/review.js";

export const validateListing = (req, res, next) => {
  const { error, value } = listingBodySchema.validate(req.body.listing, {
    stripUnknown: true,
    convert: true,
    abortEarly: false,
  });

  if (error) {
    const msg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, msg);
  }

  req.body.listing = value;
  next();
};

export const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, msg);
  } else {
    next();
  }
};

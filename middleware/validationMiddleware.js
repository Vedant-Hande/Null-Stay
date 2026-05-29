import { listingBodySchema } from "../schemas/listing.js";
import ExpressError from "../utils/ExpressError.js";
import { reviewSchema } from "../schemas/review.js";
import {
  bookingCreateDemoSchema,
  bookingCreateStripeSchema,
  bookingPaymentIntentSchema,
} from "../schemas/booking.js";
import { isStripeConfigured } from "../config/stripe.js";

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

export const validateBooking = (req, res, next) => {
  const schema = isStripeConfigured()
    ? bookingCreateStripeSchema
    : bookingCreateDemoSchema;
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
  });
  if (error) {
    const msg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, msg);
  }
  req.body = { ...req.body, ...value };
  next();
};

export const validateBookingPaymentIntent = (req, res, next) => {
  const { error, value } = bookingPaymentIntentSchema.validate(req.body, {
    abortEarly: false,
    convert: true,
  });
  if (error) {
    const msg = error.details.map((el) => el.message).join(", ");
    return res.status(400).json({ error: msg });
  }
  req.body = { ...req.body, ...value };
  next();
};

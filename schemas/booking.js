import Joi from "joi";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const bookingBaseFields = {
  listingId: Joi.string().required().messages({
    "any.required": "Listing is required",
  }),
  checkIn: Joi.string().pattern(datePattern).required().messages({
    "any.required": "Check-in date is required",
    "string.pattern.base": "Check-in must be YYYY-MM-DD",
  }),
  checkOut: Joi.string().pattern(datePattern).required().messages({
    "any.required": "Check-out date is required",
    "string.pattern.base": "Check-out must be YYYY-MM-DD",
  }),
  guests: Joi.number().integer().min(1).required().messages({
    "any.required": "Number of guests is required",
    "number.min": "At least 1 guest is required",
  }),
  agreeTerms: Joi.boolean().valid(true).required().messages({
    "any.only": "You must agree to the cancellation policy",
  }),
};

export const bookingCreateRazorpaySchema = Joi.object({
  ...bookingBaseFields,
  razorpayOrderId: Joi.string().trim().required().messages({
    "any.required": "Payment order is required",
  }),
  razorpayPaymentId: Joi.string().trim().required().messages({
    "any.required": "Payment is required",
  }),
  razorpaySignature: Joi.string().trim().required().messages({
    "any.required": "Payment signature is required",
  }),
});

export const bookingCreateDemoSchema = Joi.object({
  ...bookingBaseFields,
  cardName: Joi.string().trim().min(2).max(80).required().messages({
    "any.required": "Name on card is required",
  }),
  cardNumber: Joi.string().required().custom((value, helpers) => {
    const digits = value.replace(/\s/g, "");
    if (!/^\d{16}$/.test(digits)) {
      return helpers.error("any.invalid");
    }
    return digits;
  }).messages({
    "any.required": "Card number is required",
    "any.invalid": "Enter a valid 16-digit card number",
  }),
  cardExpiry: Joi.string()
    .pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)
    .required()
    .messages({
      "any.required": "Expiry date is required",
      "string.pattern.base": "Use MM/YY format",
    }),
  cardCvc: Joi.string().pattern(/^\d{3,4}$/).required().messages({
    "any.required": "CVC is required",
    "string.pattern.base": "Enter a valid CVC",
  }),
});

export const bookingRazorpayOrderSchema = Joi.object({
  listingId: bookingBaseFields.listingId,
  checkIn: bookingBaseFields.checkIn,
  checkOut: bookingBaseFields.checkOut,
  guests: bookingBaseFields.guests,
});

/** @deprecated use bookingCreateRazorpaySchema or bookingCreateDemoSchema */
export const bookingCreateSchema = bookingCreateDemoSchema;

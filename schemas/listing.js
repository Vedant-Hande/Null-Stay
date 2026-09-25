import Joi from "joi";

const listingFields = {
  title: Joi.string().required().max(50).messages({
    "any.required": "Please enter a title",
    "string.empty": "Title cannot be empty",
    "string.max": "Title should be less than 50 characters",
  }),
  desc: Joi.string().required().max(500).messages({
    "any.required": "Please enter a description",
    "string.empty": "Description cannot be empty",
  }),
  location: Joi.string().required().max(100).messages({
    "any.required": "Please enter a location",
  }),
  country: Joi.string().required().max(50).messages({
    "any.required": "Please enter a country",
  }),
  price: Joi.number().required().min(100).messages({
    "any.required": "Please enter price",
    "number.min": "Price should be at least ₹100",
    "number.base": "Price must be a number",
  }),
  cleaningFee: Joi.number().min(0).allow("", null).empty("").optional(),
  serviceFee: Joi.number().min(0).allow("", null).empty("").optional(),
  instantBook: Joi.any()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.includes("true") || value.includes(true);
      }
      return value === true || value === "true" || value === "on" || value === 1;
    })
    .default(true),
  guests: Joi.number().required().min(1).messages({
    "any.required": "Please specify number of guests",
  }),
  bedrooms: Joi.number().required().min(1),
  beds: Joi.number().required().min(1),
  baths: Joi.number().required().min(1),
  amenities: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .default([])
    .custom((value) => {
      if (Array.isArray(value)) return value;
      if (value === undefined || value === null || value === "") return [];
      return [value];
    }),
};

/** Validates req.body.listing (multipart-safe; image file handled separately) */
export const listingBodySchema = Joi.object(listingFields);

/** Legacy wrapper for JSON-style { listing: { ... } } payloads */
export const listingSchema = Joi.object({
  listing: listingBodySchema.required(),
});

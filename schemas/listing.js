import Joi from "joi";

export const listingSchema = Joi.object({
  listing: Joi.object({
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
    image: Joi.object({
      url: Joi.string().allow("", null),
      filename: Joi.string().allow("", null),
    }).optional(),
    guests: Joi.number().required().min(1).messages({
      "any.required": "Please specify number of guests",
    }),
    bedrooms: Joi.number().required().min(1),
    beds: Joi.number().required().min(1),
    baths: Joi.number().required().min(1),
    amenities: Joi.array().items(Joi.string()).default([]),
  }).required(),
});

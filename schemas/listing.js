import Joi from "joi";

export const listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required().max(50),
    desc: Joi.string().required().max(500),
    location: Joi.string().required().max(100),
    country: Joi.string().required().max(50),
    price: Joi.number().required().min(0),
    image: Joi.object({
      url: Joi.string().allow("", null),
      filename: Joi.string().allow("", null),
    }).optional(),
    guests: Joi.number().required().min(1),
    bedrooms: Joi.number().required().min(1),
    beds: Joi.number().required().min(1),
    baths: Joi.number().required().min(1),
    amenities: Joi.array().items(Joi.string()).default([]),
  }).required(),
});

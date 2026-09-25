import Joi from "joi";

export const reviewSchema = Joi.object({
  reviews: Joi.object({
    rating: Joi.number().required().min(1).max(5).messages({
      "any.required": "Please provide a rating",
      "number.base": "Rating must be a number",
      "number.min": "Rating must be at least 1",
      "number.max": "Rating cannot be more than 5",
    }),
    comment: Joi.string().required().max(1000).messages({
      "any.required": "Please provide a comment",
      "string.empty": "Comment cannot be empty",
      "string.max": "Comment should be less than 1000 characters",
    }),
  }).required(),
});

import Joi from "joi";

export const SUPPORT_TOPICS = [
  "general",
  "booking",
  "payment",
  "hosting",
  "account",
  "other",
];

export const supportContactSchema = Joi.object({
  name: Joi.string().trim().required().max(80).messages({
    "any.required": "Please enter your name",
    "string.empty": "Please enter your name",
    "string.max": "Name cannot be longer than 80 characters",
  }),
  email: Joi.string().trim().email().required().messages({
    "any.required": "Please enter your email",
    "string.email": "Please enter a valid email address",
  }),
  topic: Joi.string()
    .valid(...SUPPORT_TOPICS)
    .required()
    .messages({
      "any.required": "Please choose a topic",
      "any.only": "Please choose a valid topic",
    }),
  bookingRef: Joi.string().trim().max(100).allow("").default(""),
  subject: Joi.string().trim().max(120).allow("").default(""),
  message: Joi.string().trim().required().min(10).max(2000).messages({
    "any.required": "Please describe your issue",
    "string.empty": "Please describe your issue",
    "string.min": "Message must be at least 10 characters",
    "string.max": "Message cannot be longer than 2000 characters",
  }),
});

import mongoose from "mongoose";
import { DEFAULTS, ERROR_MESSAGES } from "../utils/constants.js";
const schema = mongoose.Schema;

const listingSchema = new schema({
  title: {
    type: String,
    required: [true, ERROR_MESSAGES.VALIDATION.TITLE_REQUIRED],
    maxLength: [50, ERROR_MESSAGES.VALIDATION.TITLE_MAX_LENGTH],
    index: true, // Index for search functionality
  },
  desc: {
    type: String,
    required: [true, ERROR_MESSAGES.VALIDATION.DESC_REQUIRED],
    maxLength: [500, ERROR_MESSAGES.VALIDATION.DESC_MAX_LENGTH],
  },
  image: {
    filename: String,
    url: {
      type: String,
      default: DEFAULTS.IMAGE_URL,
      set: (v) => v === "" ? DEFAULTS.IMAGE_URL : v,
    },
  },
  images: [
    {
      url: { type: String, required: true },
      filename: { type: String, required: true },
    },
  ],
  price: {
    type: Number,
    required: [true, ERROR_MESSAGES.VALIDATION.PRICE_REQUIRED],
    min: [100, ERROR_MESSAGES.VALIDATION.PRICE_MIN],
    index: true, // Index for price filtering
  },
  cleaningFee: {
    type: Number,
    default: null,
    min: 0,
  },
  serviceFee: {
    type: Number,
    default: null,
    min: 0,
  },
  instantBook: {
    type: Boolean,
    default: true,
  },
  location: {
    type: String,
    required: [true, ERROR_MESSAGES.VALIDATION.LOCATION_REQUIRED],
    maxLength: [100, ERROR_MESSAGES.VALIDATION.LOCATION_MAX_LENGTH],
    index: true, // Index for location search
  },
  country: {
    type: String,
    required: [true, ERROR_MESSAGES.VALIDATION.COUNTRY_REQUIRED],
    maxLength: [50, ERROR_MESSAGES.VALIDATION.COUNTRY_MAX_LENGTH],
    index: true, // Index for country filtering
  },
  guests: {
    type: Number,
    required: true,
    default: 1,
  },
  bedrooms: {
    type: Number,
    required: true,
    default: 1,
  },
  beds: {
    type: Number,
    required: true,
    default: 1,
  },
  baths: {
    type: Number,
    required: true,
    default: 1,
  },
  amenities: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // Index for sorting by creation date
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Listing = mongoose.model("Listing", listingSchema);
export default Listing;

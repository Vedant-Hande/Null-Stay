import mongoose from "mongoose";
const schema = mongoose.Schema;
// import Review from "../models/review.js";

const listingSchema = new schema({
  title: {
    type: String,
    required: true,
    maxLength: 50,
    index: true, // Index for search functionality
  },
  desc: {
    type: String,
    required: true,
    maxLength: 500,
  },
  image: {
    type: String,
    required: true,
    set(v) {
      v == "" ? (v = "image") : v;
    },
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    index: true, // Index for price filtering
  },
  location: {
    type: String,
    required: true,
    maxLength: 100,
    index: true, // Index for location search
  },
  country: {
    type: String,
    required: true,
    maxLength: 50,
    index: true, // Index for country filtering
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
});

const Listing = mongoose.model("Listing", listingSchema);
export default Listing;

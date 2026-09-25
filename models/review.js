import mongoose from "mongoose";
const schema = mongoose.Schema;

const reviewSchema = new schema({
  comment: String,
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: { type: Date, default: Date.now },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Review = mongoose.model("Review", reviewSchema);
export default Review;

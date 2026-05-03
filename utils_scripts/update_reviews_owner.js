import Review from "../models/review.js";
import connectDB from "../config/database.js";

async function updateReviewsOwner() {
  await connectDB();
  const res = await Review.updateMany({}, { owner: "69f7203cc1d74f9aa260b16a" });
  console.log(`Successfully updated ${res.modifiedCount} reviews to owner 69f7203cc1d74f9aa260b16a`);
  process.exit();
}

updateReviewsOwner();

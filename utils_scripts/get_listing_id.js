import Listing from "../models/listing.js";
import connectDB from "../config/database.js";

async function getListingWithReviews() {
  await connectDB();
  const allListings = await Listing.find({}).populate("reviews");
  const withReviews = allListings.filter(l => l.reviews && l.reviews.length > 0);
  console.log("Listing with reviews count:", withReviews.length);
  if (withReviews.length > 0) {
    console.log("ID of listing with reviews:", withReviews[0]._id);
    console.log("Reviews:", JSON.stringify(withReviews[0].reviews));
  } else {
    console.log("All Listings IDs:", allListings.map(l => l._id));
  }
  process.exit();
}

getListingWithReviews();

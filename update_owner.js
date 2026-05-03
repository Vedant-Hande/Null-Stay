import Listing from "./models/listing.js";
import connectDB from "./config/database.js";

async function updateAllOwners() {
  await connectDB();
  const res = await Listing.updateMany({}, { owner: "69f7203cc1d74f9aa260b16a" });
  console.log(`Successfully updated ${res.modifiedCount} listings to owner 69f7203cc1d74f9aa260b16a`);
  process.exit();
}

updateAllOwners();

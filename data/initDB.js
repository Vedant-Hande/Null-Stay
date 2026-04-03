import Listing from "../models/listing.js"; // Standard convention is to capitalize model imports
import sampleData from "./sampleData.js";
import connectDB from "../config/database.js";

async function initDB() {
  // 1. Connect to the database
  await connectDB();

  // 2. Clear all existing data from the listings collection
  await Listing.deleteMany({});
  console.log("Existing DB data cleared.");

  // 3. Insert the new sample data
  await Listing.insertMany(sampleData);
  console.log("Sample data initialized in DB successfully!!");

  // 4. (Optional but recommended) Exit the process once done
  process.exit();
}

initDB();

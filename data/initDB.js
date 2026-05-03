import Listing from "../models/listing.js"; // Standard convention is to capitalize model imports
import sampleData from "./sampleData.js";
import connectDB from "../config/database.js";

async function initDB() {
  // 1. Connect to the database
  await connectDB();

  // 2. Clear all existing data from the listings collection
  await Listing.deleteMany({});
  console.log("Existing DB data cleared.");

  // 3. Add owner ID to each sample data listing
  const updatedSampleData = sampleData.map((obj) => ({
    ...obj,
    owner: "69f7203cc1d74f9aa260b16a",
  }));

  // 4. Insert the new sample data
  await Listing.insertMany(updatedSampleData);
  console.log("Sample data initialized in DB successfully!!");

  // 4. (Optional but recommended) Exit the process once done
  process.exit();
}

initDB();

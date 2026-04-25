import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/database.js";
import listings from "./models/listing.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in root directory
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(__dirname, ".env") });
}

const app = express();

// Initialize Express app
const port = process.env.CONN_PORT;

app.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});

// connect to DB
connectDB();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// API Routes
app.get("/", (req, res) => {
  res.send("Hello");
});

app.get("/listings", async (req, res) => {
  const allListing = await listings.find({});
  res.render("listings/listings", { allListing });
});

// new listing route
app.get("/listings/new", (req, res) => {
  res.render("listings/newListing.ejs");
});

// Create listing route
app.post("/listings", async (req, res) => {
  try {
    let newLisitng = await new listings(req.body.listing);
    console.log("New listing created:", newLisitng);
    newLisitng.save();
    // res.redirect("/listings");
  } catch (err) {
    res.status(500).send("server error");
  }
});

// Show route
app.get("/listings/:id", async (req, res) => {
  try {
    let { id } = req.params;
    const listing = await listings.findById(id);

    if (!listing) {
      return res.status(404).send("Listing not found");
    }
    res.render("listings/show.ejs", { listing }); // Render your view
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

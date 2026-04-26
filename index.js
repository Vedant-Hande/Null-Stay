import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/database.js";
import listings from "./models/listing.js";
import methodOverride from "method-override"; // Standard ES6 import
import ejsMate from "ejs-mate";
import wrapAsync from "./utils/wrapAsync.js";
import ExpressError from "./utils/ExpressError.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { validateListing } from "./middleware/validationMiddleware.js";

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

app.engine("ejs", ejsMate);

// Middleware
app.use(express.urlencoded({ extended: true })); // parsing html form data
app.use(express.json()); // parsing json data
app.use(express.static(path.join(__dirname, "public"))); // serving static files

app.use(methodOverride("_method")); // using method override to update and delete

// API Routes
app.get("/", (req, res) => {
  res.render("home.ejs");
});

// Informational Routes
app.get("/help", (req, res) => {
  res.render("info/help.ejs");
});

app.get("/terms", (req, res) => {
  res.render("info/static.ejs", { title: "Terms of Service" });
});

app.get("/privacy", (req, res) => {
  res.render("info/static.ejs", { title: "Privacy Policy" });
});

app.get("/sitemap", (req, res) => {
  res.render("info/static.ejs", { title: "Sitemap" });
});

app.get("/privacy-choices", (req, res) => {
  res.render("info/static.ejs", { title: "Your Privacy Choices" });
});

app.get("/careers", (req, res) => {
  res.render("info/static.ejs", { title: "Careers" });
});

app.get("/hosting", (req, res) => {
  res.render("info/hosting.ejs");
});

app.get(
  "/listings",
  wrapAsync(async (req, res, next) => {
    const allListing = await listings.find({});
    res.render("listings/listings", { allListing });
  }),
);

// new listing route
app.get("/listings/new", (req, res) => {
  res.render("listings/newListing.ejs");
});

// Create listing route
app.post(
  "/listings",
  validateListing,
  wrapAsync(async (req, res, next) => {
    const newListing = new listings(req.body.listing);
    await newListing.save();
    console.log("New listing created:", newListing);
    res.redirect("/listings");
  }),
);

// edit Listing route
app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const listingToEdit = await listings.findById(id);
    if (!listingToEdit) {
      throw new ExpressError(404, "Listing not found");
    }
    res.render("listings/editListing.ejs", { listingToEdit });
  }),
);

// update listing route
app.put(
  "/listings/:id",
  validateListing,
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const updatedListing = await listings.findByIdAndUpdate(
      id,
      { ...req.body.listing },
      { new: true, runValidators: true },
    );
    console.log(updatedListing);
    if (!updatedListing) {
      throw new ExpressError(404, "Listing not found");
    }
    res.redirect(`/listings/${id}`);
  }),
);

// delete listing route
app.delete(
  "/listings/:id/delete",
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const deletedListing = await listings.findByIdAndDelete(id);
    if (!deletedListing) {
      throw new ExpressError(404, "Listing not found");
    }
    res.redirect("/listings");
  }),
);

// Show route
app.get(
  "/listings/:id",
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const listing = await listings.findById(id);
    if (!listing) {
      throw new ExpressError(404, "Listing not found");
    }
    res.render("listings/show.ejs", { listing }); // Render your view
  }),
);

// 404 Catch-All Route (Must be after all other routes)
app.use(notFound);

// Error Handling Middleware (Must be the very last middleware)
app.use(errorHandler);

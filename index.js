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
import { validateReview } from "./middleware/validationMiddleware.js";
import Review from "./models/review.js";
import listingRoute from "./routes/listingRoute.js";

// es6 imports
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

app.use("/listings", listingRoute);

// Create review route
app.post(
  "/listings/:id/reviews",
  validateReview,
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    let listing = await listings.findById(id);
    if (!listing) {
      throw new ExpressError(404, "Listing not found");
    }
    const reviewData = req.body.reviews;
    if (!reviewData || !reviewData.comment || !reviewData.rating) {
      throw new ExpressError(400, "Review must include a rating and comment");
    }

    const newReview = new Review(reviewData); // Create a new review document
    await newReview.save(); // Save the review to the database
    listing.reviews.push(newReview._id); // Add the review reference to the listing
    await listing.save();

    res.redirect(`/listings/${id}`);
  }),
);

// Delete review route
app.delete(
  "/listings/:id/reviews/:reviewId",
  wrapAsync(async (req, res, next) => {
    let { id, reviewId } = req.params;
    const listing = await listings.findById(id);
    if (!listing) {
      throw new ExpressError(404, "Listing not found");
    }

    listing.reviews = listing.reviews.filter((r) => r.toString() !== reviewId);
    await listing.save();
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
  }),
);

// Silently handle browser's automatic favicon requests to prevent false 404 errors
app.get("/favicon.ico", (req, res) => res.status(204).end());

// 404 Catch-All Route (Must be after all other routes)
app.use(notFound);

// Error Handling Middleware (Must be the very last middleware)
app.use(errorHandler);

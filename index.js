import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/database.js";
import methodOverride from "method-override";
import ejsMate from "ejs-mate";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import listingRoute from "./routes/listingRoute.js";
import reviewRoute from "./routes/reviewRoute.js";
import infoRoute from "./routes/infoRoute.js";

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

// Root Route
app.get("/", (req, res) => {
  res.render("home.ejs");
});

// Journey / Travel Lineage Demo Route
app.get("/journey", (req, res) => {
  res.render("users/journey.ejs");
});

// Routes
app.use("/listings", listingRoute);
app.use("/", reviewRoute);
app.use("/", infoRoute);

// Silently handle browser's automatic favicon requests
app.get("/favicon.ico", (req, res) => res.status(204).end());

// 404 Catch-All Route (Must be after all other routes)
app.use(notFound);

// Error Handling Middleware (Must be the very last middleware)
app.use(errorHandler);

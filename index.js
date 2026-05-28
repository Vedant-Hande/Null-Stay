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
import session from "express-session";
import store from "./config/session.js";
import flash from "connect-flash";
import passport from "passport";
import LocalStrategy from "passport-local";
import { FLASH_KEYS } from "./utils/constants.js";
import calculateAvgRating from "./utils/calculateAvgRating.js";
import * as bookingDisplay from "./utils/bookingDisplay.js";
import User from "./models/user.js";
import userRoute from "./routes/userRoute.js";
import bookingRoute from "./routes/bookingRoute.js";
import "./config/cloudinary.js";

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

const sessionOptions = {
  store,
  secret: process.env.SESSION_SECRET || "default_session_secret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to false for HTTP localhost testing
    httpOnly: true, // prevents client-side javascript from accessing the cookie
    sameSite: "lax", // prevents cross-site request forgery
    maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days
  },
};

// Middleware
app.use(express.urlencoded({ extended: true })); // parsing html form data
app.use(express.json()); // parsing json data
app.use(express.static(path.join(__dirname, "public"))); // serving static files

app.use(methodOverride("_method")); // using method override to update and delete

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Pass flash messages to all EJS templates (Must be before all routes)
app.use((req, res, next) => {
  res.locals.success = req.flash(FLASH_KEYS.SUCCESS);
  res.locals.error = req.flash(FLASH_KEYS.ERROR);
  res.locals.calculateAvgRating = calculateAvgRating;
  res.locals.bookingDisplay = bookingDisplay;
  res.locals.currentUser = req.user || null;
  res.locals.isListingsPage =
    req.originalUrl === "/listings" ||
    req.originalUrl === "/listings/" ||
    req.originalUrl === "/";
  next();
});

// Root Route
app.get("/", (req, res) => {
  res.render("home.ejs");
});

// Routes
app.use("/listings", listingRoute);
app.use("/", reviewRoute);
app.use("/", infoRoute);
app.use("/", userRoute);
app.use("/bookings", bookingRoute);

// Silently handle browser's automatic favicon requests
app.get("/favicon.ico", (req, res) => res.status(204).end());

// 404 Catch-All Route (Must be after all other routes)
app.use(notFound);

// Error Handling Middleware (Must be the very last middleware)
app.use(errorHandler);

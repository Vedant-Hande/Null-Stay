import path from "path";

import { fileURLToPath } from "url";

import http from "http";
import os from "os";

import dotenv from "dotenv";

import express from "express";

import connectDB from "./config/database.js";

import methodOverride from "method-override";

import ejsMate from "ejs-mate";

import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

import listingRoute from "./routes/listingRoute.js";
import apiListingRoute from "./routes/apiListingRoute.js";

import reviewRoute from "./routes/reviewRoute.js";

import infoRoute from "./routes/infoRoute.js";

import session from "express-session";

import store from "./config/session.js";

import flash from "connect-flash";

import passport from "passport";

import LocalStrategy from "passport-local";

import { FLASH_KEYS } from "./utils/constants.js";

import calculateAvgRating from "./utils/calculateAvgRating.js";
import { isReviewAuthor } from "./middleware/authMiddleware.js";

import * as bookingDisplay from "./utils/bookingDisplay.js";

import User from "./models/user.js";
import listings from "./models/listing.js";
import wrapAsync from "./utils/wrapAsync.js";

import userRoute from "./routes/userRoute.js";

import bookingRoute from "./routes/bookingRoute.js";

import notificationRoute from "./routes/notificationRoute.js";

import { getUnreadCount } from "./utils/notifyUser.js";
import { pruneExpiredNotificationData } from "./utils/notificationRetention.js";
import { pruneOldCancelledBookings } from "./utils/bookingRetention.js";

import { initSocket } from "./config/socket.js";

import pushRoute from "./routes/pushRoute.js";
import wishlistRoute from "./routes/wishlistRoute.js";
import messageRoute from "./routes/messageRoute.js";
import devRoute from "./routes/devRoute.js";

import {
  getVapidPublicKey,
  initWebPush,
  isWebPushConfigured,
} from "./config/webPush.js";
import { isMailConfigured } from "./config/mail.js";
import { isRazorpayConfigured, getRazorpayModeLabel } from "./config/razorpay.js";

import "./config/cloudinary.js";
import cache, { isCacheEnabled } from "./config/cache.js";
import { getStaticCacheOptions } from "./middleware/staticCache.js";
import { getCachedFeaturedListings } from "./utils/listingCache.js";
import { getWishlistedIdsForUser } from "./utils/wishlistIds.js";

initWebPush();



const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);



if (process.env.NODE_ENV !== "production") {

  dotenv.config({ path: path.join(__dirname, ".env") });

}



const app = express();

const server = http.createServer(app);

const port = Number(process.env.CONN_PORT) || 8080;
const host = process.env.HOST || "0.0.0.0";

function getLanUrls(listenPort) {
  const urls = [];
  const nets = os.networkInterfaces();
  for (const ifaces of Object.values(nets)) {
    for (const net of ifaces || []) {
      if (net.family === "IPv4" && !net.internal) {
        urls.push(`http://${net.address}:${listenPort}`);
      }
    }
  }
  return urls;
}



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

    secure: false,

    httpOnly: true,

    sameSite: "lax",

    maxAge: 1000 * 60 * 60 * 24 * 3,

  },

};



const sessionMiddleware = session(sessionOptions);

const passportInit = passport.initialize();

const passportSession = passport.session();



app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(express.static(path.join(__dirname, "public"), getStaticCacheOptions()));

app.use(methodOverride("_method"));



app.use(sessionMiddleware);

app.use(flash());

app.use(passportInit);

app.use(passportSession);



app.set("passportInit", passportInit);

app.set("passportSession", passportSession);



passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());



initSocket(server, app, sessionMiddleware);



app.use(async (req, res, next) => {

  res.locals.success = req.flash(FLASH_KEYS.SUCCESS);

  res.locals.error = req.flash(FLASH_KEYS.ERROR);

  res.locals.calculateAvgRating = calculateAvgRating;

  res.locals.isReviewAuthor = isReviewAuthor;

  res.locals.bookingDisplay = bookingDisplay;

  res.locals.currentUser = req.user || null;

  res.locals.unreadNotificationCount = 0;

  res.locals.webPushEnabled = isWebPushConfigured();

  res.locals.vapidPublicKey = getVapidPublicKey();

  res.locals.isListingsPage =
    req.originalUrl === "/listings" ||
    req.originalUrl === "/listings/" ||
    req.originalUrl.startsWith("/listings?");
  res.locals.isHomePage =
    req.originalUrl === "/" || req.originalUrl === "";
  res.locals.searchQuery = res.locals.searchQuery || {};

  if (req.user) {

    try {

      res.locals.unreadNotificationCount = await getUnreadCount(req.user._id);

    } catch {

      res.locals.unreadNotificationCount = 0;

    }

  }

  next();

});



app.get("/", wrapAsync(async (req, res) => {
  const { rows: featuredListings } = await getCachedFeaturedListings(
    listings,
    8,
  );
  const wishlistedIds = await getWishlistedIdsForUser(req.user?._id);

  res.render("home.ejs", { featuredListings, wishlistedIds });
}));



app.use("/api/listings", apiListingRoute);
app.use("/listings", listingRoute);

app.use("/", reviewRoute);

app.use("/", infoRoute);

app.use("/", userRoute);

app.use("/bookings", bookingRoute);

app.use("/notifications", notificationRoute);

app.use("/push", pushRoute);
app.use("/wishlists", wishlistRoute);
app.use("/messages", messageRoute);
app.use("/dev", devRoute);

app.get("/favicon.ico", (req, res) => res.status(204).end());



app.use(notFound);

app.use(errorHandler);



server.listen(port, host, () => {
  console.log(`server is listening on http://127.0.0.1:${port} (local)`);
  const lan = getLanUrls(port);
  if (lan.length) {
    console.log("Reach this PC on your LAN (phone on same Wi‑Fi):");
    lan.forEach((url) => console.log(`  → ${url}`));
  }
  if (host === "0.0.0.0") {
    console.log(
      "Port forwarding: forward router external port → this PC's LAN IP:" + port,
    );
  }
  if (isWebPushConfigured()) {
    console.log("Web Push: enabled (VAPID keys loaded)");
  } else {
    console.log(
      "Web Push: disabled — add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACT_EMAIL to .env",
    );
  }

  if (isMailConfigured()) {
    console.log("Email: enabled (SMTP configured)");
  } else {
    console.log(
      "Email: disabled — add SMTP_HOST, SMTP_USER, SMTP_PASS to .env",
    );
  }

  if (isRazorpayConfigured()) {
    const mode = getRazorpayModeLabel();
    if (mode === "live") {
      console.log("Razorpay: LIVE — real UPI, card, and netbanking payments enabled");
    } else {
      console.log("Razorpay: TEST — use live keys (rzp_live_) for real payments");
    }
  } else {
    console.log(
      "Razorpay: disabled — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env",
    );
  }

  if (isCacheEnabled) {
    const { size, maxEntries } = cache.stats();
    console.log(
      `Cache: enabled (TTL ${process.env.CACHE_TTL_SECONDS || 60}s, ${size}/${maxEntries} keys)`,
    );
  } else {
    console.log("Cache: disabled (set CACHE_ENABLED=true to enable)");
  }

  setInterval(() => {
    pruneExpiredNotificationData().catch(() => {});
    pruneOldCancelledBookings().catch(() => {});
  }, 60 * 60 * 1000);
});



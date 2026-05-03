import express from "express";
import User from "../models/user.js";
import passport from "passport";
import wrapAsync from "../utils/wrapAsync.js";
import { FLASH_KEYS } from "../utils/constants.js";
import { saveRedirectUrl, isLoggedIn } from "../middleware/authMiddleware.js";
import listings from "../models/listing.js";
import Review from "../models/review.js";

const router = express.Router();

router.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

router.post(
  "/signup",
  wrapAsync(async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      const newUser = new User({ email, username });
      const registeredUser = await User.register(newUser, password);

      req.login(registeredUser, (err) => {
        if (err) {
          return next(err);
        }
        req.flash(FLASH_KEYS.SUCCESS, "Welcome to NullStay!");
        res.redirect("/listings");
      });
    } catch (e) {
      req.flash(FLASH_KEYS.ERROR, e.message);
      res.redirect("/signup");
    }
  }),
);

router.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

router.post(
  "/login",
  saveRedirectUrl,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (req, res) => {
    req.flash(FLASH_KEYS.SUCCESS, "Welcome back to NullStay!");
    const redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
  },
);

router.get(
  "/user/analytics",
  isLoggedIn,
  wrapAsync(async (req, res, next) => {
    const userListings = await listings.find({ owner: req.user._id }).populate("reviews");
    const reviewsSubmitted = await Review.find({ owner: req.user._id });

    let totalReviewsReceived = 0;
    let totalRatingSum = 0;
    let listingCountWithRatings = 0;

    userListings.forEach((listing) => {
      if (listing.reviews && listing.reviews.length > 0) {
        let listingSum = 0;
        listing.reviews.forEach((r) => {
          listingSum += r.rating;
        });
        const avg = listingSum / listing.reviews.length;
        totalRatingSum += avg;
        listingCountWithRatings++;
        totalReviewsReceived += listing.reviews.length;
      }
    });

    const averageRating = listingCountWithRatings > 0 ? (totalRatingSum / listingCountWithRatings).toFixed(1) : "N/A";

    res.render("users/analytics.ejs", {
      userListings,
      reviewsSubmitted,
      totalReviewsReceived,
      averageRating,
    });
  }),
);

router.get(
  "/user/account",
  isLoggedIn,
  wrapAsync(async (req, res, next) => {
    const userListings = await listings.find({ owner: req.user._id });
    const reviewsSubmitted = await Review.find({ owner: req.user._id });

    res.render("users/account.ejs", {
      user: req.user,
      listingsCount: userListings.length,
      reviewsCount: reviewsSubmitted.length,
      userListings,
    });
  }),
);

router.put(
  "/user/account",
  isLoggedIn,
  wrapAsync(async (req, res, next) => {
    const { username, email } = req.body;
    const existing = await User.findOne({ username, _id: { $ne: req.user._id } });
    if (existing) {
      req.flash(FLASH_KEYS.ERROR, "That username is already taken.");
      return res.redirect("/user/account");
    }
    await User.findByIdAndUpdate(req.user._id, { username, email });
    req.flash(FLASH_KEYS.SUCCESS, "Profile updated successfully!");
    res.redirect("/user/account");
  }),
);

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash(FLASH_KEYS.SUCCESS, "You are logged out!");
    res.redirect("/listings");
  });
});

export default router;

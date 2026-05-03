import express from "express";
import User from "../models/user.js";
import passport from "passport";
import wrapAsync from "../utils/wrapAsync.js";
import { FLASH_KEYS } from "../utils/constants.js";
import { saveRedirectUrl } from "../middleware/authMiddleware.js";

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

import { FLASH_KEYS } from "../utils/constants.js";

export const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash(FLASH_KEYS.ERROR, "You must be logged in to create a listing!");
    return res.redirect("/login");
  }
  next();
};

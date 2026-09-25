import {
  getDevKeyFromRequest,
  isDevAccessConfigured,
  verifyDevAccessKey,
} from "../config/devAccess.js";

/**
 * Developer-only routes. Returns 404 when disabled or key is wrong (no hint).
 */
export function requireDevAccess(req, res, next) {
  if (!isDevAccessConfigured()) {
    return res.status(404).render("listings/error.ejs", {
      message: "Page not found",
      statusCode: 404,
    });
  }

  const key = getDevKeyFromRequest(req);
  if (!verifyDevAccessKey(key)) {
    return res.status(404).render("listings/error.ejs", {
      message: "Page not found",
      statusCode: 404,
    });
  }

  next();
}

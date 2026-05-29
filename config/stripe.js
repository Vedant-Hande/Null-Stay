import Stripe from "stripe";

let stripeClient = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function isStripeLiveMode() {
  return process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ?? false;
}

export function getStripeModeLabel() {
  if (!isStripeConfigured()) return "disabled";
  return isStripeLiveMode() ? "live" : "test";
}

export function getStripe() {
  if (!isStripeConfigured()) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export function getStripePublishableKey() {
  return process.env.STRIPE_PUBLISHABLE_KEY || "";
}

export function getStripeCurrency() {
  return (process.env.STRIPE_CURRENCY || "inr").toLowerCase();
}

/** Convert rupee (or major-unit) total to Stripe's smallest currency unit */
export function toStripeAmount(majorUnitTotal) {
  return Math.round(Number(majorUnitTotal) * 100);
}

export function getAppBaseUrl(req) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  return `${req.protocol}://${req.get("host")}`;
}

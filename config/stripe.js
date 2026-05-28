import Stripe from "stripe";

let stripeClient = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
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

export function getAppBaseUrl(req) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  return `${req.protocol}://${req.get("host")}`;
}

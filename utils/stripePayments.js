import {
  getStripe,
  getStripeCurrency,
  isStripeConfigured,
  toStripeAmount,
} from "../config/stripe.js";

export { isStripeConfigured };

export async function createBookingPaymentIntent({
  amount,
  listingId,
  guestId,
  checkIn,
  checkOut,
  guests,
}) {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const currency = getStripeCurrency();

  return stripe.paymentIntents.create({
    amount: toStripeAmount(amount),
    currency,
    automatic_payment_methods: { enabled: true },
    metadata: {
      listingId: String(listingId),
      guestId: String(guestId),
      checkIn,
      checkOut,
      guests: String(guests),
    },
  });
}

export async function verifyBookingPaymentIntent(paymentIntentId, {
  expectedAmount,
  listingId,
  guestId,
  checkIn,
  checkOut,
  guests,
}) {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured." };
  }

  let intent;
  try {
    intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    return { ok: false, error: "Invalid payment. Please try again." };
  }

  if (intent.status !== "succeeded") {
    return { ok: false, error: "Payment was not completed." };
  }

  const meta = intent.metadata || {};
  if (
    meta.listingId !== String(listingId) ||
    meta.guestId !== String(guestId) ||
    meta.checkIn !== checkIn ||
    meta.checkOut !== checkOut ||
    meta.guests !== String(guests)
  ) {
    return { ok: false, error: "Payment does not match this booking." };
  }

  if (intent.amount !== toStripeAmount(expectedAmount)) {
    return { ok: false, error: "Payment amount does not match the total." };
  }

  return { ok: true, intent };
}

export async function refundBookingPayment(stripePaymentIntentId) {
  if (!isStripeConfigured() || !stripePaymentIntentId) {
    return { refunded: false };
  }

  const stripe = getStripe();
  try {
    await stripe.refunds.create({
      payment_intent: stripePaymentIntentId,
    });
    return { refunded: true };
  } catch (err) {
    console.error("Stripe refund failed:", err.message);
    return { refunded: false, error: err.message };
  }
}

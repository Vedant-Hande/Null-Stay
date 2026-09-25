import crypto from "crypto";

import {
  getRazorpay,
  getRazorpayCurrency,
  isRazorpayConfigured,
  toRazorpayAmount,
} from "../config/razorpay.js";

export { isRazorpayConfigured };

export async function createBookingRazorpayOrder({
  amount,
  listingId,
  guestId,
  checkIn,
  checkOut,
  guests,
}) {
  const razorpay = getRazorpay();
  if (!razorpay) {
    throw new Error("Razorpay is not configured");
  }

  const currency = getRazorpayCurrency();
  const receipt = `ns_${Date.now()}_${String(listingId).slice(-6)}`;

  return razorpay.orders.create({
    amount: toRazorpayAmount(amount),
    currency,
    receipt,
    notes: {
      listingId: String(listingId),
      guestId: String(guestId),
      checkIn,
      checkOut,
      guests: String(guests),
    },
  });
}

export function verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature,
}) {
  if (!isRazorpayConfigured()) {
    return { ok: false, error: "Razorpay is not configured." };
  }

  if (!orderId || !paymentId || !signature) {
    return { ok: false, error: "Incomplete payment details." };
  }

  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expected !== signature) {
    return { ok: false, error: "Payment verification failed." };
  }

  return { ok: true };
}

export async function verifyBookingRazorpayPayment({
  orderId,
  paymentId,
  signature,
  expectedAmount,
  listingId,
  guestId,
  checkIn,
  checkOut,
  guests,
}) {
  const sigCheck = verifyRazorpayPaymentSignature({
    orderId,
    paymentId,
    signature,
  });
  if (!sigCheck.ok) {
    return sigCheck;
  }

  const razorpay = getRazorpay();
  if (!razorpay) {
    return { ok: false, error: "Razorpay is not configured." };
  }

  let order;
  let payment;
  try {
    order = await razorpay.orders.fetch(orderId);
    payment = await razorpay.payments.fetch(paymentId);
  } catch {
    return { ok: false, error: "Invalid payment. Please try again." };
  }

  if (payment.status !== "captured" && payment.status !== "authorized") {
    return { ok: false, error: "Payment was not completed." };
  }

  if (payment.order_id !== orderId) {
    return { ok: false, error: "Payment does not match this order." };
  }

  const notes = order.notes || {};
  if (
    notes.listingId !== String(listingId) ||
    notes.guestId !== String(guestId) ||
    notes.checkIn !== checkIn ||
    notes.checkOut !== checkOut ||
    notes.guests !== String(guests)
  ) {
    return { ok: false, error: "Payment does not match this booking." };
  }

  if (Number(order.amount) !== toRazorpayAmount(expectedAmount)) {
    return { ok: false, error: "Payment amount does not match the total." };
  }

  return { ok: true, order, payment };
}

export async function refundBookingPayment(razorpayPaymentId, amountMajor) {
  if (!isRazorpayConfigured() || !razorpayPaymentId) {
    return { refunded: false };
  }

  const razorpay = getRazorpay();
  try {
    await razorpay.payments.refund(razorpayPaymentId, {
      amount: toRazorpayAmount(amountMajor),
    });
    return { refunded: true };
  } catch (err) {
    console.error("Razorpay refund failed:", err.message);
    return { refunded: false, error: err.message };
  }
}

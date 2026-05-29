import Booking, { BOOKING_STATUSES } from "../models/booking.js";
import { generateConfirmationCode } from "./bookingDisplay.js";

export async function findBookingByPaymentIntent(paymentIntentId) {
  if (!paymentIntentId) return null;
  return Booking.findOne({ stripePaymentIntentId: paymentIntentId });
}

export async function createBookingFromCheckout({
  listing,
  guestId,
  checkIn,
  checkOut,
  guests,
  nights,
  totals,
  stripePaymentIntentId = null,
}) {
  const instantBook = listing.instantBook !== false;
  const status = instantBook
    ? BOOKING_STATUSES.CONFIRMED
    : BOOKING_STATUSES.PENDING;

  const booking = new Booking({
    listing: listing._id,
    guest: guestId,
    checkIn,
    checkOut,
    guests,
    nights,
    nightlyRate: totals.nightlyRate,
    subtotal: totals.subtotal,
    cleaningFee: totals.cleaningFee,
    serviceFee: totals.serviceFee,
    total: totals.total,
    status,
    paymentStatus: "paid",
    paidAt: new Date(),
    confirmationCode: generateConfirmationCode(),
    ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
  });

  await booking.save();
  return { booking, status, instantBook };
}

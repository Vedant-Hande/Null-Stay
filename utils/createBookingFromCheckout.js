import Booking, { BOOKING_STATUSES } from "../models/booking.js";
import { generateConfirmationCode } from "./bookingDisplay.js";

export async function findBookingByRazorpayOrder(orderId) {
  if (!orderId) return null;
  return Booking.findOne({ razorpayOrderId: orderId });
}

export async function createBookingFromCheckout({
  listing,
  guestId,
  checkIn,
  checkOut,
  guests,
  nights,
  totals,
  razorpayOrderId = null,
  razorpayPaymentId = null,
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
    ...(razorpayOrderId ? { razorpayOrderId } : {}),
    ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
  });

  await booking.save();
  return { booking, status, instantBook };
}

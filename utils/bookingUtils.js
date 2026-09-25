import Booking, { BOOKING_STATUSES } from "../models/booking.js";
import { DEFAULT_CLEANING_FEE, DEFAULT_SERVICE_FEE } from "./constants.js";

/** Parse YYYY-MM-DD as UTC midnight */
export function parseDateOnly(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDateOnly(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Nights = checkout - checkin (checkout day not counted) */
export function calculateNights(checkIn, checkOut) {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function getListingFees(listing) {
  const cleaningFee =
    listing.cleaningFee != null ? listing.cleaningFee : DEFAULT_CLEANING_FEE;
  const serviceFee =
    listing.serviceFee != null ? listing.serviceFee : DEFAULT_SERVICE_FEE;
  return { cleaningFee, serviceFee };
}

export function calculateBookingTotals(listing, nights) {
  const nightlyRate = listing.price;
  const subtotal = nightlyRate * nights;
  const { cleaningFee, serviceFee } = getListingFees(listing);
  const total = subtotal + cleaningFee + serviceFee;
  return {
    nightlyRate,
    subtotal,
    cleaningFee,
    serviceFee,
    total,
    nights,
  };
}

const BLOCKING_STATUSES = [
  BOOKING_STATUSES.PENDING,
  BOOKING_STATUSES.CONFIRMED,
];

/**
 * True if [checkIn, checkOut) overlaps any blocking booking for the listing.
 * checkout day is exclusive (guest leaves that morning).
 */
export async function hasDateOverlap(
  listingId,
  checkIn,
  checkOut,
  excludeBookingId = null,
) {
  const query = {
    listing: listingId,
    status: { $in: BLOCKING_STATUSES },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  const conflict = await Booking.findOne(query);
  return Boolean(conflict);
}

export async function getBookedDateRanges(listingId) {
  const bookings = await Booking.find({
    listing: listingId,
    status: { $in: BLOCKING_STATUSES },
  }).select("checkIn checkOut");

  return bookings.map((b) => ({
    from: formatDateOnly(b.checkIn),
    to: formatDateOnly(b.checkOut),
  }));
}

/** Expand ranges to disabled individual dates for flatpickr (checkout day stays selectable as check-in) */
export function rangesToDisabledDates(ranges) {
  const disabled = new Set();
  for (const { from, to } of ranges) {
    let cur = parseDateOnly(from);
    const end = parseDateOnly(to);
    while (cur < end) {
      disabled.add(formatDateOnly(cur));
      cur = new Date(cur.getTime() + 86400000);
    }
  }
  return [...disabled];
}

export function validateBookingDates(checkInStr, checkOutStr) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const checkIn = parseDateOnly(checkInStr);
  const checkOut = parseDateOnly(checkOutStr);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return { error: "Invalid dates selected." };
  }
  if (checkIn < today) {
    return { error: "Check-in cannot be in the past." };
  }
  if (checkOut <= checkIn) {
    return { error: "Check-out must be after check-in." };
  }

  const nights = calculateNights(checkIn, checkOut);
  if (nights < 1) {
    return { error: "Stay must be at least 1 night." };
  }
  if (nights > 365) {
    return { error: "Stay cannot exceed 365 nights." };
  }

  return { checkIn, checkOut, nights };
}

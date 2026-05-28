import { BOOKING_STATUSES } from "../models/booking.js";

export function formatBookingDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatBookingDateShort(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatInr(amount) {
  return `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function bookingDateRange(checkIn, checkOut) {
  return `${formatBookingDateShort(checkIn)} → ${formatBookingDateShort(checkOut)}`;
}

export function isUpcomingBooking(booking) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return (
    booking.checkOut >= today &&
    (booking.status === BOOKING_STATUSES.CONFIRMED ||
      booking.status === BOOKING_STATUSES.PENDING)
  );
}

export function isPastBooking(booking) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return (
    booking.checkOut < today &&
    booking.status === BOOKING_STATUSES.CONFIRMED
  );
}

/** Text-only status labels (no pill badges / icon chips) */
export const STATUS_META = {
  [BOOKING_STATUSES.CONFIRMED]: {
    label: "Confirmed",
    tone: "confirmed",
  },
  [BOOKING_STATUSES.PENDING]: {
    label: "Awaiting host",
    tone: "pending",
  },
  [BOOKING_STATUSES.CANCELLED]: {
    label: "Cancelled",
    tone: "cancelled",
  },
  [BOOKING_STATUSES.REJECTED]: {
    label: "Declined",
    tone: "rejected",
  },
};

export function generateConfirmationCode() {
  const part = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NS-${part}`;
}

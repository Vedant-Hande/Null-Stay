import listings from "../models/listing.js";
import Booking, { BOOKING_STATUSES } from "../models/booking.js";
import { BOOKING_FLASH } from "../constants.js";
import {
  calculateBookingTotals,
  hasDateOverlap,
  validateBookingDates,
} from "./bookingUtils.js";

export async function prepareBookingCheckout({ user, body }) {
  const { listingId, checkIn: checkInStr, checkOut: checkOutStr, guests } = body;

  const listing = await listings.findById(listingId).populate("owner");
  if (!listing) {
    return { error: "Listing not found.", redirect: "/listings" };
  }

  const ownerId = listing.owner?._id ?? listing.owner;
  if (ownerId && ownerId.equals(user._id)) {
    return {
      error: BOOKING_FLASH.OWN_LISTING,
      redirect: `/listings/${listingId}`,
    };
  }

  const guestCount = Number(guests);
  if (guestCount > listing.guests) {
    return {
      error: `This listing allows up to ${listing.guests} guests.`,
      redirect: `/listings/${listingId}/checkout?checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=${guests}`,
    };
  }

  const dateResult = validateBookingDates(checkInStr, checkOutStr);
  if (dateResult.error) {
    return { error: dateResult.error, redirect: `/listings/${listingId}` };
  }

  const { checkIn, checkOut, nights } = dateResult;

  if (await hasDateOverlap(listing._id, checkIn, checkOut)) {
    return {
      error: BOOKING_FLASH.DATES_UNAVAILABLE,
      redirect: `/listings/${listingId}`,
    };
  }

  const totals = calculateBookingTotals(listing, nights);
  const instantBook = listing.instantBook !== false;

  return {
    listing,
    bookingData: {
      listing: listing._id,
      guest: user._id,
      checkIn,
      checkOut,
      guests: guestCount,
      nights,
      nightlyRate: totals.nightlyRate,
      subtotal: totals.subtotal,
      cleaningFee: totals.cleaningFee,
      serviceFee: totals.serviceFee,
      total: totals.total,
      status: BOOKING_STATUSES.PENDING,
      paymentStatus: "unpaid",
      instantBook,
    },
    totals,
    instantBook,
    checkInStr,
    checkOutStr,
    guests: guestCount,
  };
}

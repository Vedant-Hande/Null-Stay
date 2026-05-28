import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";
import { validateBooking } from "../middleware/validationMiddleware.js";
import Booking, { BOOKING_STATUSES } from "../models/booking.js";
import listings from "../models/listing.js";
import { FLASH_KEYS, BOOKING_FLASH } from "../utils/constants.js";
import {
  calculateBookingTotals,
  hasDateOverlap,
  validateBookingDates,
} from "../utils/bookingUtils.js";
import {
  generateConfirmationCode,
  isPastBooking,
  isUpcomingBooking,
} from "../utils/bookingDisplay.js";

const router = express.Router();

const DEMO_CARD_DIGITS = "4242424242424242";

function filterTrips(trips, filter) {
  if (!filter || filter === "all") {
    return trips;
  }
  if (filter === "upcoming") {
    return trips.filter(isUpcomingBooking);
  }
  if (filter === "past") {
    return trips.filter(isPastBooking);
  }
  if (filter === "cancelled") {
    return trips.filter(
      (t) =>
        t.status === BOOKING_STATUSES.CANCELLED ||
        t.status === BOOKING_STATUSES.REJECTED,
    );
  }
  return trips;
}

router.get(
  "/trips",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const filter = req.query.filter || "all";
    const rawTrips = await Booking.find({ guest: req.user._id })
      .populate({
        path: "listing",
        populate: { path: "owner", select: "username" },
      })
      .sort({ checkIn: -1 });

    const allTrips = rawTrips.filter((t) => t.listing);
    const trips = filterTrips(allTrips, filter);
    const counts = {
      all: allTrips.length,
      upcoming: filterTrips(allTrips, "upcoming").length,
      past: filterTrips(allTrips, "past").length,
      cancelled: filterTrips(allTrips, "cancelled").length,
    };

    res.render("bookings/trips.ejs", { trips, filter, counts });
  }),
);

router.get(
  "/host",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const hostListings = await listings.find({ owner: req.user._id }).select(
      "_id",
    );
    const listingIds = hostListings.map((l) => l._id);

    const hostBookings = await Booking.find({ listing: { $in: listingIds } })
      .populate("listing", "title location image price guests")
      .populate("guest", "username email")
      .sort({ createdAt: -1 });

    const stats = {
      pending: hostBookings.filter((b) => b.status === BOOKING_STATUSES.PENDING)
        .length,
      confirmed: hostBookings.filter(
        (b) => b.status === BOOKING_STATUSES.CONFIRMED,
      ).length,
      upcoming: hostBookings.filter(
        (b) =>
          b.status === BOOKING_STATUSES.CONFIRMED && isUpcomingBooking(b),
      ).length,
    };

    res.render("bookings/host.ejs", { hostBookings, stats });
  }),
);

router.get(
  "/:id",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: "listing",
        populate: { path: "owner", select: "username email" },
      })
      .populate("guest", "username email");

    if (!booking) {
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.NOT_FOUND);
      return res.redirect("/bookings/trips");
    }

    const isGuest = booking.guest._id.equals(req.user._id);
    const hostId = booking.listing?.owner?._id ?? booking.listing?.owner;
    const isHost = hostId && hostId.equals(req.user._id);

    if (!isGuest && !isHost) {
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.UNAUTHORIZED);
      return res.redirect("/bookings/trips");
    }

    res.render("bookings/show.ejs", { booking, isGuest, isHost });
  }),
);

router.post(
  "/",
  isLoggedIn,
  validateBooking,
  wrapAsync(async (req, res) => {
    const {
      listingId,
      checkIn: checkInStr,
      checkOut: checkOutStr,
      guests,
      cardNumber,
    } = req.body;

    const redirectCheckout = `/listings/${listingId}/checkout?checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=${guests}`;

    const digits = String(cardNumber).replace(/\s/g, "");
    if (digits !== DEMO_CARD_DIGITS) {
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.PAYMENT_DECLINED);
      return res.redirect(redirectCheckout);
    }

    const listing = await listings.findById(listingId).populate("owner");
    if (!listing) {
      req.flash(FLASH_KEYS.ERROR, "Listing not found.");
      return res.redirect("/listings");
    }

    const ownerId = listing.owner?._id ?? listing.owner;
    if (ownerId && ownerId.equals(req.user._id)) {
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.OWN_LISTING);
      return res.redirect(`/listings/${listingId}`);
    }

    if (guests > listing.guests) {
      req.flash(
        FLASH_KEYS.ERROR,
        `This listing allows up to ${listing.guests} guests.`,
      );
      return res.redirect(redirectCheckout);
    }

    const dateResult = validateBookingDates(checkInStr, checkOutStr);
    if (dateResult.error) {
      req.flash(FLASH_KEYS.ERROR, dateResult.error);
      return res.redirect(`/listings/${listingId}`);
    }

    const { checkIn, checkOut, nights } = dateResult;

    if (await hasDateOverlap(listing._id, checkIn, checkOut)) {
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.DATES_UNAVAILABLE);
      return res.redirect(`/listings/${listingId}`);
    }

    const totals = calculateBookingTotals(listing, nights);
    const instantBook = listing.instantBook !== false;
    const status = instantBook
      ? BOOKING_STATUSES.CONFIRMED
      : BOOKING_STATUSES.PENDING;

    const booking = new Booking({
      listing: listing._id,
      guest: req.user._id,
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
    });

    await booking.save();

    if (status === BOOKING_STATUSES.CONFIRMED) {
      req.flash(FLASH_KEYS.SUCCESS, BOOKING_FLASH.CREATED);
    } else {
      req.flash(FLASH_KEYS.SUCCESS, BOOKING_FLASH.REQUEST_SENT);
    }

    res.redirect(`/bookings/${booking._id}`);
  }),
);

router.post(
  "/:id/cancel",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.NOT_FOUND);
      return res.redirect("/bookings/trips");
    }

    if (!booking.guest.equals(req.user._id)) {
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.UNAUTHORIZED);
      return res.redirect("/bookings/trips");
    }

    if (
      booking.status === BOOKING_STATUSES.CANCELLED ||
      booking.status === BOOKING_STATUSES.REJECTED
    ) {
      return res.redirect("/bookings/trips");
    }

    booking.status = BOOKING_STATUSES.CANCELLED;
    if (booking.paymentStatus === "paid") {
      booking.paymentStatus = "refunded";
    }
    await booking.save();
    req.flash(FLASH_KEYS.SUCCESS, BOOKING_FLASH.CANCELLED);
    res.redirect("/bookings/trips");
  }),
);

router.post(
  "/:id/accept",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const booking = await Booking.findById(req.params.id).populate("listing");
    if (!booking) {
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.NOT_FOUND);
      return res.redirect("/bookings/host");
    }

    const hostId = booking.listing.owner?._id ?? booking.listing.owner;
    if (!hostId || !hostId.equals(req.user._id)) {
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.UNAUTHORIZED);
      return res.redirect("/bookings/host");
    }

    if (booking.status !== BOOKING_STATUSES.PENDING) {
      return res.redirect("/bookings/host");
    }

    if (
      await hasDateOverlap(
        booking.listing._id,
        booking.checkIn,
        booking.checkOut,
        booking._id,
      )
    ) {
      booking.status = BOOKING_STATUSES.REJECTED;
      if (booking.paymentStatus === "paid") {
        booking.paymentStatus = "refunded";
      }
      await booking.save();
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.DATES_UNAVAILABLE);
      return res.redirect("/bookings/host");
    }

    booking.status = BOOKING_STATUSES.CONFIRMED;
    await booking.save();
    req.flash(FLASH_KEYS.SUCCESS, BOOKING_FLASH.ACCEPTED);
    res.redirect("/bookings/host");
  }),
);

router.post(
  "/:id/reject",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const booking = await Booking.findById(req.params.id).populate("listing");
    if (!booking) {
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.NOT_FOUND);
      return res.redirect("/bookings/host");
    }

    const hostIdReject = booking.listing.owner?._id ?? booking.listing.owner;
    if (!hostIdReject || !hostIdReject.equals(req.user._id)) {
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.UNAUTHORIZED);
      return res.redirect("/bookings/host");
    }

    if (booking.status !== BOOKING_STATUSES.PENDING) {
      return res.redirect("/bookings/host");
    }

    booking.status = BOOKING_STATUSES.REJECTED;
    if (booking.paymentStatus === "paid") {
      booking.paymentStatus = "refunded";
    }
    await booking.save();
    req.flash(FLASH_KEYS.SUCCESS, BOOKING_FLASH.REJECTED);
    res.redirect("/bookings/host");
  }),
);

export default router;

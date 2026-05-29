import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";
import {
  validateBooking,
  validateBookingRazorpayOrder,
} from "../middleware/validationMiddleware.js";
import Booking, { BOOKING_STATUSES } from "../models/booking.js";
import listings from "../models/listing.js";
import { FLASH_KEYS, BOOKING_FLASH } from "../utils/constants.js";
import { hasDateOverlap } from "../utils/bookingUtils.js";
import {
  isPastBooking,
  isUpcomingBooking,
} from "../utils/bookingDisplay.js";
import { isRazorpayConfigured } from "../config/razorpay.js";
import { prepareBookingCheckout } from "../utils/bookingCheckout.js";
import {
  createBookingRazorpayOrder,
  verifyBookingRazorpayPayment,
  refundBookingPayment,
} from "../utils/razorpayPayments.js";
import {
  createBookingFromCheckout,
  findBookingByRazorpayOrder,
} from "../utils/createBookingFromCheckout.js";
import {
  notifyAfterBookingCreated,
  notifyAfterBookingAccepted,
  notifyAfterBookingRejected,
  notifyAfterBookingCancelled,
} from "../utils/bookingNotifications.js";
import { notifyGuestBookingCancelled } from "../utils/activityNotifications.js";

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

function checkoutRedirect(listingId, checkIn, checkOut, guests) {
  return `/listings/${listingId}/checkout?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`;
}

async function markPaidBookingRefunded(booking) {
  if (booking.paymentStatus !== "paid") {
    return;
  }
  if (booking.razorpayPaymentId) {
    await refundBookingPayment(booking.razorpayPaymentId, booking.total);
  }
  booking.paymentStatus = "refunded";
}

function flashAfterBookingCreate(req, status) {
  if (status === BOOKING_STATUSES.CONFIRMED) {
    req.flash(FLASH_KEYS.SUCCESS, BOOKING_FLASH.CREATED);
  } else {
    req.flash(FLASH_KEYS.SUCCESS, BOOKING_FLASH.REQUEST_SENT);
  }
}

router.post(
  "/razorpay-order",
  isLoggedIn,
  validateBookingRazorpayOrder,
  wrapAsync(async (req, res) => {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        error: "Razorpay is not configured on this server.",
      });
    }

    const prepared = await prepareBookingCheckout({
      user: req.user,
      body: req.body,
    });

    if (prepared.error) {
      return res.status(400).json({ error: prepared.error });
    }

    const order = await createBookingRazorpayOrder({
      amount: prepared.totals.total,
      listingId: prepared.listing._id,
      guestId: req.user._id,
      checkIn: prepared.checkInStr,
      checkOut: prepared.checkOutStr,
      guests: prepared.guests,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      listingTitle: prepared.listing.title,
    });
  }),
);

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
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      cardNumber,
    } = req.body;

    const redirectCheckout = checkoutRedirect(
      listingId,
      checkInStr,
      checkOutStr,
      guests,
    );

    const prepared = await prepareBookingCheckout({
      user: req.user,
      body: { listingId, checkIn: checkInStr, checkOut: checkOutStr, guests },
    });

    if (prepared.error) {
      req.flash(FLASH_KEYS.ERROR, prepared.error);
      return res.redirect(prepared.redirect || "/listings");
    }

    const { listing, totals, checkIn, checkOut, nights } = {
      ...prepared,
      checkIn: prepared.bookingData.checkIn,
      checkOut: prepared.bookingData.checkOut,
      nights: prepared.bookingData.nights,
    };
    const guestCount = prepared.guests;

    if (isRazorpayConfigured()) {
      const existing = await findBookingByRazorpayOrder(razorpayOrderId);
      if (existing) {
        flashAfterBookingCreate(req, existing.status);
        return res.redirect(`/bookings/${existing._id}`);
      }

      const verification = await verifyBookingRazorpayPayment({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
        expectedAmount: totals.total,
        listingId: listing._id,
        guestId: req.user._id,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        guests: guestCount,
      });

      if (!verification.ok) {
        req.flash(FLASH_KEYS.ERROR, verification.error);
        return res.redirect(redirectCheckout);
      }

      const { booking, status } = await createBookingFromCheckout({
        listing,
        guestId: req.user._id,
        checkIn,
        checkOut,
        guests: guestCount,
        nights,
        totals,
        razorpayOrderId,
        razorpayPaymentId,
      });

      await notifyAfterBookingCreated({
        app: req.app,
        booking,
        listing,
        guestUser: req.user,
      });

      flashAfterBookingCreate(req, status);
      return res.redirect(`/bookings/${booking._id}`);
    }

    const digits = String(cardNumber).replace(/\s/g, "");
    if (digits !== DEMO_CARD_DIGITS) {
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.PAYMENT_DECLINED);
      return res.redirect(redirectCheckout);
    }

    const { booking, status } = await createBookingFromCheckout({
      listing,
      guestId: req.user._id,
      checkIn,
      checkOut,
      guests: guestCount,
      nights,
      totals,
    });

    await notifyAfterBookingCreated({
      app: req.app,
      booking,
      listing,
      guestUser: req.user,
    });

    flashAfterBookingCreate(req, status);
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
    await markPaidBookingRefunded(booking);
    await booking.save();

    const cancelListing = await listings.findById(booking.listing);
    if (cancelListing) {
      await notifyAfterBookingCancelled({
        app: req.app,
        booking,
        listing: cancelListing,
        guestUser: req.user,
      });
      await notifyGuestBookingCancelled({
        app: req.app,
        booking,
        listing: cancelListing,
      });
    }

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
      await markPaidBookingRefunded(booking);
      await booking.save();
      await notifyAfterBookingRejected({
        app: req.app,
        booking,
        listing: booking.listing,
      });
      req.flash(FLASH_KEYS.ERROR, BOOKING_FLASH.DATES_UNAVAILABLE);
      return res.redirect("/bookings/host");
    }

    booking.status = BOOKING_STATUSES.CONFIRMED;
    await booking.save();

    await notifyAfterBookingAccepted({
      app: req.app,
      booking,
      listing: booking.listing,
    });

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
    await markPaidBookingRefunded(booking);
    await booking.save();

    await notifyAfterBookingRejected({
      app: req.app,
      booking,
      listing: booking.listing,
    });

    req.flash(FLASH_KEYS.SUCCESS, BOOKING_FLASH.REJECTED);
    res.redirect("/bookings/host");
  }),
);

export default router;

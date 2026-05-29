import Booking, { BOOKING_STATUSES } from "../models/booking.js";
import { NOTIFICATION_TYPES } from "../models/notification.js";
import { notifyUser } from "./notifyUser.js";

function hostId(listing) {
  return listing.owner?._id ?? listing.owner;
}

function listingTitle(listing) {
  return listing?.title || "your listing";
}

function actorName(user) {
  return user?.username || "Someone";
}

function isSameUser(a, b) {
  if (!a || !b) return false;
  return String(a) === String(b);
}

/** Unique guest ids from booking documents */
function guestIdsFromBookings(bookings) {
  return [...new Set(bookings.map((b) => String(b.guest)))];
}

// —— Reviews (guest actions) ——

export async function notifyAfterReviewCreated({
  app,
  listing,
  review,
  guestUser,
}) {
  const title = listingTitle(listing);
  const guestName = actorName(guestUser);
  const host = hostId(listing);
  const stars = review?.rating ?? "";

  if (host && !isSameUser(host, guestUser._id)) {
    await notifyUser({
      app,
      recipientId: host,
      type: NOTIFICATION_TYPES.REVIEW_NEW,
      title: "New review",
      message: `${guestName} left a ${stars}-star review on "${title}".`,
      link: `/listings/${listing._id}#reviews`,
      listingId: listing._id,
      reviewId: review._id,
    });
  }

  await notifyUser({
    app,
    recipientId: guestUser._id,
    type: NOTIFICATION_TYPES.REVIEW_SUBMITTED,
    title: "Review published",
    message: `Your review for "${title}" is now live.`,
    link: `/listings/${listing._id}`,
    listingId: listing._id,
    reviewId: review._id,
  });
}

export async function notifyAfterReviewDeleted({
  app,
  listing,
  guestUser,
}) {
  const title = listingTitle(listing);
  const guestName = actorName(guestUser);
  const host = hostId(listing);

  if (host && !isSameUser(host, guestUser._id)) {
    await notifyUser({
      app,
      recipientId: host,
      type: NOTIFICATION_TYPES.REVIEW_REMOVED,
      title: "Review removed",
      message: `${guestName} removed their review on "${title}".`,
      link: `/listings/${listing._id}`,
      listingId: listing._id,
    });
  }

  await notifyUser({
    app,
    recipientId: guestUser._id,
    type: NOTIFICATION_TYPES.REVIEW_REMOVED,
    title: "Review deleted",
    message: `Your review on "${title}" was removed.`,
    link: `/listings/${listing._id}`,
    listingId: listing._id,
  });
}

// —— Listings (host actions → notify guests) ——

export async function notifyAfterListingCreated({ app, listing, hostUser }) {
  const title = listingTitle(listing);
  await notifyUser({
    app,
    recipientId: hostUser._id,
    type: NOTIFICATION_TYPES.LISTING_PUBLISHED,
    title: "Listing published",
    message: `"${title}" is now live on NullStay.`,
    link: `/listings/${listing._id}`,
    listingId: listing._id,
  });
}

export async function notifyAfterListingUpdated({ app, listing }) {
  const title = listingTitle(listing);
  const bookings = await Booking.find({
    listing: listing._id,
    status: { $in: [BOOKING_STATUSES.PENDING, BOOKING_STATUSES.CONFIRMED] },
  }).select("guest");

  const ids = guestIdsFromBookings(bookings);
  await Promise.all(
    ids.map((guestId) =>
      notifyUser({
        app,
        recipientId: guestId,
        type: NOTIFICATION_TYPES.LISTING_UPDATED,
        title: "Listing updated",
        message: `The host updated details for "${title}". Check your trip.`,
        link: `/listings/${listing._id}`,
        listingId: listing._id,
      }),
    ),
  );
}

export async function notifyAfterListingDeleted({ app, listing, bookings }) {
  const title = listingTitle(listing);
  const ids = guestIdsFromBookings(bookings);

  await Promise.all(
    ids.map((guestId) =>
      notifyUser({
        app,
        recipientId: guestId,
        type: NOTIFICATION_TYPES.LISTING_REMOVED,
        title: "Listing removed",
        message: `"${title}" was removed by the host. Related bookings are no longer active.`,
        link: "/bookings/trips",
        listingId: listing._id,
      }),
    ),
  );
}

// —— Booking: guest cancel confirmation ——

export async function notifyGuestBookingCancelled({
  app,
  booking,
  listing,
}) {
  const title = listing?.title || "your stay";
  await notifyUser({
    app,
    recipientId: booking.guest,
    type: NOTIFICATION_TYPES.BOOKING_CANCELLED_GUEST,
    title: "Trip cancelled",
    message: `You cancelled your booking for "${title}".`,
    link: "/bookings/trips",
    bookingId: booking._id,
    listingId: listing?._id,
  });
}

import { BOOKING_STATUSES } from "../models/booking.js";
import { NOTIFICATION_TYPES } from "../models/notification.js";
import { notifyUser } from "./notifyUser.js";

function hostId(listing) {
  return listing.owner?._id ?? listing.owner;
}

export async function notifyAfterBookingCreated({
  app,
  booking,
  listing,
  guestUser,
}) {
  const title = listing.title || "your listing";
  const guestName = guestUser?.username || "A guest";
  const link = `/bookings/${booking._id}`;
  const host = hostId(listing);

  if (booking.status === BOOKING_STATUSES.CONFIRMED) {
    await notifyUser({
      app,
      recipientId: booking.guest,
      type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
      title: "Stay confirmed",
      message: `Your booking at "${title}" is confirmed.`,
      link,
      bookingId: booking._id,
      listingId: listing._id,
    });
    if (host) {
      await notifyUser({
        app,
        recipientId: host,
        type: NOTIFICATION_TYPES.BOOKING_NEW,
        title: "New reservation",
        message: `${guestName} booked "${title}".`,
        link: "/bookings/host",
        bookingId: booking._id,
        listingId: listing._id,
      });
    }
    return;
  }

  await notifyUser({
    app,
    recipientId: booking.guest,
    type: NOTIFICATION_TYPES.BOOKING_REQUEST,
    title: "Request sent",
    message: `Your request to book "${title}" was sent to the host.`,
    link,
    bookingId: booking._id,
    listingId: listing._id,
  });

  if (host) {
    await notifyUser({
      app,
      recipientId: host,
      type: NOTIFICATION_TYPES.BOOKING_REQUEST,
      title: "New booking request",
      message: `${guestName} requested to book "${title}".`,
      link: "/bookings/host",
      bookingId: booking._id,
      listingId: listing._id,
    });
  }
}

export async function notifyAfterBookingAccepted({
  app,
  booking,
  listing,
}) {
  const title = listing?.title || "your stay";
  await notifyUser({
    app,
    recipientId: booking.guest,
    type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
    title: "Request accepted",
    message: `Your booking for "${title}" was accepted by the host.`,
    link: `/bookings/${booking._id}`,
    bookingId: booking._id,
    listingId: listing?._id,
  });
}

export async function notifyAfterBookingRejected({
  app,
  booking,
  listing,
}) {
  const title = listing?.title || "your stay";
  await notifyUser({
    app,
    recipientId: booking.guest,
    type: NOTIFICATION_TYPES.BOOKING_DECLINED,
    title: "Request declined",
    message: `Your booking request for "${title}" was declined.`,
    link: "/bookings/trips",
    bookingId: booking._id,
    listingId: listing?._id,
  });
}

export async function notifyAfterBookingCancelled({
  app,
  booking,
  listing,
  guestUser,
}) {
  const host = hostId(listing);
  if (!host) return;

  const guestName = guestUser?.username || "A guest";
  const title = listing?.title || "your listing";

  await notifyUser({
    app,
    recipientId: host,
    type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
    title: "Booking cancelled",
    message: `${guestName} cancelled their booking for "${title}".`,
    link: "/bookings/host",
    bookingId: booking._id,
    listingId: listing?._id,
  });
}

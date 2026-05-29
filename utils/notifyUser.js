import Notification from "../models/notification.js";
import { getIO } from "../config/socket.js";
import { sendWebPushToUser } from "./sendWebPush.js";
import {
  pruneExpiredNotificationData,
  recentNotificationFilter,
} from "./notificationRetention.js";

export function serializeNotification(doc) {
  const n = doc.toObject ? doc.toObject() : doc;
  return {
    _id: String(n._id),
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt,
    booking: n.booking ? String(n.booking) : null,
    listing: n.listing ? String(n.listing) : null,
    review: n.review ? String(n.review) : null,
  };
}

/**
 * Persist a notification and push it to the recipient over Socket.io.
 */
export async function notifyUser({
  app,
  recipientId,
  type,
  title,
  message,
  link = "/notifications",
  bookingId = null,
  listingId = null,
  reviewId = null,
}) {
  if (!recipientId) return null;

  const recipient = String(recipientId);

  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    link,
    booking: bookingId,
    listing: listingId,
    review: reviewId,
  });

  const payload = serializeNotification(notification);
  const io = app?.get?.("io") ?? getIO();
  if (io) {
    io.to(`user:${recipient}`).emit("notification", payload);
  }

  sendWebPushToUser(recipient, { title, message, link }).then((result) => {
    if (result.failed > 0 && result.sent === 0) {
      console.warn(
        `[push] No delivery for user ${recipient} (${result.failed} failed, 0 sent). Is the device subscribed?`,
      );
    }
  });

  pruneExpiredNotificationData().catch(() => {});

  return notification;
}

export async function getUnreadCount(userId) {
  return Notification.countDocuments(
    recentNotificationFilter({ recipient: userId, read: false }),
  );
}

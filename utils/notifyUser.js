import Notification from "../models/notification.js";
import { getIO } from "../config/socket.js";
import { sendWebPushToUser } from "./sendWebPush.js";

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
  });

  const payload = serializeNotification(notification);
  const io = app?.get?.("io") ?? getIO();
  if (io) {
    io.to(`user:${recipient}`).emit("notification", payload);
  }

  sendWebPushToUser(recipient, {
    title,
    message,
    link,
  }).catch((err) => {
    console.error("Web push failed:", err.message);
  });

  return notification;
}

export async function getUnreadCount(userId) {
  return Notification.countDocuments({ recipient: userId, read: false });
}

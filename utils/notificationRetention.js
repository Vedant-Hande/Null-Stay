import Notification from "../models/notification.js";
import PushSubscription from "../models/pushSubscription.js";

/** How long inbox + push device records are kept */
export const RETENTION_HOURS = 12;
export const RETENTION_MS = RETENTION_HOURS * 60 * 60 * 1000;
export const RETENTION_SECONDS = RETENTION_HOURS * 60 * 60;

export function sinceRetention() {
  return new Date(Date.now() - RETENTION_MS);
}

/** Mongo filter: notifications from the last 12 hours */
export function recentNotificationFilter(extra = {}) {
  return {
    ...extra,
    createdAt: { $gte: sinceRetention() },
  };
}

/** Mongo filter: push devices active in the last 12 hours */
export function recentPushSubscriptionFilter(extra = {}) {
  return {
    ...extra,
    updatedAt: { $gte: sinceRetention() },
  };
}

export async function pruneExpiredNotificationData() {
  const since = sinceRetention();
  const [notifResult, pushResult] = await Promise.all([
    Notification.deleteMany({ createdAt: { $lt: since } }),
    PushSubscription.deleteMany({ updatedAt: { $lt: since } }),
  ]);
  return {
    notificationsDeleted: notifResult.deletedCount,
    pushSubscriptionsDeleted: pushResult.deletedCount,
  };
}

export async function ensureRetentionIndexes() {
  const ttl = { expireAfterSeconds: RETENTION_SECONDS };
  try {
    await Notification.collection.createIndex({ createdAt: 1 }, ttl);
  } catch {
    /* index may already exist */
  }
  try {
    await PushSubscription.collection.createIndex({ updatedAt: 1 }, ttl);
  } catch {
    /* index may already exist */
  }
}

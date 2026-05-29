import PushSubscription from "../models/pushSubscription.js";
import { getWebPushClient, isWebPushConfigured } from "../config/webPush.js";
import { recentPushSubscriptionFilter } from "./notificationRetention.js";

export async function sendWebPushToUser(userId, { title, message, link }) {
  if (!isWebPushConfigured()) {
    return { sent: 0, failed: 0, skipped: "not_configured" };
  }

  const webpush = getWebPushClient();
  if (!webpush) {
    return { sent: 0, failed: 0, skipped: "client_unavailable" };
  }

  const subscriptions = await PushSubscription.find(
    recentPushSubscriptionFilter({ user: userId }),
  );

  if (!subscriptions.length) {
    return { sent: 0, failed: 0, skipped: "no_subscriptions" };
  }

  const payload = JSON.stringify({
    title: title || "NullStay",
    body: message || "",
    url: link || "/notifications",
    icon: "/img/nullstay-notification.svg",
  });

  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (doc) => {
      try {
        await webpush.sendNotification(
          { endpoint: doc.endpoint, keys: doc.keys },
          payload,
        );
        doc.updatedAt = new Date();
        await doc.save();
        sent += 1;
      } catch (err) {
        failed += 1;
        const code = err.statusCode;
        if (code === 404 || code === 410) {
          await PushSubscription.deleteOne({ _id: doc._id });
        } else {
          console.error(
            `[web-push] ${code || "error"}:`,
            err.body || err.message,
          );
        }
      }
    }),
  );

  return { sent, failed };
}

import PushSubscription from "../models/pushSubscription.js";
import { getWebPushClient, isWebPushConfigured } from "../config/webPush.js";

export async function sendWebPushToUser(userId, { title, message, link }) {
  if (!isWebPushConfigured()) return { sent: 0, failed: 0 };

  const webpush = getWebPushClient();
  if (!webpush) return { sent: 0, failed: 0 };

  const subscriptions = await PushSubscription.find({ user: userId });
  if (!subscriptions.length) return { sent: 0, failed: 0 };

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
      const subscription = {
        endpoint: doc.endpoint,
        keys: doc.keys,
      };

      try {
        await webpush.sendNotification(subscription, payload);
        sent += 1;
      } catch (err) {
        failed += 1;
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: doc._id });
        }
      }
    }),
  );

  return { sent, failed };
}

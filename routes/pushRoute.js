import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";
import PushSubscription from "../models/pushSubscription.js";
import {
  getVapidPublicKey,
  isWebPushConfigured,
} from "../config/webPush.js";
import { pruneExpiredNotificationData } from "../utils/notificationRetention.js";
import { sendWebPushToUser } from "../utils/sendWebPush.js";

const router = express.Router();

router.get("/config", (req, res) => {
  res.json({
    enabled: isWebPushConfigured(),
    publicKey: getVapidPublicKey(),
  });
});

router.post(
  "/subscribe",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    if (!isWebPushConfigured()) {
      return res.status(503).json({
        error: "Push notifications are not configured on this server.",
      });
    }

    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: "Invalid subscription." });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: req.user._id,
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
      },
      { upsert: true, new: true, timestamps: true },
    );

    await pruneExpiredNotificationData();

    res.json({ ok: true });
  }),
);

router.post(
  "/test",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    if (!isWebPushConfigured()) {
      return res.status(503).json({ error: "Web Push is not configured." });
    }

    const result = await sendWebPushToUser(req.user._id, {
      title: "NullStay test",
      message: "Push notifications are working.",
      link: "/notifications",
    });

    if (result.skipped === "no_subscriptions") {
      return res.status(400).json({
        error: "No active push subscription. Click Turn on and Allow in the browser.",
      });
    }

    res.json({ ok: true, ...result });
  }),
);

router.post(
  "/unsubscribe",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { endpoint } = req.body || {};
    if (endpoint) {
      await PushSubscription.deleteOne({
        endpoint,
        user: req.user._id,
      });
    }
    res.json({ ok: true });
  }),
);

export default router;

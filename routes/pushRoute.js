import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";
import PushSubscription from "../models/pushSubscription.js";
import {
  getVapidPublicKey,
  isWebPushConfigured,
} from "../config/webPush.js";

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
      { upsert: true, new: true },
    );

    res.json({ ok: true });
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

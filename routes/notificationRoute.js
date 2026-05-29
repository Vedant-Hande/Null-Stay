import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";
import Notification from "../models/notification.js";
import { getUnreadCount, serializeNotification } from "../utils/notifyUser.js";

const router = express.Router();

router.get(
  "/",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.render("notifications/index.ejs", { notifications });
  }),
);

router.get(
  "/unread-count",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const count = await getUnreadCount(req.user._id);
    res.json({ count });
  }),
);

router.get(
  "/recent",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 8, 20);
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      notifications: notifications.map(serializeNotification),
    });
  }),
);

router.patch(
  "/:id/read",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    const count = await getUnreadCount(req.user._id);
    res.json({ ok: true, count });
  }),
);

router.patch(
  "/read-all",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true },
    );
    res.json({ ok: true, count: 0 });
  }),
);

export default router;

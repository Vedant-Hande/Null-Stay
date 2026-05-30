import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";
import Message from "../models/message.js";
import User from "../models/user.js";
import listings from "../models/listing.js";
import { FLASH_KEYS } from "../utils/constants.js";
import { getIO } from "../config/socket.js";
import { sendNewMessageEmail } from "../utils/messageEmails.js";
import { assignSeo, buildPrivatePageSeo } from "../utils/seo.js";

const router = express.Router();

function threadKey(a, b, listingId) {
  const users = [String(a), String(b)].sort();
  return `${users[0]}:${users[1]}:${listingId || "general"}`;
}

async function buildInbox(userId) {
  const messages = await Message.find({
    $or: [{ sender: userId }, { recipient: userId }],
  })
    .populate("sender", "username email")
    .populate("recipient", "username email")
    .populate("listing", "title image")
    .sort({ createdAt: -1 });

  const map = new Map();
  for (const msg of messages) {
    const other =
      String(msg.sender._id) === String(userId) ? msg.recipient : msg.sender;
    if (!other) continue;
    const key = threadKey(userId, other._id, msg.listing?._id);
    if (!map.has(key)) {
      map.set(key, {
        other,
        listing: msg.listing,
        lastMessage: msg,
        unread: 0,
      });
    }
    if (
      String(msg.recipient._id) === String(userId) &&
      !msg.readAt
    ) {
      map.get(key).unread += 1;
    }
  }
  return [...map.values()];
}

router.get(
  "/",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const threads = await buildInbox(req.user._id);
    assignSeo(res, buildPrivatePageSeo("Messages"));
    res.render("messages/index.ejs", { threads });
  }),
);

router.get(
  "/:recipientId/:listingId",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { recipientId, listingId } = req.params;
    const other = await User.findById(recipientId).select("username email");
    const listing = await listings.findById(listingId).select("title image owner");

    if (!other) {
      req.flash(FLASH_KEYS.ERROR, "User not found.");
      return res.redirect("/messages");
    }

    const messages = await Message.find({
      listing: listingId,
      $or: [
        { sender: req.user._id, recipient: recipientId },
        { sender: recipientId, recipient: req.user._id },
      ],
    })
      .populate("sender", "username")
      .sort({ createdAt: 1 });

    await Message.updateMany(
      {
        listing: listingId,
        sender: recipientId,
        recipient: req.user._id,
        readAt: null,
      },
      { readAt: new Date() },
    );

    assignSeo(res, buildPrivatePageSeo("Message thread"));
    res.render("messages/show.ejs", {
      other,
      listing,
      messages,
      recipientId,
      listingId,
    });
  }),
);

router.post(
  "/:recipientId/:listingId",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { recipientId, listingId } = req.params;
    const body = String(req.body.body || "").trim();

    if (!body) {
      req.flash(FLASH_KEYS.ERROR, "Message cannot be empty.");
      return res.redirect(`/messages/${recipientId}/${listingId}`);
    }

    if (String(recipientId) === String(req.user._id)) {
      req.flash(FLASH_KEYS.ERROR, "You cannot message yourself.");
      return res.redirect("/messages");
    }

    const recipient = await User.findById(recipientId);
    const listing = await listings.findById(listingId);
    if (!recipient || !listing) {
      req.flash(FLASH_KEYS.ERROR, "Conversation not found.");
      return res.redirect("/messages");
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      listing: listingId,
      body,
    });

    const io = getIO();
    if (io) {
      io.to(`user:${recipientId}`).emit("new_message", {
        from: req.user._id,
        listingId,
        body: body.slice(0, 120),
      });
    }

    sendNewMessageEmail({
      recipient,
      sender: req.user,
      listing,
      preview: body.slice(0, 200),
    });

    if (req.headers.accept?.includes("application/json")) {
      return res.json({ ok: true, messageId: message._id });
    }

    res.redirect(`/messages/${recipientId}/${listingId}`);
  }),
);

export default router;

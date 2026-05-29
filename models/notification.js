import mongoose from "mongoose";

export const NOTIFICATION_TYPES = {
  BOOKING_REQUEST: "booking_request",
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_DECLINED: "booking_declined",
  BOOKING_CANCELLED: "booking_cancelled",
  BOOKING_CANCELLED_GUEST: "booking_cancelled_guest",
  BOOKING_NEW: "booking_new",
  REVIEW_NEW: "review_new",
  REVIEW_SUBMITTED: "review_submitted",
  REVIEW_REMOVED: "review_removed",
  LISTING_PUBLISHED: "listing_published",
  LISTING_UPDATED: "listing_updated",
  LISTING_REMOVED: "listing_removed",
};

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    link: {
      type: String,
      default: "/notifications",
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;

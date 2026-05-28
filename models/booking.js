import mongoose from "mongoose";

const { Schema } = mongoose;

export const BOOKING_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
};

const bookingSchema = new Schema(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },
    guest: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    guests: {
      type: Number,
      required: true,
      min: 1,
    },
    nights: {
      type: Number,
      required: true,
      min: 1,
    },
    nightlyRate: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    cleaningFee: {
      type: Number,
      required: true,
      default: 0,
    },
    serviceFee: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUSES),
      default: BOOKING_STATUSES.PENDING,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    confirmationCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

bookingSchema.index({ listing: 1, checkIn: 1, checkOut: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;

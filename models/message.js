import mongoose from "mongoose";

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      index: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

messageSchema.index({ sender: 1, recipient: 1, listing: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);

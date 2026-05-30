import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// This explicitly points to the .env file one folder up from /config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import {
  ensureRetentionIndexes,
  pruneExpiredNotificationData,
} from "../utils/notificationRetention.js";
import { pruneOldCancelledBookings } from "../utils/bookingRetention.js";
import { createLogger } from "./logger.js";

const dbLog = createLogger("db");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    dbLog.info("Connected", { url: process.env.DB_URL?.replace(/\/\/.*@/, "//***@") });

    try {
      await ensureRetentionIndexes();
      const pruned = await pruneExpiredNotificationData();
      if (pruned.notificationsDeleted || pruned.pushSubscriptionsDeleted) {
        dbLog.info("Notification retention pruned", pruned);
      }
      const bookingPruned = await pruneOldCancelledBookings();
      if (bookingPruned.bookingsDeleted) {
        dbLog.info("Booking retention pruned", bookingPruned);
      }
    } catch (retentionErr) {
      dbLog.warn("Retention index setup failed", { message: retentionErr.message });
    }
  } catch (err) {
    dbLog.error("Connection failed", err);
  }
};
export default connectDB;



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

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("DB connected");

    try {
      await ensureRetentionIndexes();
      const pruned = await pruneExpiredNotificationData();
      if (pruned.notificationsDeleted || pruned.pushSubscriptionsDeleted) {
        console.log(
          `Notification retention: pruned ${pruned.notificationsDeleted} notifications, ${pruned.pushSubscriptionsDeleted} push subscriptions (older than 12h)`,
        );
      }
    } catch (retentionErr) {
      console.warn("Retention index setup:", retentionErr.message);
    }
  } catch (err) {
    console.log("DB connection failed", err);
  }
};
export default connectDB;



import os from "os";
import v8 from "v8";

import Listing from "../models/listing.js";
import Review from "../models/review.js";
import { isMailConfigured } from "../config/mail.js";
import { isRazorpayConfigured, getRazorpayModeLabel } from "../config/razorpay.js";
import { isWebPushConfigured } from "../config/webPush.js";
import cache, { isCacheEnabled } from "../config/cache.js";

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function mb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

/**
 * Runtime health metrics for the dev dashboard (same data as former /status).
 */
export async function getDevServerStats() {
  const mem = process.memoryUsage();
  const heapStats = v8.getHeapStatistics();

  let dbStatus = "Disconnected";
  let listingsCount = 0;
  let reviewsCount = 0;
  let collectionsCount = 0;

  try {
    const { default: mongoose } = await import("mongoose");
    const dbStatusMap = {
      0: "Disconnected",
      1: "Connected",
      2: "Connecting",
      3: "Disconnecting",
    };
    dbStatus = dbStatusMap[mongoose.connection.readyState] || "Unknown";

    if (mongoose.connection.readyState === 1) {
      listingsCount = await Listing.countDocuments();
      reviewsCount = await Review.countDocuments();
      collectionsCount = Object.keys(mongoose.connection.collections).length;
    }
  } catch {
    dbStatus = "Error";
  }

  const cacheStats = isCacheEnabled ? cache.stats() : null;

  return {
    appUptime: formatUptime(process.uptime()),
    heapUsed: mb(mem.heapUsed),
    heapTotal: mb(mem.heapTotal),
    heapPercent: ((mem.heapUsed / mem.heapTotal) * 100).toFixed(1),
    rss: mb(mem.rss),
    heapSizeLimit: mb(heapStats.heap_size_limit),
    activeHandles: process._getActiveHandles
      ? process._getActiveHandles().length
      : "N/A",
    activeRequests: process._getActiveRequests
      ? process._getActiveRequests().length
      : "N/A",
    nodeVersion: process.version,
    pid: process.pid,
    env: process.env.NODE_ENV || "development",
    port: process.env.CONN_PORT || "8080",
    dbStatus,
    dbOk: dbStatus === "Connected",
    listingsCount,
    reviewsCount,
    collectionsCount,
    loadAvg: os.loadavg().map((n) => n.toFixed(2)).join(", ") || "N/A",
    serverTime: new Date().toLocaleString(),
    integrations: {
      webPush: isWebPushConfigured(),
      email: isMailConfigured(),
      razorpay: isRazorpayConfigured(),
      razorpayMode: isRazorpayConfigured() ? getRazorpayModeLabel() : null,
      cache: isCacheEnabled,
      cacheKeys: cacheStats ? `${cacheStats.size}/${cacheStats.maxEntries}` : null,
      cacheTtl: process.env.CACHE_TTL_SECONDS || "60",
    },
  };
}

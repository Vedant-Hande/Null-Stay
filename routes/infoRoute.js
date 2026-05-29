import express from "express";
import os from "os";
import v8 from "v8";
import Listing from "../models/listing.js";
import Review from "../models/review.js";

const router = express.Router();

router.get("/help", (req, res) => {
  res.render("info/help.ejs", { pageTitle: "Help Centre", landingActive: "help" });
});

router.get("/terms", (req, res) => {
  res.render("info/static.ejs", {
    pageTitle: "Terms of Service",
    title: "Terms of Service",
    pageKey: "terms",
  });
});

router.get("/privacy", (req, res) => {
  res.render("info/static.ejs", {
    pageTitle: "Privacy Policy",
    title: "Privacy Policy",
    pageKey: "privacy",
  });
});

router.get("/sitemap", (req, res) => {
  res.render("info/static.ejs", {
    pageTitle: "Sitemap",
    title: "Sitemap",
    pageKey: "sitemap",
  });
});

router.get("/privacy-choices", (req, res) => {
  res.render("info/static.ejs", {
    pageTitle: "Your Privacy Choices",
    title: "Your Privacy Choices",
    pageKey: "privacy-choices",
  });
});

router.get("/careers", (req, res) => {
  res.render("info/static.ejs", {
    pageTitle: "Careers",
    title: "Careers",
    pageKey: "careers",
  });
});

router.get("/hosting", (req, res) => {
  res.render("info/hosting.ejs", { pageTitle: "Hosting", landingActive: "host" });
});

router.get("/status", async (req, res) => {
  const processUptimeSeconds = process.uptime();
  const appHours = Math.floor(processUptimeSeconds / 3600);
  const appMinutes = Math.floor((processUptimeSeconds % 3600) / 60);
  const appSeconds = Math.floor(processUptimeSeconds % 60);
  const formattedAppUptime = `${appHours}h ${appMinutes}m ${appSeconds}s`;

  const memUsage = process.memoryUsage();
  const heapUsed = (memUsage.heapUsed / (1024 * 1024)).toFixed(2) + " MB";
  const heapTotal = (memUsage.heapTotal / (1024 * 1024)).toFixed(2) + " MB";
  const rss = (memUsage.rss / (1024 * 1024)).toFixed(2) + " MB";
  const heapPercent = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1);

  const heapStats = v8.getHeapStatistics();
  const totalAvailableSize =
    (heapStats.total_available_size / (1024 * 1024)).toFixed(2) + " MB";
  const heapSizeLimit = (heapStats.heap_size_limit / (1024 * 1024)).toFixed(2) + " MB";

  const activeHandles = process._getActiveHandles
    ? process._getActiveHandles().length
    : "N/A";
  const activeRequests = process._getActiveRequests
    ? process._getActiveRequests().length
    : "N/A";

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
    dbStatus = "Error Connecting";
  }

  const loadAvg = os.loadavg();
  const formattedLoad = loadAvg.map((load) => load.toFixed(2)).join(", ") || "N/A";

  const serverStats = {
    appUptime: formattedAppUptime,
    heapUsed,
    heapTotal,
    rss,
    heapPercent,
    totalAvailableSize,
    heapSizeLimit,
    activeHandles,
    activeRequests,
    nodeVersion: process.version,
    pid: process.pid,
    env: process.env.NODE_ENV || "development",
    port: process.env.CONN_PORT || "Default",
    dbStatus,
    listingsCount,
    reviewsCount,
    collectionsCount,
    loadAvg: formattedLoad,
    serverTime: new Date().toLocaleString(),
  };

  res.render("info/status.ejs", { pageTitle: "System Status", stats: serverStats });
});

export default router;

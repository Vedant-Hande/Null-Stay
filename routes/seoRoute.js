import express from "express";
import listings from "../models/listing.js";
import wrapAsync from "../utils/wrapAsync.js";
import { getSiteUrl } from "../utils/seo.js";

const router = express.Router();

const STATIC_SITEMAP_PATHS = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/listings", priority: "0.9", changefreq: "daily" },
  { path: "/help", priority: "0.5", changefreq: "monthly" },
  { path: "/contact", priority: "0.5", changefreq: "monthly" },
  { path: "/hosting", priority: "0.6", changefreq: "monthly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy-choices", priority: "0.3", changefreq: "yearly" },
  { path: "/careers", priority: "0.4", changefreq: "monthly" },
  { path: "/sitemap", priority: "0.2", changefreq: "monthly" },
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatLastmod(date) {
  if (!date) return new Date().toISOString().slice(0, 10);
  return new Date(date).toISOString().slice(0, 10);
}

router.get("/robots.txt", (req, res) => {
  const base = getSiteUrl();
  const lines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /dev",
    "Disallow: /dev/",
    "Disallow: /login",
    "Disallow: /signup",
    "Disallow: /bookings",
    "Disallow: /messages",
    "Disallow: /notifications",
    "Disallow: /push",
    "Disallow: /user/",
    "Disallow: /users/",
    "Disallow: /wishlists",
    "Disallow: /listings/new",
    "",
    `Sitemap: ${base}/sitemap.xml`,
  ];
  res.type("text/plain").send(lines.join("\n"));
});

router.get(
  "/sitemap.xml",
  wrapAsync(async (req, res) => {
    const base = getSiteUrl();
    const listingDocs = await listings
      .find({})
      .select("_id updatedAt createdAt")
      .sort({ updatedAt: -1 })
      .lean();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const entry of STATIC_SITEMAP_PATHS) {
      xml += "  <url>\n";
      xml += `    <loc>${escapeXml(`${base}${entry.path}`)}</loc>\n`;
      xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
      xml += `    <priority>${entry.priority}</priority>\n`;
      xml += "  </url>\n";
    }

    for (const listing of listingDocs) {
      const lastmod = formatLastmod(listing.updatedAt || listing.createdAt);
      xml += "  <url>\n";
      xml += `    <loc>${escapeXml(`${base}/listings/${listing._id}`)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += "    <changefreq>weekly</changefreq>\n";
      xml += "    <priority>0.8</priority>\n";
      xml += "  </url>\n";
    }

    xml += "</urlset>";

    res.type("application/xml").send(xml);
  }),
);

export default router;

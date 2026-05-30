import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { requireDevAccess } from "../middleware/devMiddleware.js";
import { isDevAccessConfigured } from "../config/devAccess.js";
import wrapAsync from "../utils/wrapAsync.js";
import { countProjectLoc } from "../utils/countLoc.js";
import { getDevServerStats } from "../utils/devServerStats.js";
import {
  getDevDownloadTargets,
  resolveDevDownloadTarget,
  streamDevFolderZip,
} from "../utils/devFolderDownload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

const router = express.Router();

function devKeyParam(req) {
  return req.query.key ? `?key=${encodeURIComponent(req.query.key)}` : "";
}

router.use(requireDevAccess);

router.get(
  "/",
  wrapAsync(async (req, res) => {
    const [loc, server, downloads] = await Promise.all([
      countProjectLoc(projectRoot),
      getDevServerStats(),
      getDevDownloadTargets(projectRoot),
    ]);

    const format = req.query.format
      ? String(req.query.format).toLowerCase()
      : req.accepts(["html", "json"]) === "html"
        ? "html"
        : "json";

    if (format === "json") {
      return res.json({
        generatedAt: new Date().toISOString(),
        loc,
        server,
        downloads,
      });
    }

    res.render("dev/dashboard.ejs", {
      pageTitle: "Developer dashboard",
      loc,
      server,
      downloads,
      keyParam: devKeyParam(req),
      layout: false,
    });
  }),
);

router.get(
  "/download/:target",
  wrapAsync(async (req, res) => {
    const target = await resolveDevDownloadTarget(
      projectRoot,
      String(req.params.target),
    );

    if (!target) {
      return res.status(404).render("listings/error.ejs", {
        message: "Page not found",
        statusCode: 404,
      });
    }

    await streamDevFolderZip(res, projectRoot, target);
  }),
);

/** Legacy URLs → unified dashboard */
router.get("/loc", (req, res) => {
  res.redirect(301, `/dev${devKeyParam(req)}`);
});

router.get("/status", (req, res) => {
  res.redirect(301, `/dev${devKeyParam(req)}`);
});

export default router;

export { isDevAccessConfigured };

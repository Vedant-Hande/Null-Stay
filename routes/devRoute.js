import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { requireDevAccess } from "../middleware/devMiddleware.js";
import { isDevAccessConfigured } from "../config/devAccess.js";
import wrapAsync from "../utils/wrapAsync.js";
import { countProjectLoc } from "../utils/countLoc.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

const router = express.Router();

router.use(requireDevAccess);

router.get(
  "/loc",
  wrapAsync(async (req, res) => {
    const stats = await countProjectLoc(projectRoot);
    const format = String(req.query.format || "json").toLowerCase();

    if (format === "html") {
      const keyParam = req.query.key ? `?key=${encodeURIComponent(req.query.key)}` : "";
      return res.render("dev/loc.ejs", {
        pageTitle: "Developer — Lines of code",
        stats,
        keyParam,
        layout: false,
      });
    }

    res.json(stats);
  }),
);

export default router;

export { isDevAccessConfigured };

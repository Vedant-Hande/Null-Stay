import { createLogger, isRequestLoggingEnabled } from "../config/logger.js";

const httpLog = createLogger("http");

const SKIP_PREFIXES = [
  "/css/",
  "/js/",
  "/img/",
  "/socket.io/",
  "/favicon.ico",
];

function shouldSkipLog(req) {
  const url = req.originalUrl || req.url || "";
  if (req.method === "GET" && SKIP_PREFIXES.some((p) => url.startsWith(p))) {
    return true;
  }
  return false;
}

/**
 * Log HTTP requests when finished (status + duration).
 * Set LOG_HTTP=false to disable.
 */
export function requestLogger(req, res, next) {
  if (!isRequestLoggingEnabled() || shouldSkipLog(req)) {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const status = res.statusCode;
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "http";

    httpLog[level](`${req.method} ${req.originalUrl}`, {
      status,
      ms: Math.round(ms),
      ip: req.ip,
      user: req.user?._id?.toString(),
    });
  });

  next();
}

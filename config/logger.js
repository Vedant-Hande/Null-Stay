import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "logs");

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const LEVEL_STYLES = {
  error: "\x1b[31m",
  warn: "\x1b[33m",
  info: "\x1b[36m",
  http: "\x1b[35m",
  debug: "\x1b[90m",
  reset: "\x1b[0m",
};

function resolveLogLevel() {
  const raw = String(process.env.LOG_LEVEL || "info").toLowerCase();
  return LEVELS[raw] !== undefined ? raw : "info";
}

function isFileLoggingEnabled() {
  if (process.env.LOG_TO_FILE === "false") return false;
  if (process.env.LOG_TO_FILE === "true") return true;
  return process.env.NODE_ENV === "production";
}

function isHttpLoggingEnabled() {
  return process.env.LOG_HTTP !== "false";
}

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

// ── three file paths ───────────────────────────────────────────────────────
function logFilePath(type) {
  const day = new Date().toISOString().slice(0, 10);
  const names = {
    error: `error-${day}.log`, // errors only
    access: `access-${day}.log`, // HTTP requests only
    app: `app-${day}.log`, // info / warn / debug
  };
  return path.join(LOG_DIR, names[type]);
}

function fileTypeForLevel(level) {
  if (level === "error") return "error";
  if (level === "http") return "access";
  return "app";
}
// ──────────────────────────────────────────────────────────────────────────

function shouldLog(level) {
  return LEVELS[level] <= LEVELS[resolveLogLevel()];
}

function serializeMeta(meta) {
  if (meta === undefined || meta === null) return undefined;
  if (meta instanceof Error) {
    return { name: meta.name, message: meta.message, stack: meta.stack };
  }
  if (typeof meta === "object") {
    try {
      return JSON.parse(JSON.stringify(meta));
    } catch {
      return String(meta);
    }
  }
  return meta;
}

function writeToFile(payload) {
  if (!isFileLoggingEnabled()) return;
  if (payload.level === "http" && !isHttpLoggingEnabled()) return;

  // ── only write error and http to file; skip info/warn/debug ──
  if (!["error", "http"].includes(payload.level)) return;

  try {
    ensureLogDir();
    const file = logFilePath(fileTypeForLevel(payload.level));
    fs.appendFileSync(file, `${JSON.stringify(payload)}\n`, "utf8");
  } catch (err) {
    process.stderr.write(`[logger] file write failed: ${err.message}\n`);
  }
}

function writeToConsole(level, module, message, meta) {
  if (level !== "error") return; // ← add this

  const timestamp = new Date().toISOString();
  const tag = module ? `[${module}]` : "";
  const style = LEVEL_STYLES[level] || "";
  const reset = LEVEL_STYLES.reset;
  const metaStr =
    meta !== undefined
      ? ` ${typeof meta === "string" ? meta : JSON.stringify(serializeMeta(meta))}`
      : "";

  const line = `${timestamp} ${level.toUpperCase()} ${tag} ${message}${metaStr}`;
  process.stderr.write(`${style}${line}${reset}\n`);
}

function log(level, module, message, meta) {
  if (!shouldLog(level)) return;

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    module: module || "app",
    message,
    ...(meta !== undefined ? { meta: serializeMeta(meta) } : {}),
  };

  writeToConsole(level, module, message, meta); // ← re-enabled
  writeToFile(payload);
}

export function createLogger(module) {
  return {
    error: (message, meta) => log("error", module, message, meta),
    warn: (message, meta) => log("warn", module, message, meta),
    info: (message, meta) => log("info", module, message, meta),
    http: (message, meta) => log("http", module, message, meta),
    debug: (message, meta) => log("debug", module, message, meta),
  };
}

export const logger = createLogger("app");

export function logStartup(lines) {
  lines.forEach((line) => logger.info(line));
}

export function isRequestLoggingEnabled() {
  return isHttpLoggingEnabled();
}

export function registerProcessHandlers() {
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", err);
  });
  process.on("unhandledRejection", (reason) => {
    logger.error(
      "Unhandled promise rejection",
      reason instanceof Error ? reason : { reason: String(reason) },
    );
  });
}

// ── Log cleanup ────────────────────────────────────────────────────────────
const LOG_MAX_AGE_MS =
  process.env.NODE_ENV === "production"
    ? 24 * 60 * 60 * 1000 // 24 hrs in production
    : 2 * 60 * 60 * 1000; //  2 hrs in development

function deleteOldLogs() {
  if (!fs.existsSync(LOG_DIR)) return;

  const now = Date.now();
  let deleted = 0;

  try {
    const files = fs.readdirSync(LOG_DIR).filter((f) => f.endsWith(".log"));

    for (const file of files) {
      const filePath = path.join(LOG_DIR, file);
      try {
        const { mtimeMs } = fs.statSync(filePath);
        if (now - mtimeMs > LOG_MAX_AGE_MS) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      } catch (err) {
        process.stderr.write(
          `[logger] could not delete ${file}: ${err.message}\n`,
        );
      }
    }

    if (deleted > 0) {
      logger.info(
        `Log cleanup: removed ${deleted} file(s) older than ${LOG_MAX_AGE_MS / 3_600_000}h`,
      );
    }
  } catch (err) {
    process.stderr.write(`[logger] cleanup scan failed: ${err.message}\n`);
  }
}

export function scheduleLogCleanup() {
  deleteOldLogs(); // run once on startup
  setInterval(deleteOldLogs, LOG_MAX_AGE_MS); // then repeat on the same interval
  logger.info(
    `Log cleanup scheduled every ${LOG_MAX_AGE_MS / 3_600_000}h ` +
      `(${process.env.NODE_ENV === "production" ? "production" : "development"})`,
  );
}
// ──────────────────────────────────────────────────────────────────────────

export { LOG_DIR, resolveLogLevel, isFileLoggingEnabled };

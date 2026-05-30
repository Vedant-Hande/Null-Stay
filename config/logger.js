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

function logFilePath() {
  const day = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `app-${day}.log`);
}

function shouldLog(level) {
  return LEVELS[level] <= LEVELS[resolveLogLevel()];
}

function serializeMeta(meta) {
  if (meta === undefined || meta === null) return undefined;
  if (meta instanceof Error) {
    return {
      name: meta.name,
      message: meta.message,
      stack: meta.stack,
    };
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
  try {
    ensureLogDir();
    fs.appendFileSync(logFilePath(), `${JSON.stringify(payload)}\n`, "utf8");
  } catch (err) {
    process.stderr.write(`[logger] file write failed: ${err.message}\n`);
  }
}

function writeToConsole(level, module, message, meta) {
  const ts = new Date().toISOString();
  const tag = module ? `[${module}]` : "";
  const style = LEVEL_STYLES[level] || "";
  const reset = LEVEL_STYLES.reset;
  const metaStr =
    meta !== undefined
      ? ` ${typeof meta === "string" ? meta : JSON.stringify(serializeMeta(meta))}`
      : "";

  const line = `${ts} ${level.toUpperCase()} ${tag} ${message}${metaStr}`;

  if (level === "error") {
    process.stderr.write(`${style}${line}${reset}\n`);
  } else {
    process.stdout.write(`${style}${line}${reset}\n`);
  }
}

function log(level, module, message, meta) {
  if (!shouldLog(level)) return;

  const payload = {
    ts: new Date().toISOString(),
    level,
    module: module || "app",
    message,
    ...(meta !== undefined ? { meta: serializeMeta(meta) } : {}),
  };

  writeToConsole(level, module, message, meta);
  writeToFile(payload);
}

/**
 * Create a namespaced logger (e.g. mail, http, db).
 * @param {string} module
 */
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

export { LOG_DIR, resolveLogLevel, isFileLoggingEnabled };

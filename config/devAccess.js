import crypto from "crypto";

const DEV_ACCESS_KEY = process.env.DEV_ACCESS_KEY?.trim() || "";

export function isDevAccessConfigured() {
  return DEV_ACCESS_KEY.length >= 16;
}

export function verifyDevAccessKey(candidate) {
  if (!isDevAccessConfigured() || typeof candidate !== "string") {
    return false;
  }
  const a = Buffer.from(DEV_ACCESS_KEY);
  const b = Buffer.from(candidate);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function getDevKeyFromRequest(req) {
  const header = req.get("x-dev-access-key");
  if (header) return header;
  if (req.query?.key) return String(req.query.key);
  return null;
}

import webpush from "web-push";

let configured = false;

export function isWebPushConfigured() {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_CONTACT_EMAIL,
  );
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || "";
}

export function initWebPush() {
  if (!isWebPushConfigured()) {
    return false;
  }

  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );

  configured = true;
  return true;
}

export function getWebPushClient() {
  if (!configured && !initWebPush()) {
    return null;
  }
  return webpush;
}

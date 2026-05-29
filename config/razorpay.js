import Razorpay from "razorpay";

let razorpayClient = null;

export function isRazorpayConfigured() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
  );
}

export function isRazorpayLiveMode() {
  return process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live_") ?? false;
}

export function getRazorpayModeLabel() {
  if (!isRazorpayConfigured()) return "disabled";
  return isRazorpayLiveMode() ? "live" : "test";
}

export function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID || "";
}

export function getRazorpayCurrency() {
  return (process.env.RAZORPAY_CURRENCY || "INR").toUpperCase();
}

/** Convert rupee total to paise (Razorpay smallest unit for INR) */
export function toRazorpayAmount(majorUnitTotal) {
  return Math.round(Number(majorUnitTotal) * 100);
}

export function getRazorpay() {
  if (!isRazorpayConfigured()) {
    return null;
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
}

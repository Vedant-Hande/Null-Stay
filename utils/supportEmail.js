import { sendMail, isMailConfigured } from "../config/mail.js";
import { createLogger } from "../config/logger.js";

const supportLog = createLogger("support");

const TOPIC_LABELS = {
  general: "General question",
  booking: "Booking & trips",
  payment: "Payments & refunds",
  hosting: "Hosting & listings",
  account: "Account & login",
  other: "Other",
};

const TOPIC_DEFAULT_SUBJECTS = {
  general: "General question",
  booking: "Help with my booking",
  payment: "Payment or refund issue",
  hosting: "Hosting / listing question",
  account: "Account or login help",
  other: "Support request",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getSupportInbox() {
  return process.env.SUPPORT_EMAIL || process.env.SMTP_USER || null;
}

export function getSupportInboxDisplay() {
  return getSupportInbox() || "support@nullstay.com";
}

export function buildSupportSubject(payload) {
  const custom = payload.subject?.trim();
  if (custom) return custom;
  const base =
    TOPIC_DEFAULT_SUBJECTS[payload.topic] ||
    TOPIC_LABELS[payload.topic] ||
    "Support request";
  return `${base} — NullStay`;
}

function supportEmailBody(payload, { subjectLine }) {
  const { name, email, topic, message, bookingRef } = payload;
  const topicLabel = TOPIC_LABELS[topic] || topic;
  const refLine = bookingRef
    ? `<p style="color:#484848;margin:0 0 12px"><strong>Reference:</strong> ${escapeHtml(bookingRef)}</p>`
    : "";

  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <p style="color:#ff385c;font-weight:700;margin:0 0 8px">NullStay Support</p>
      <p style="color:#717171;font-size:13px;margin:0 0 16px">Subject: ${escapeHtml(subjectLine)}</p>
      <p style="color:#484848;margin:0 0 8px"><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <p style="color:#484848;margin:0 0 16px"><strong>Category:</strong> ${escapeHtml(topicLabel)}</p>
      ${refLine}
      <div style="color:#484848;background:#f9fafb;padding:16px;border-radius:12px;white-space:pre-wrap;line-height:1.55">${escapeHtml(message)}</div>
    </div>`;
}

/** Email to your support inbox */
export async function sendSupportContactEmail(payload) {
  const to = getSupportInbox();
  const subjectLine = buildSupportSubject(payload);
  const topicLabel = TOPIC_LABELS[payload.topic] || payload.topic;

  return sendMail({
    to,
    replyTo: payload.email,
    subject: `[NullStay] ${subjectLine}`,
    html: supportEmailBody(payload, { subjectLine }),
    text: `From: ${payload.name} <${payload.email}>\nCategory: ${topicLabel}\n\n${payload.message}`,
  });
}

/** Auto-reply confirmation to the person who submitted the form */
export async function sendSupportConfirmationEmail(payload) {
  const subjectLine = buildSupportSubject(payload);
  const appUrl = (process.env.APP_URL || "http://localhost:8080").replace(
    /\/$/,
    "",
  );

  return sendMail({
    to: payload.email,
    subject: `We got your message — ${subjectLine}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <p style="color:#ff385c;font-weight:700">NullStay</p>
        <h2 style="color:#222;font-size:20px;margin:0 0 12px">Hi ${escapeHtml(payload.name)},</h2>
        <p style="color:#484848;line-height:1.6">Thanks for emailing support. We received your message and will reply to <strong>${escapeHtml(payload.email)}</strong> within one business day.</p>
        <p style="color:#484848;background:#f9fafb;padding:14px;border-radius:12px;font-size:14px"><strong>Your subject:</strong> ${escapeHtml(subjectLine)}</p>
        <p style="margin:24px 0 0">
          <a href="${appUrl}/help" style="display:inline-block;background:#ff385c;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Visit Help Centre</a>
        </p>
        <p style="color:#717171;font-size:12px;margin-top:24px">— NullStay Support</p>
      </div>`,
  });
}

export async function sendSupportEmails(payload) {
  if (!isMailConfigured()) {
    const skipped = await sendSupportContactEmail(payload);
    return { skipped: true, reason: skipped.reason };
  }

  const inboxResult = await sendSupportContactEmail(payload);
  if (inboxResult?.skipped) {
    return inboxResult;
  }

  try {
    await sendSupportConfirmationEmail(payload);
  } catch (err) {
    supportLog.warn("Confirmation email failed", { error: err.message });
  }

  return { ok: true };
}

export { isMailConfigured };

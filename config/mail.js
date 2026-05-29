import nodemailer from "nodemailer";

let transporter = null;

export function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

export function getMailFrom() {
  return (
    process.env.MAIL_FROM ||
    `"NullStay" <${process.env.SMTP_USER}>`
  );
}

function getTransporter() {
  if (!isMailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  if (!to) return { skipped: true, reason: "no_recipient" };

  if (!isMailConfigured()) {
    console.log(`[mail] skipped (SMTP not configured) → ${to}: ${subject}`);
    return { skipped: true, reason: "not_configured" };
  }

  const transport = getTransporter();
  const info = await transport.sendMail({
    from: getMailFrom(),
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  });

  return { ok: true, messageId: info.messageId };
}

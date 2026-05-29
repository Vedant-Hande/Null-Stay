import { sendMail } from "../config/mail.js";

function appBaseUrl() {
  return (process.env.APP_URL || "http://localhost:8080").replace(/\/$/, "");
}

export async function sendNewMessageEmail({ recipient, sender, listing, preview }) {
  if (!recipient?.email) return;

  const listingTitle = listing?.title || "a listing";
  const senderName = sender?.username || "Someone";
  const url = listing
    ? `${appBaseUrl()}/messages/${sender._id}/${listing._id}`
    : `${appBaseUrl()}/messages`;

  await sendMail({
    to: recipient.email,
    replyTo: sender?.email || undefined,
    subject: `New message from ${senderName}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <p style="color:#ff385c;font-weight:700">NullStay</p>
        <h2 style="color:#222">New message from ${senderName}</h2>
        <p style="color:#484848">About: <strong>${listingTitle}</strong></p>
        <p style="color:#484848;background:#f9fafb;padding:16px;border-radius:12px">${preview}</p>
        <p><a href="${url}" style="display:inline-block;background:#ff385c;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Reply on NullStay</a></p>
      </div>`,
  }).catch((err) => {
    console.error("[mail] new message email failed:", err.message);
  });
}

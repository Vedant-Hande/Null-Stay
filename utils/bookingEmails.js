import User from "../models/user.js";
import { BOOKING_STATUSES } from "../models/booking.js";
import { sendMail } from "../config/mail.js";
import * as bookingDisplay from "./bookingDisplay.js";

const BRAND = {
  rose: "#ff385c",
  roseDark: "#e31c5f",
  text: "#222222",
  textMuted: "#717171",
  textBody: "#484848",
  border: "#ebebeb",
  bg: "#f7f7f7",
  card: "#ffffff",
  slate: "#0f172a",
};

function appBaseUrl() {
  return (process.env.APP_URL || "http://localhost:8080").replace(/\/$/, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailLayout({ kicker, heading, body, ctaLabel, ctaUrl, footerNote }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:Inter,Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.bg};padding:12px 6px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:0 0 16px;text-align:center;">
              <a href="${appBaseUrl()}/listings" style="text-decoration:none;display:inline-block;">
                <span style="font-size:22px;font-weight:700;color:${BRAND.rose};letter-spacing:-0.02em;">NullStay</span>
              </a>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:20px;box-shadow:0 4px 24px -4px rgba(0,0,0,0.08);overflow:hidden;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:24px 16px 8px;">
                    <p style="margin:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.textMuted};">${escapeHtml(kicker)}</p>
                    <h1 style="margin:0;font-size:26px;font-weight:600;letter-spacing:-0.03em;line-height:1.2;color:${BRAND.text};">${escapeHtml(heading)}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px 20px;color:${BRAND.textBody};font-size:15px;line-height:1.65;">
                    ${body}
                  </td>
                </tr>
                ${
                  ctaUrl
                    ? `<tr>
                  <td style="padding:0 16px 24px;">
                    <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${BRAND.rose};color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 8px 24px -6px rgba(255,56,92,0.55);">${escapeHtml(ctaLabel)}</a>
                  </td>
                </tr>`
                    : ""
                }
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 0 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:${BRAND.textMuted};">
                ${escapeHtml(footerNote || "You received this because of activity on your NullStay account.")}
              </p>
              <p style="margin:0;font-size:11px;color:#b0b0b0;">© ${year} NullStay · <a href="${appBaseUrl()}/listings" style="color:#b0b0b0;text-decoration:underline;">Visit NullStay</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function userEmail(userId) {
  if (!userId) return null;
  return User.findById(userId).select("email username");
}

function detailCell(label, value) {
  return `<td width="50%" style="padding:4px;vertical-align:top;">
    <div style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:12px;padding:14px;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.textMuted};">${escapeHtml(label)}</p>
      <p style="margin:0;font-size:14px;font-weight:600;color:${BRAND.text};">${escapeHtml(value)}</p>
    </div>
  </td>`;
}

function bookingDetailsHtml({ listing, booking, guestName, showGuest = false }) {
  const title = listing?.title || "Listing";
  const location = [listing?.location, listing?.country].filter(Boolean).join(", ");
  const dates = bookingDisplay.bookingDateRange(booking.checkIn, booking.checkOut);
  const total = bookingDisplay.formatInr(booking.total);
  const code = booking.confirmationCode || "—";
  const imageUrl = listing?.image?.url;

  const imageBlock = imageUrl
    ? `<div style="margin:0 0 20px;border-radius:14px;overflow:hidden;border:1px solid ${BRAND.border};">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" width="100%" style="display:block;width:100%;max-width:100%;height:auto;object-fit:cover;" />
      </div>`
    : "";

  const guestRow = showGuest && guestName
    ? `<tr>${detailCell("Guest", guestName)}<td width="50%"></td></tr>`
    : "";

  return `
    ${imageBlock}
    <div style="margin-bottom:18px;">
      <p style="margin:0 0 4px;font-size:18px;font-weight:600;color:${BRAND.text};">${escapeHtml(title)}</p>
      ${location ? `<p style="margin:0;font-size:14px;color:${BRAND.textMuted};">📍 ${escapeHtml(location)}</p>` : ""}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">
      <tr>${detailCell("Check-in / Check-out", dates)}${detailCell("Guests", `${booking.guests} guest${booking.guests > 1 ? "s" : ""}`)}</tr>
      <tr>${detailCell("Nights", String(booking.nights))}${detailCell("Total", total)}</tr>
      <tr>${detailCell("Reference", code)}<td width="50%"></td></tr>
      ${guestRow}
    </table>`;
}

export async function sendBookingCreatedEmails({ booking, listing, guestUser }) {
  const base = appBaseUrl();
  const guestName = guestUser?.username || "Guest";
  const hostId = listing.owner?._id ?? listing.owner;
  const host = await userEmail(hostId);
  const guestEmail = guestUser?.email;
  const isConfirmed = booking.status === BOOKING_STATUSES.CONFIRMED;

  const tasks = [];

  if (guestEmail) {
    tasks.push(
      sendMail({
        to: guestEmail,
        replyTo: host?.email || undefined,
        subject: isConfirmed
          ? `Booking confirmed — ${listing.title}`
          : `Request sent — ${listing.title}`,
        html: emailLayout({
          kicker: isConfirmed ? "Reservation confirmed" : "Request sent",
          heading: isConfirmed ? "Your stay is confirmed" : "Request sent to host",
          body: `
            <p style="margin:0 0 16px;">Hi <strong>${escapeHtml(guestName)}</strong>,</p>
            <p style="margin:0 0 20px;">${
              isConfirmed
                ? "Your payment was received and your reservation is confirmed. We hope you have a wonderful stay."
                : "Your booking request was sent to the host. You'll be notified as soon as they respond."
            }</p>
            ${bookingDetailsHtml({ listing, booking, guestName })}`,
          ctaLabel: "View booking",
          ctaUrl: `${base}/bookings/${booking._id}`,
        }),
      }),
    );
  }

  if (host?.email && String(host._id) !== String(guestUser._id)) {
    tasks.push(
      sendMail({
        to: host.email,
        replyTo: guestEmail || undefined,
        subject: isConfirmed
          ? `New reservation — ${listing.title}`
          : `New booking request — ${listing.title}`,
        html: emailLayout({
          kicker: isConfirmed ? "New reservation" : "Booking request",
          heading: isConfirmed ? "You have a new guest" : "New booking request",
          body: `
            <p style="margin:0 0 16px;">Hi <strong>${escapeHtml(host.username || "Host")}</strong>,</p>
            <p style="margin:0 0 20px;"><strong>${escapeHtml(guestName)}</strong> ${
              isConfirmed ? "booked" : "requested to book"
            } your listing.</p>
            ${bookingDetailsHtml({ listing, booking, guestName, showGuest: true })}`,
          ctaLabel: "Manage reservations",
          ctaUrl: `${base}/bookings/host`,
        }),
      }),
    );
  }

  await Promise.allSettled(tasks).then((results) => {
    results.forEach((r) => {
      if (r.status === "rejected") {
        console.error("[mail] booking created email failed:", r.reason?.message);
      }
    });
  });
}

export async function sendBookingCancelledEmails({ booking, listing, guestUser }) {
  const base = appBaseUrl();
  const guestName = guestUser?.username || "Guest";
  const hostId = listing.owner?._id ?? listing.owner;
  const host = await userEmail(hostId);
  const guestEmail = guestUser?.email;

  const tasks = [];

  if (guestEmail) {
    tasks.push(
      sendMail({
        to: guestEmail,
        replyTo: host?.email || undefined,
        subject: `Trip cancelled — ${listing.title}`,
        html: emailLayout({
          kicker: "Cancellation",
          heading: "Your trip was cancelled",
          body: `
            <p style="margin:0 0 16px;">Hi <strong>${escapeHtml(guestName)}</strong>,</p>
            <p style="margin:0 0 20px;">This confirms your cancellation for the booking below. If a refund applies, it will be processed shortly.</p>
            ${bookingDetailsHtml({ listing, booking, guestName })}`,
          ctaLabel: "View trips",
          ctaUrl: `${base}/bookings/trips`,
        }),
      }),
    );
  }

  if (host?.email) {
    tasks.push(
      sendMail({
        to: host.email,
        replyTo: guestEmail || undefined,
        subject: `Booking cancelled — ${listing.title}`,
        html: emailLayout({
          kicker: "Cancellation",
          heading: "A guest cancelled their booking",
          body: `
            <p style="margin:0 0 16px;">Hi <strong>${escapeHtml(host.username || "Host")}</strong>,</p>
            <p style="margin:0 0 20px;"><strong>${escapeHtml(guestName)}</strong> cancelled their booking for your listing.</p>
            ${bookingDetailsHtml({ listing, booking, guestName, showGuest: true })}`,
          ctaLabel: "View reservations",
          ctaUrl: `${base}/bookings/host`,
        }),
      }),
    );
  }

  await Promise.allSettled(tasks).then((results) => {
    results.forEach((r) => {
      if (r.status === "rejected") {
        console.error("[mail] booking cancelled email failed:", r.reason?.message);
      }
    });
  });
}

export async function sendBookingAcceptedEmails({ booking, listing }) {
  const base = appBaseUrl();
  const guest = await userEmail(booking.guest);
  const hostId = listing.owner?._id ?? listing.owner;
  const host = await userEmail(hostId);
  if (!guest?.email) return;

  const guestName = guest.username || "Guest";
  const details = bookingDetailsHtml({ listing, booking, guestName });

  await sendMail({
    to: guest.email,
    replyTo: host?.email || undefined,
    subject: `Request accepted — ${listing.title}`,
    html: emailLayout({
      kicker: "Request accepted",
      heading: "Your booking was accepted",
      body: `
        <p style="margin:0 0 16px;">Hi <strong>${escapeHtml(guestName)}</strong>,</p>
        <p style="margin:0 0 20px;">Great news — <strong>${escapeHtml(host?.username || "your host")}</strong> accepted your request. Your stay is confirmed.</p>
        ${details}`,
      ctaLabel: "View booking",
      ctaUrl: `${base}/bookings/${booking._id}`,
      footerNote: "Reply to this email to contact your host directly.",
    }),
  }).catch((err) => {
    console.error("[mail] booking accepted email failed:", err.message);
  });
}

export async function sendBookingRejectedEmails({ booking, listing }) {
  const base = appBaseUrl();
  const guest = await userEmail(booking.guest);
  const hostId = listing.owner?._id ?? listing.owner;
  const host = await userEmail(hostId);
  if (!guest?.email) return;

  const guestName = guest.username || "Guest";
  const details = bookingDetailsHtml({ listing, booking, guestName });

  await sendMail({
    to: guest.email,
    replyTo: host?.email || undefined,
    subject: `Request declined — ${listing.title}`,
    html: emailLayout({
      kicker: "Request declined",
      heading: "Your booking request was declined",
      body: `
        <p style="margin:0 0 16px;">Hi <strong>${escapeHtml(guestName)}</strong>,</p>
        <p style="margin:0 0 20px;">Unfortunately the host declined your request for this listing. If payment was collected, a refund will be processed.</p>
        ${details}`,
      ctaLabel: "Browse listings",
      ctaUrl: `${base}/listings`,
    }),
  }).catch((err) => {
    console.error("[mail] booking rejected email failed:", err.message);
  });
}

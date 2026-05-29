import User from "../models/user.js";
import { BOOKING_STATUSES } from "../models/booking.js";
import { sendMail } from "../config/mail.js";
import * as bookingDisplay from "./bookingDisplay.js";

function appBaseUrl() {
  return (process.env.APP_URL || "http://localhost:8080").replace(/\/$/, "");
}

function emailLayout({ heading, body, ctaLabel, ctaUrl }) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family:Inter,Arial,sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #eee;padding:28px">
    <p style="color:#ff385c;font-weight:700;font-size:14px;margin:0 0 8px">NullStay</p>
    <h1 style="font-size:22px;color:#111;margin:0 0 16px">${heading}</h1>
    <div style="color:#444;font-size:15px;line-height:1.6">${body}</div>
    ${
      ctaUrl
        ? `<p style="margin-top:24px"><a href="${ctaUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${ctaLabel}</a></p>`
        : ""
    }
    <p style="margin-top:28px;font-size:12px;color:#9ca3af">You received this because of activity on your NullStay account.</p>
  </div>
</body>
</html>`;
}

async function userEmail(userId) {
  if (!userId) return null;
  return User.findById(userId).select("email username");
}

function bookingDetailsHtml({ listing, booking, guestName }) {
  const title = listing?.title || "Listing";
  const location = [listing?.location, listing?.country].filter(Boolean).join(", ");
  const dates = bookingDisplay.bookingDateRange(booking.checkIn, booking.checkOut);
  const total = bookingDisplay.formatInr(booking.total);
  const code = booking.confirmationCode || "—";

  return `
    <p><strong>${title}</strong>${location ? `<br><span style="color:#6b7280">${location}</span>` : ""}</p>
    <ul style="padding-left:18px;margin:16px 0">
      <li>Dates: ${dates}</li>
      <li>Guests: ${booking.guests}</li>
      <li>Nights: ${booking.nights}</li>
      <li>Total: ${total}</li>
      <li>Reference: ${code}</li>
      ${guestName ? `<li>Guest: ${guestName}</li>` : ""}
    </ul>`;
}

export async function sendBookingCreatedEmails({ booking, listing, guestUser }) {
  const base = appBaseUrl();
  const guestName = guestUser?.username || "Guest";
  const hostId = listing.owner?._id ?? listing.owner;
  const host = await userEmail(hostId);
  const guestEmail = guestUser?.email;
  const isConfirmed = booking.status === BOOKING_STATUSES.CONFIRMED;
  const details = bookingDetailsHtml({ listing, booking, guestName });

  const tasks = [];

  if (guestEmail) {
    tasks.push(
      sendMail({
        to: guestEmail,
        subject: isConfirmed
          ? `Booking confirmed — ${listing.title}`
          : `Request sent — ${listing.title}`,
        html: emailLayout({
          heading: isConfirmed ? "Your stay is confirmed" : "Request sent to host",
          body: `
            <p>Hi ${guestName},</p>
            <p>${
              isConfirmed
                ? "Your payment was received and your reservation is confirmed."
                : "Your booking request was sent. The host will respond soon."
            }</p>
            ${details}`,
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
        subject: isConfirmed
          ? `New reservation — ${listing.title}`
          : `New booking request — ${listing.title}`,
        html: emailLayout({
          heading: isConfirmed ? "New reservation" : "New booking request",
          body: `
            <p>Hi ${host.username || "Host"},</p>
            <p><strong>${guestName}</strong> ${
              isConfirmed ? "booked" : "requested to book"
            } your listing.</p>
            ${details}`,
          ctaLabel: "Manage reservations",
          ctaUrl: `${base}/bookings/host`,
        }),
      }),
    );
  }

  await Promise.allSettled(tasks);
}

export async function sendBookingCancelledEmails({ booking, listing, guestUser }) {
  const base = appBaseUrl();
  const guestName = guestUser?.username || "Guest";
  const hostId = listing.owner?._id ?? listing.owner;
  const host = await userEmail(hostId);
  const guestEmail = guestUser?.email;
  const details = bookingDetailsHtml({ listing, booking, guestName });

  const tasks = [];

  if (guestEmail) {
    tasks.push(
      sendMail({
        to: guestEmail,
        subject: `Trip cancelled — ${listing.title}`,
        html: emailLayout({
          heading: "Your trip was cancelled",
          body: `
            <p>Hi ${guestName},</p>
            <p>This confirms your cancellation for the booking below.</p>
            ${details}`,
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
        subject: `Booking cancelled — ${listing.title}`,
        html: emailLayout({
          heading: "A guest cancelled their booking",
          body: `
            <p>Hi ${host.username || "Host"},</p>
            <p><strong>${guestName}</strong> cancelled their booking for your listing.</p>
            ${details}`,
          ctaLabel: "View reservations",
          ctaUrl: `${base}/bookings/host`,
        }),
      }),
    );
  }

  await Promise.allSettled(tasks);
}

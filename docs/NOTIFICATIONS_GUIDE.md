# Null Stay — Notifications System (Step-by-Step Guide)

This document explains **how we built** real-time and push notifications in Null Stay: what each file does, how data flows, and how to set it up locally.

---

## Table of contents

1. [What we built (3 layers)](#1-what-we-built-3-layers)
2. [Dependencies](#2-dependencies)
3. [Step 1 — Notification database model](#step-1--notification-database-model)
4. [Step 2 — Core function: save + deliver](#step-2--core-function-save--deliver)
5. [Step 3 — Booking event hooks](#step-3--booking-event-hooks)
6. [Step 4 — HTTP routes (inbox API)](#step-4--http-routes-inbox-api)
7. [Step 5 — Socket.io (live tab updates)](#step-5--socketio-live-tab-updates)
8. [Step 6 — Wire the server (`index.js`)](#step-6--wire-the-server-indexjs)
9. [Step 7 — Navbar UI (bell, dropdown, toast)](#step-7--navbar-ui-bell-dropdown-toast)
10. [Step 8 — Browser permission banner](#step-8--browser-permission-banner)
11. [Step 9 — Web Push (real OS alerts)](#step-9--web-push-real-os-alerts)
12. [Step 10 — Service worker](#step-10--service-worker)
11. [Step 11 — Client subscribes to push](#step-11--client-subscribes-to-push)
12. [End-to-end flow diagram](#end-to-end-flow-diagram)
13. [Environment variables](#environment-variables)
14. [How to test](#how-to-test)
15. [Troubleshooting](#troubleshooting)
16. [File checklist](#file-checklist)

---

## 1. What we built (3 layers)

| Layer | Technology | When user sees it |
|-------|------------|-------------------|
| **Inbox** | MongoDB + EJS page | Any time they open `/notifications` |
| **Live (tab open)** | Socket.io | Toast + bell badge updates instantly |
| **Real push** | Web Push + Service Worker | Windows/macOS notification (tab can be in background; browser must be running) |

WhatsApp desktop is a **installed app**. Null Stay is a **website**, so we use the **Web Push API** — the closest equivalent in a browser.

---

## 2. Dependencies

```bash
npm install socket.io web-push
```

| Package | Role |
|---------|------|
| `socket.io` | WebSocket server ↔ browser for instant events |
| `web-push` | Send push messages to the browser push service (Google/Mozilla) |

---

## Step 1 — Notification database model

**File:** `models/notification.js`

**Micro steps:**

1. Define **types** of notifications (booking request, confirmed, etc.).
2. Create a Mongoose schema with `recipient`, `title`, `message`, `link`, `read`.
3. Add indexes so inbox queries are fast.

**Code (simplified):**

```javascript
export const NOTIFICATION_TYPES = {
  BOOKING_REQUEST: "booking_request",
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_DECLINED: "booking_declined",
  BOOKING_CANCELLED: "booking_cancelled",
  BOOKING_NEW: "booking_new",
};

const notificationSchema = new mongoose.Schema({
  recipient: { type: ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
  title: { type: String, required: true, maxlength: 120 },
  message: { type: String, required: true, maxlength: 500 },
  link: { type: String, default: "/notifications" },
  read: { type: Boolean, default: false, index: true },
  booking: { type: ObjectId, ref: "Booking" },
  listing: { type: ObjectId, ref: "Listing" },
}, { timestamps: true });
```

**Why:** Every alert is stored even if the user is offline. The bell badge and inbox read from this collection.

---

## Step 2 — Core function: save + deliver

**File:** `utils/notifyUser.js`

**Micro steps:**

1. Insert one document into `notifications` collection.
2. Convert it to plain JSON (`serializeNotification`).
3. Emit Socket.io event to room `user:<recipientId>`.
4. Call `sendWebPushToUser()` for OS-level push (if VAPID keys exist).

**Code (core logic):**

```javascript
export async function notifyUser({
  app,
  recipientId,
  type,
  title,
  message,
  link = "/notifications",
  bookingId = null,
  listingId = null,
}) {
  const recipient = String(recipientId);

  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    link,
    booking: bookingId,
    listing: listingId,
  });

  const payload = serializeNotification(notification);

  // Layer 2: real-time for open tabs
  const io = app?.get?.("io") ?? getIO();
  if (io) {
    io.to(`user:${recipient}`).emit("notification", payload);
  }

  // Layer 3: Web Push (background / closed tab)
  sendWebPushToUser(recipient, { title, message, link }).catch(console.error);

  return notification;
}
```

**Why `String(recipientId)`:** Socket rooms and MongoDB must use the same ID format (`ObjectId` → string).

**Why `app.get("io")`:** Routes pass `req.app` so `notifyUser` can reach Socket.io without global imports everywhere.

---

## Step 3 — Booking event hooks

**File:** `utils/bookingNotifications.js`

**Micro steps:**

1. After a booking is **created**, decide who to notify (host vs guest, instant vs request).
2. After **accept** / **reject** / **cancel**, notify the other party.
3. Each helper calls `notifyUser()` with human-readable title and message.

**Example — new booking request (host approval required):**

```javascript
// Guest gets confirmation their request was sent
await notifyUser({
  app,
  recipientId: booking.guest,
  type: NOTIFICATION_TYPES.BOOKING_REQUEST,
  title: "Request sent",
  message: `Your request to book "${title}" was sent to the host.`,
  link: `/bookings/${booking._id}`,
  bookingId: booking._id,
  listingId: listing._id,
});

// Host gets the actionable request
await notifyUser({
  app,
  recipientId: host,
  type: NOTIFICATION_TYPES.BOOKING_REQUEST,
  title: "New booking request",
  message: `${guestName} requested to book "${title}".`,
  link: "/bookings/host",
  ...
});
```

**File:** `routes/bookingRoute.js`

After `createBookingFromCheckout()` (both Stripe and demo card paths):

```javascript
await notifyAfterBookingCreated({
  app: req.app,
  booking,
  listing,
  guestUser: req.user,
});
```

**Important bug we fixed:** Demo checkout originally skipped this call — only Stripe path notified. Both paths must call the helper.

---

## Step 4 — HTTP routes (inbox API)

**File:** `routes/notificationRoute.js`  
**Mounted at:** `app.use("/notifications", notificationRoute)` in `index.js`

| Step | Route | What it does |
|------|-------|----------------|
| 1 | `GET /notifications` | Render inbox page (`views/notifications/index.ejs`) |
| 2 | `GET /notifications/unread-count` | JSON `{ count }` for bell badge |
| 3 | `GET /notifications/recent?limit=8` | JSON list for bell dropdown |
| 4 | `PATCH /notifications/:id/read` | Mark one as read |
| 5 | `PATCH /notifications/read-all` | Mark all as read |

**Code pattern:**

```javascript
router.get("/unread-count", isLoggedIn, wrapAsync(async (req, res) => {
  const count = await getUnreadCount(req.user._id);
  res.json({ count });
}));
```

**Why `isLoggedIn`:** Users only see their own notifications.

---

## Step 5 — Socket.io (live tab updates)

### 5a. Socket server config

**File:** `config/socket.js`

**Micro steps:**

1. Create `Server` attached to the same HTTP server as Express.
2. Run **session + passport** middleware on each socket connection (same cookie as normal pages).
3. If logged in → `socket.join("user:" + userId)`.
4. Store `io` on `app.set("io", io)` for use in `notifyUser`.

**Code:**

```javascript
io.use(wrap(sessionMiddleware));
io.use(wrap(app.get("passportInit")));
io.use(wrap(app.get("passportSession")));

io.on("connection", (socket) => {
  const user = socket.request.user;
  if (!user?._id) {
    socket.disconnect(true);
    return;
  }
  socket.join(`user:${String(user._id)}`);
});
```

**Why wrap middleware with `res.end`:** Express session sometimes expects `res`; sockets only have `req`. A minimal `res` object fixes auth on WebSocket handshake.

### 5b. Client listens

**File:** `public/js/notifications.js`

```javascript
const socket = io({ withCredentials: true });
socket.on("notification", handleIncoming);
```

**`withCredentials: true`:** Sends session cookie so the server knows which user connected.

**`handleIncoming`:** Shows toast, updates badge, refreshes dropdown list.

---

## Step 6 — Wire the server (`index.js`)

**Micro steps:**

1. Use `http.createServer(app)` instead of `app.listen()` — Socket.io needs the HTTP server instance.
2. Call `initSocket(server, app, sessionMiddleware)`.
3. Call `initWebPush()` at startup.
4. Add middleware to set `res.locals.unreadNotificationCount` on every page.
5. Mount `/notifications` and `/push` routes.

**Code (structure):**

```javascript
const app = express();
const server = http.createServer(app);

const sessionMiddleware = session(sessionOptions);
app.use(sessionMiddleware);
app.use(passportInit);
app.use(passportSession);

initWebPush();
initSocket(server, app, sessionMiddleware);

app.use(async (req, res, next) => {
  res.locals.unreadNotificationCount = 0;
  if (req.user) {
    res.locals.unreadNotificationCount = await getUnreadCount(req.user._id);
  }
  next();
});

app.use("/notifications", notificationRoute);
app.use("/push", pushRoute);

server.listen(port, () => console.log(`server is listening on port ${port}`));
```

---

## Step 7 — Navbar UI (bell, dropdown, toast)

| File | Purpose |
|------|---------|
| `views/includes/notificationPanel.ejs` | Bell button + dropdown panel |
| `views/layouts/boilerplate.ejs` | Includes panel, toast stack, scripts |
| `public/css/notifications.css` | Badge, dropdown, toast styles |
| `public/js/notifications.js` | Socket client, dropdown fetch, toasts |
| `views/notifications/index.ejs` | Full inbox page |

**Micro steps in `boilerplate.ejs`:**

1. Link `notifications.css`.
2. Add `<div id="notificationToastStack">` for live toasts.
3. If `currentUser` → load `socket.io` + `notifications.js`.
4. Pass `window.__NULLSTAY_USER_ID__` so JS knows user is logged in.

**Bell badge:** Server renders initial count from `unreadNotificationCount`; JS refreshes via `/notifications/unread-count` and on each socket event.

---

## Step 8 — Browser permission banner

**File:** `views/includes/desktopNotifyBanner.ejs`

**Micro steps:**

1. Show a bottom banner when permission is still `default`.
2. User clicks **Turn on** → `Notification.requestPermission()`.
3. If granted → register Web Push (Step 11).
4. **Not now** → save `localStorage` flag so we don’t nag every visit.

**Fallback:** If Web Push isn’t configured (no VAPID keys), we still use the basic `Notification` API for in-browser OS popups when the tab is open.

---

## Step 9 — Web Push (real OS alerts)

### 9a. VAPID configuration

**File:** `config/webPush.js`

**Micro steps:**

1. Read `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL` from `.env`.
2. Call `webpush.setVapidDetails()` once at startup.

```javascript
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);
```

**Generate keys:**

```bash
node utils_scripts/generate-vapid-keys.js
```

Copy output into `.env` and restart the server.

### 9b. Store browser subscriptions

**File:** `models/pushSubscription.js`

Each browser/device gets one document:

```javascript
{
  user: ObjectId,      // who owns this device
  endpoint: String,    // unique URL from browser (unique index)
  keys: { p256dh, auth }  // encryption keys from Push API
}
```

### 9c. Send push from server

**File:** `utils/sendWebPush.js`

**Micro steps:**

1. Find all `PushSubscription` documents for `userId`.
2. For each, call `webpush.sendNotification(subscription, JSON.stringify({ title, body, url }))`.
3. If subscription expired (410/404), delete it from DB.

Called automatically from `notifyUser()` — you don’t call it manually in routes.

### 9d. Push API routes

**File:** `routes/pushRoute.js`  
**Mounted at:** `/push`

| Route | Purpose |
|-------|---------|
| `GET /push/config` | Returns `{ enabled, publicKey }` for client |
| `POST /push/subscribe` | Save subscription JSON from browser |
| `POST /push/unsubscribe` | Remove subscription |

**Subscribe handler:**

```javascript
await PushSubscription.findOneAndUpdate(
  { endpoint },
  { user: req.user._id, endpoint, keys: { p256dh, auth } },
  { upsert: true, new: true },
);
```

---

## Step 10 — Service worker

**File:** `public/sw.js` (served at `/sw.js`)

**Micro steps:**

1. Browser registers this file as a background script for your origin.
2. On **push** event → read JSON payload → `showNotification()`.
3. On **notificationclick** → focus or open the URL (e.g. booking page).

```javascript
self.addEventListener("push", (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/notifications";
  event.waitUntil(clients.openWindow(url));
});
```

**Why a service worker:** Only it can show notifications when your page JavaScript isn’t running (background tab).

---

## Step 11 — Client subscribes to push

**File:** `public/js/notifications.js` — function `registerPushSubscription()`

**Micro steps:**

1. `navigator.serviceWorker.register("/sw.js")`
2. Wait for `navigator.serviceWorker.ready`
3. `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidPublicKey })`
4. `POST` the subscription object to `/push/subscribe`

**VAPID public key** comes from:

- `window.__NULLSTAY_VAPID_KEY__` in HTML (from `boilerplate.ejs`), or
- `GET /push/config`

**Convert key format (required by browsers):**

```javascript
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw], (c) => c.charCodeAt(0));
}
```

On page load, if permission is already `granted`, we call `registerPushSubscription()` silently to re-sync after restart.

---

## End-to-end flow diagram

```
Guest books listing
        │
        ▼
routes/bookingRoute.js
  notifyAfterBookingCreated({ app: req.app, ... })
        │
        ▼
utils/bookingNotifications.js
  notifyUser({ recipientId: host, title, message, ... })
        │
        ├──────────────────────────────────────┐
        ▼                                      ▼
MongoDB: notifications.insert          Socket.io:
                                       io.to("user:HOST_ID")
                                       .emit("notification", payload)
        │                                      │
        │                                      ▼
        │                              Host browser (tab open):
        │                              toast + badge update
        ▼
utils/sendWebPush.js
  webpush.sendNotification(each subscription)
        │
        ▼
Browser push service → Service Worker (sw.js)
        │
        ▼
Windows / macOS notification (even if tab in background)
```

---

## Environment variables

Add to `.env` (see `.env.example`):

```env
# Required for Web Push (real notifications)
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_CONTACT_EMAIL=you@example.com

# Already required for app
SESSION_SECRET=...
DB_URL=...
CONN_PORT=8080
```

Without VAPID keys:

- Inbox + Socket.io + toasts still work.
- No push when the tab is closed.

---

## How to test

### Test 1 — Inbox (always works)

1. Log in as guest, book a listing.
2. Log in as host (different browser/incognito).
3. Open `/notifications` — documents should exist in MongoDB `notifications` collection.

### Test 2 — Live toast (Socket.io)

1. Host stays on any Null Stay page while logged in.
2. Guest books from another browser.
3. Host sees toast top-right + bell number increases (no refresh).

### Test 3 — Real push (Web Push)

1. Add VAPID keys to `.env`, restart nodemon.
2. Host: click **Turn on** → **Allow**.
3. Host: minimize browser or switch to another app.
4. Guest: book again.
5. Host: OS notification from Chrome/Edge.

### Test 4 — Two accounts

| Browser | User | Role |
|---------|------|------|
| A | Host | Receives “New booking request” |
| B | Guest | Receives “Request sent” or “Stay confirmed” |

You cannot test host notifications by booking your **own** listing (blocked by app).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No notifications at all | Check `notifyAfterBookingCreated` runs on **demo** checkout path in `bookingRoute.js` |
| Toast works, no OS popup | Add VAPID keys; click **Turn on**; permission must be **Allow** |
| `pushsubscriptions` empty | Open DevTools → Application → Service Workers; re-click **Turn on** |
| Socket never connects | Restart server with `http.createServer`; check session cookie / login |
| Permission blocked | Site settings → Notifications → Allow for `localhost:8080` |
| Production | Must use **HTTPS** (localhost HTTP is OK) |

---

## File checklist

| File | Role |
|------|------|
| `models/notification.js` | Notification schema |
| `models/pushSubscription.js` | Web Push device subscriptions |
| `utils/notifyUser.js` | Create + socket + trigger web push |
| `utils/bookingNotifications.js` | Booking-specific messages |
| `utils/sendWebPush.js` | Send via `web-push` package |
| `config/socket.js` | Socket.io + session auth |
| `config/webPush.js` | VAPID setup |
| `routes/notificationRoute.js` | Inbox HTTP API |
| `routes/pushRoute.js` | Subscribe / unsubscribe API |
| `routes/bookingRoute.js` | Calls notify helpers after bookings |
| `index.js` | HTTP server, init socket + push |
| `public/sw.js` | Service worker |
| `public/js/notifications.js` | Client: socket, UI, push subscribe |
| `public/js/notifications-page.js` | Inbox page mark-read |
| `public/css/notifications.css` | Styles |
| `views/includes/notificationPanel.ejs` | Bell UI |
| `views/includes/desktopNotifyBanner.ejs` | Permission banner |
| `views/notifications/index.ejs` | Inbox page |
| `views/layouts/boilerplate.ejs` | Loads scripts + CSS |
| `utils_scripts/generate-vapid-keys.js` | Generate `.env` keys |

---

## Activity notifications (reviews, listings, more)

**File:** `utils/activityNotifications.js`

| User action | Who gets notified |
|-------------|-------------------|
| Guest submits review | Host: "New review" · Guest: "Review published" |
| Guest deletes review | Host: "Review removed" · Guest: "Review deleted" |
| Guest books / request | (see `bookingNotifications.js`) |
| Guest cancels trip | Host + Guest confirmation |
| Host accepts / declines | Guest |
| Host creates listing | Host: "Listing published" |
| Host updates listing | Guests with pending/confirmed bookings |
| Host deletes listing | Guests with pending/confirmed bookings |

All use the same `notifyUser()` → MongoDB + Socket.io + Web Push.

---

## Summary

1. **Save** every alert in MongoDB (`notifyUser`).
2. **Push live** to open tabs with Socket.io (`user:<id>` rooms).
3. **Push to OS** with Web Push + service worker (needs VAPID + user permission).
4. **Trigger** from `bookingNotifications.js` and `activityNotifications.js` in routes.

That is the full notification system in Null Stay.

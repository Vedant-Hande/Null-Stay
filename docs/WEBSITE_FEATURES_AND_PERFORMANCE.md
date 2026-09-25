# NullStay — Website features & performance

Complete reference for what the NullStay marketplace does today and how each area performs. For resume-style metrics, see [PERFORMANCE_IMPACT_RESUME.md](./PERFORMANCE_IMPACT_RESUME.md).

> **Performance numbers** below are **architecture-based estimates** (local dev, MongoDB on same machine). Measure your own stack with `CACHE_DEBUG=true` and browser DevTools Network.

---

## Table of contents

1. [Product overview](#product-overview)
2. [Feature catalog](#feature-catalog)
3. [Performance architecture](#performance-architecture)
4. [Feature × performance matrix](#feature--performance-matrix)
5. [Configuration reference](#configuration-reference)
6. [Verification checklist](#verification-checklist)
7. [Related documentation](#related-documentation)

---

## Product overview

**NullStay** is a full-stack vacation-rental marketplace (Airbnb-style): guests browse and book stays; hosts list properties, manage reservations, and communicate with guests. Built with **Node.js, Express, MongoDB, EJS**, and integrations for **Cloudinary**, **Razorpay**, **SMTP email**, **Socket.io**, and **Web Push**.

---

## Feature catalog

### Discovery & listings

| Feature | Route / entry | Description |
|---------|---------------|-------------|
| **Home landing** | `GET /` | Branded hero, featured listings (8 newest), live search UI mocks |
| **Browse listings** | `GET /listings` | Filterable catalog with infinite scroll |
| **Listing search API** | `GET /api/listings/search` | JSON/grid chunks for scroll + home mocks |
| **Listing detail** | `GET /listings/:id` | Photos, map, reviews, booking widget |
| **Search filters** | Query params | `q`, `country`, `category`, `minPrice`, `maxPrice`, `guests` |
| **Reviews** | On listing show | Add/delete reviews; average rating on cards |
| **Wishlist** | `GET /wishlists`, heart toggle | Save listings; AJAX toggle without reload |

### Host — property management

| Feature | Route | Description |
|---------|-------|-------------|
| **Create listing** | `GET/POST /listings/new` | Form with image/gallery upload (Cloudinary) |
| **Edit listing** | `GET/PUT /listings/:id/edit` | Update details, instant-book toggle |
| **Delete listing** | `DELETE /listings/:id` | Remove listing + cache invalidation |
| **Host analytics** | `GET /users/:id/analytics` | Charts for host performance |
| **Hosting guide** | `GET /hosting` | Info page on shared landing layout |

### Booking & payments

| Feature | Route | Description |
|---------|-------|-------------|
| **Date picker** | Listing show | Flatpickr range; blocked dates from existing bookings |
| **Instant book vs request** | Per listing | `instantBook: true` → confirm; `false` → host approval |
| **Checkout** | `GET /bookings/checkout` | Price breakdown, guest details |
| **Razorpay checkout** | Checkout flow | UPI, cards, netbanking (test/live keys) |
| **Demo checkout** | Without Razorpay keys | Fake payment form for development |
| **Overlap prevention** | Server-side | Rejects conflicting date ranges |
| **Guest trips** | `GET /bookings/trips` | Upcoming and past bookings |
| **Host reservations** | `GET /bookings/host` | Pending / confirmed; accept or reject |
| **Cancel booking** | `POST` actions | Guest/host cancel with notifications |
| **Booking emails** | SMTP | Confirmation and cancellation emails |
| **Booking retention** | Background prune | Removes cancelled/rejected bookings after **15 days** |

### Users & auth

| Feature | Route | Description |
|---------|-------|-------------|
| **Sign up / login** | `/signup`, `/login` | Passport local strategy |
| **Logout** | `GET /logout` | Session destroy |
| **Account** | `GET /users/account` | Profile settings |
| **Session** | `express-session` + Mongo store | 3-day cookie, flash messages |

### Messaging

| Feature | Route | Description |
|---------|-------|-------------|
| **Inbox** | `GET /messages` | Conversation list |
| **Thread** | `GET /messages/:id` | Guest ↔ host messages |
| **Send message** | `POST` | Real-time delivery via Socket.io |
| **Message emails** | Optional SMTP | Email on new message |

### Notifications

| Feature | Layer | Description |
|---------|-------|-------------|
| **Inbox** | `GET /notifications` | MongoDB-stored notifications (12h window) |
| **Live updates** | Socket.io | Bell badge + toast when tab is open |
| **Web Push** | Service worker + VAPID | OS-level alerts when configured |
| **Booking events** | Hooks | Created, confirmed, rejected, cancelled |
| **Retention** | Background | Prunes old notifications/subscriptions (12h) |

### Info & brand pages

| Page | Route |
|------|-------|
| Help Centre | `/help` |
| Terms | `/terms` |
| Privacy | `/privacy` |
| Privacy choices | `/privacy-choices` |
| Sitemap | `/sitemap` |
| Careers | `/careers` |
| Hosting | `/hosting` |

Shared **landing layout** (`layouts/landing.ejs`) for consistent nav and footer.

### Developer tools (private)

| Feature | Route | Description |
|---------|-------|-------------|
| **Dev dashboard** | `GET /dev?key=...` | System health + LOC summary (requires `DEV_ACCESS_KEY`) |
| **Folder downloads** | `GET /dev/download/:target` | Zip export of routes, views/listings, models, etc. |
| **JSON export** | `GET /dev?format=json` | Machine-readable stats |

Public `/status` was merged into `/dev`. See [DEV_ROUTES.md](./DEV_ROUTES.md).

### Infrastructure & integrations

| Integration | Purpose |
|-------------|---------|
| **MongoDB** | Listings, users, bookings, reviews, messages, notifications |
| **Cloudinary** | Listing images and galleries |
| **Razorpay** | Payments (test/live) |
| **Nodemailer / SMTP** | Transactional email |
| **Socket.io** | Real-time notifications and messages |
| **Web Push (VAPID)** | Desktop/mobile browser push |
| **Joi** | Request validation (listings, bookings, reviews) |
| **Client image compression** | `compressImage.js` before upload |

### LAN & deployment helpers

| Feature | Doc |
|---------|-----|
| Access from phone on same Wi‑Fi | [ACCESS_FROM_PHONE.md](./ACCESS_FROM_PHONE.md) |
| `HOST=0.0.0.0`, LAN URLs in console | `index.js` startup |

---

## Performance architecture

### 1. Infinite scroll pagination

- **Chunk size:** 12 listings per request (`LISTINGS_PER_PAGE`)
- **First visit:** ~80–95% fewer MongoDB documents vs loading full catalog
- **Scroll:** `GET /api/listings/search?format=grid&page=N` appends cards via `listings-infinite.js`
- **Detail:** [PAGINATION.md](./PAGINATION.md)

### 2. In-memory server cache

| Cached path | What is cached | TTL / limits |
|-------------|----------------|--------------|
| `GET /` | 8 featured listings | 60s default, max 300 keys |
| `GET /listings` (first page data) | Filtered listing rows + count | Same |
| `GET /api/listings/search` | Per filter + page | Same; `X-Cache: HIT/MISS` when `CACHE_DEBUG=true` |
| `GET /listings/:id` | Lean listing + reviews | Same |

**Not cached:** wishlist hearts, session, owner-only checks.

**Invalidation:** listing create/update/delete; review add/remove.

**Cache read:** ~0.1–2 ms (in-memory `Map`). **Cache miss:** typical MongoDB work ~40–150 ms for catalog queries.

**Detail:** [CACHING.md](./CACHING.md), [CACHING_GUIDE.md](./CACHING_GUIDE.md)

### 3. Static asset caching

- Production: `Cache-Control` ~**1 day** on `/public` CSS/JS (`STATIC_CACHE_MAX_AGE`)
- Repeat visits: ~**200–800 KB** less re-download per session (bundle-dependent)

### 4. Perceived UX wins

| Feature | Performance benefit |
|---------|---------------------|
| **Wishlist AJAX** | No full page reload (~0.5–2 s saved per heart click) |
| **Lean listing queries** | Cached detail uses lean documents + targeted populate |
| **Booking retention** | Smaller host/guest booking lists over time |
| **Notification retention** | Smaller inbox queries (12h window) |

### 5. What is *not* optimized yet

- No CDN for images (Cloudinary serves images; app does not add extra CDN layer)
- No Redis — cache is single-process memory (fine for one server; use Redis for multi-instance)
- No database indexes doc in this file — verify indexes on listing search fields in production
- Map/geospatial search not implemented

---

## Feature × performance matrix

| Feature | Primary cost | Optimization | Typical repeat-request gain |
|---------|--------------|--------------|----------------------------|
| Home featured | 1 DB query | Cache 60s | ~1 query saved / hit |
| Listings browse (page 1) | `count` + `find` + populate | Cache + 12/page | ~2 DB round-trips saved / hit |
| Infinite scroll page 2+ | Same per page | Per-page cache key | ~2 round-trips saved / hit |
| Listing detail | Heavy `findById` + reviews | Per-id cache | ~1 heavy query saved / hit |
| Wishlist toggle | 1 write + read | AJAX only (no cache) | Faster UX, not fewer DB writes |
| Booking create | Writes + overlap check + email | Required work | N/A |
| Messages | DB + Socket emit | Real-time | N/A |
| Notifications list | DB (12h filter) | Retention prune | Smaller result sets |
| Image upload | Cloudinary API | Client compression | Smaller payloads |
| Dev dashboard | LOC scan + stats | Dev-only | N/A |

---

## Configuration reference

| Variable | Default | Affects |
|----------|---------|---------|
| `CACHE_ENABLED` | `true` | Server cache on/off |
| `CACHE_TTL_SECONDS` | `60` | Cache entry lifetime |
| `CACHE_MAX_ENTRIES` | `300` | Max in-memory keys |
| `CACHE_DEBUG` | off | `X-Cache` header on search API |
| `STATIC_CACHE_MAX_AGE` | `1d` (prod) | Browser cache for static files |
| `LISTINGS_PER_PAGE` | `12` | Pagination chunk size |
| `CONN_PORT` | `8080` | Server port |
| `DEV_ACCESS_KEY` | — | Dev routes (min 16 chars) |

---

## Verification checklist

1. **Cache:** Set `CACHE_DEBUG=true`, open `/listings`, scroll — compare `X-Cache: MISS` then `HIT` on `/api/listings/search`.
2. **Pagination:** First load shows 12 cards; scroll loads more without full page reload.
3. **Wishlist:** Toggle heart — network shows XHR/fetch, page does not reload.
4. **Static cache:** Production build — second visit to site shows cached CSS/JS in DevTools (disk cache).
5. **Integrations:** Server startup logs show Web Push, Email, Razorpay, Cache status.

---

## Related documentation

| Doc | Topic |
|-----|--------|
| [PERFORMANCE_IMPACT_RESUME.md](./PERFORMANCE_IMPACT_RESUME.md) | Resume bullets & headline metrics |
| [PAGINATION.md](./PAGINATION.md) | Infinite scroll |
| [CACHING.md](./CACHING.md) | Cache config |
| [CACHING_GUIDE.md](./CACHING_GUIDE.md) | How caching was built |
| [NOTIFICATIONS_GUIDE.md](./NOTIFICATIONS_GUIDE.md) | Notifications & push |
| [CLOUDINARY_IMAGE_UPLOAD_GUIDE.md](./CLOUDINARY_IMAGE_UPLOAD_GUIDE.md) | Images |
| [DEV_ROUTES.md](./DEV_ROUTES.md) | Developer dashboard |
| [ACCESS_FROM_PHONE.md](./ACCESS_FROM_PHONE.md) | LAN testing |
| [../roadmap.md](../roadmap.md) | Planned features |

---

*Last updated to reflect: unified dev dashboard, folder zip downloads, merged `/status` into `/dev`, infinite scroll, in-memory cache, Razorpay booking flow.*

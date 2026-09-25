# Reusable features for other projects

Patterns, modules, and ideas from **NullStay** that you can copy or adapt into other Node/Express apps, portfolios, or startups. Each section lists **what it does**, **key files**, **dependencies**, and **how portable it is**.

---

## Table of contents

1. [Quick portability legend](#quick-portability-legend)
2. [High-value reusable modules](#high-value-reusable-modules)
3. [UI & UX patterns](#ui--ux-patterns)
4. [Integrations (plug-in style)](#integrations-plug-in-style)
5. [DevOps & developer experience](#devops--developer-experience)
6. [What to extract vs rewrite](#what-to-extract-vs-rewrite)
7. [Suggested copy map](#suggested-copy-map)

---

## Quick portability legend

| Symbol | Meaning |
|--------|---------|
| 🟢 | Copy with minimal changes (config + env only) |
| 🟡 | Adapt schemas/routes to your domain |
| 🔴 | NullStay-specific; use as reference only |

---

## High-value reusable modules

### 1. In-memory TTL cache 🟢

**Use for:** Any read-heavy Express API (catalog, blog posts, product lists).

| Item | Location |
|------|----------|
| Cache engine | `config/cache.js`, `utils/cache.js` |
| Wrapper helpers | `utils/listingCache.js` (rename to your entity) |
| Invalidation | Call `cache.delPattern()` on writes |

**Env:** `CACHE_ENABLED`, `CACHE_TTL_SECONDS`, `CACHE_MAX_ENTRIES`, `CACHE_DEBUG`

**Upgrade path:** Swap `Map` backend for Redis without changing route code much.

**Docs:** [CACHING.md](./CACHING.md), [CACHING_GUIDE.md](./CACHING_GUIDE.md)

---

### 2. Infinite scroll pagination 🟡

**Use for:** Grids, feeds, search results without page buttons.

| Item | Location |
|------|----------|
| Server helper | `utils/pagination.js` |
| API route pattern | `routes/apiListingRoute.js` |
| Client script | `public/js/listings-infinite.js` (or equivalent) |
| CSS | `public/css/pagination.css` |

**Config:** `LISTINGS_PER_PAGE` (rename constant for your app).

**Docs:** [PAGINATION.md](./PAGINATION.md)

---

### 3. Async route wrapper 🟢

**Use for:** Express 5 / async handlers without try/catch in every route.

```js
// utils/wrapAsync.js
export default (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

---

### 4. Centralized error middleware 🟢

**Use for:** Consistent 404/500 pages and API errors.

| Item | Location |
|------|----------|
| Custom error class | `utils/ExpressError.js` |
| Middleware | `middleware/errorMiddleware.js` |
| Error view | `views/listings/error.ejs` (genericize) |

---

### 5. Static file cache headers 🟢

**Use for:** Faster repeat visits in production.

| Item | Location |
|------|----------|
| Middleware | `middleware/staticCache.js` |
| Wire-up | `index.js` → `express.static(..., getStaticCacheOptions())` |

**Env:** `STATIC_CACHE_MAX_AGE` (e.g. `1d`)

---

### 6. Joi validation middleware 🟡

**Use for:** Validating `req.body` before controllers run.

| Item | Location |
|------|----------|
| Middleware | `middleware/validationMiddleware.js` |
| Schemas | `schemas/*.js` |

Copy the middleware pattern; replace schemas with your models.

---

### 7. Data retention / cleanup jobs 🟢

**Use for:** Keeping tables small (logs, stale records, soft-deleted rows).

| Pattern | Location | Default |
|---------|----------|---------|
| Booking cleanup | `utils/bookingRetention.js` | 15 days for cancelled/rejected |
| Notification cleanup | `utils/notificationRetention.js` | 12h inbox window |

Run on server start or cron: `pruneOldCancelledBookings()`, `pruneExpiredNotificationData()`.

---

### 8. Developer dashboard + folder zip export 🟡

**Use for:** Private admin stats on side projects (LOC, uptime, download source folders).

| Item | Location |
|------|----------|
| Auth gate | `config/devAccess.js`, `middleware/devMiddleware.js` |
| Routes | `routes/devRoute.js` |
| LOC counter | `utils/countLoc.js` |
| Server stats | `utils/devServerStats.js` |
| Zip downloads | `utils/devFolderDownload.js` (uses `archiver` v8 `ZipArchive`) |
| UI | `views/dev/dashboard.ejs` |

**Env:** `DEV_ACCESS_KEY` (min 16 characters)

**Docs:** [DEV_ROUTES.md](./DEV_ROUTES.md)

---

### 9. Feature flags from environment 🟢

**Use for:** Graceful degradation when API keys are missing.

Examples in NullStay:

| Check | File |
|-------|------|
| Razorpay configured | `config/razorpay.js` → `isRazorpayConfigured()` |
| Email configured | `config/mail.js` → `isMailConfigured()` |
| Web Push configured | `config/webPush.js` → `isWebPushConfigured()` |
| Cache enabled | `config/cache.js` → `isCacheEnabled` |

Startup logs in `index.js` print enabled/disabled state — copy that pattern for any new integration.

---

### 10. Listing search builder 🟡

**Use for:** Dynamic MongoDB filters from query strings.

| Item | Location |
|------|----------|
| Filter builder | `utils/listingSearch.js` |

Generalize field names for products, jobs, events, etc.

---

## UI & UX patterns

### AJAX wishlist (no reload) 🟡

| Item | Location |
|------|----------|
| API | `routes/wishlistRoute.js` |
| Client | `public/js/wishlist.js` (or inline on listing cards) |
| CSS | `public/css/wishlist.css` |

Pattern: `fetch` POST → toggle class on heart → update `aria-pressed`.

---

### Landing layout for marketing pages 🟡

| Item | Location |
|------|----------|
| Layout | `views/layouts/landing.ejs` |
| Nav / footer | `views/includes/landingNav.ejs`, `landingFooter.ejs` |
| Shared CSS | `public/css/landing-pages.css`, `home.css` |

Reuse for Terms, Help, About on any product site.

---

### Home page live search mocks 🟡

| Item | Location |
|------|----------|
| Client | `public/js/home-mocks.js` |
| API | `GET /api/listings/search` |

Debounced fetch → render cards in hero sections without navigation.

---

### Booking widget + date blocking 🟡

| Item | Location |
|------|----------|
| Client | `public/js/bookingWidget.js` |
| Styles | `public/css/flatpickr-nullstay.css` |
| Overlap logic | `utils/bookingUtils.js` |

Portable to rentals, appointments, equipment booking — swap `Booking` model fields.

---

### Client-side image compression before upload 🟢

| Item | Location |
|------|----------|
| Script | `public/js/compressImage.js` |
| Limits | `public/js/imageFileLimits.js` |
| Upload UI | `public/js/imageUpload.js`, `galleryUpload.js` |

Reduces Cloudinary bandwidth and upload time.

---

### Flash messages 🟢

| Item | Location |
|------|----------|
| Constants | `utils/constants.js` → `FLASH_KEYS` |
| Partial | `views/includes/flash.ejs` |
| Setup | `connect-flash` in `index.js` |

---

### UI dialog component 🟢

| Item | Location |
|------|----------|
| CSS | `public/css/ui-dialog.css` |

Lightweight modal styling without a heavy UI framework.

---

## Integrations (plug-in style)

### Cloudinary uploads 🟡

| Item | Location |
|------|----------|
| Config | `config/cloudinary.js` |
| Upload util | `utils/uploadToCloudinary.js` |
| Multer middleware | `middleware/uploadMiddleware.js` |
| Image helpers | `utils/cloudinaryImages.js` |

**Docs:** [CLOUDINARY_IMAGE_UPLOAD_GUIDE.md](./CLOUDINARY_IMAGE_UPLOAD_GUIDE.md)

---

### Razorpay payments 🟡

| Item | Location |
|------|----------|
| Config | `config/razorpay.js` |
| Payment utils | `utils/razorpayPayments.js` |
| Checkout create | `utils/createBookingFromCheckout.js` |
| Client checkout | `public/js/checkout.js` |

Swap for Stripe with same “configured?” pattern and demo mode fallback.

---

### SMTP transactional email 🟢

| Item | Location |
|------|----------|
| Config | `config/mail.js` |
| Booking emails | `utils/bookingEmails.js` |
| Message emails | `utils/messageEmails.js` |

---

### Notifications: inbox + Socket.io + Web Push 🟡

| Layer | Key files |
|-------|-----------|
| Model | `models/notification.js` |
| Core API | `utils/notifyUser.js` |
| Socket | `config/socket.js` |
| Push | `config/webPush.js`, `utils/sendWebPush.js`, `routes/pushRoute.js` |
| Service worker | `public/sw.js` (if present) |
| Routes | `routes/notificationRoute.js` |

**Docs:** [NOTIFICATIONS_GUIDE.md](./NOTIFICATIONS_GUIDE.md) — full step-by-step to rebuild in another app.

---

### Passport local auth 🟡

| Item | Location |
|------|----------|
| User model | `models/user.js` (passport-local-mongoose) |
| Routes | `routes/userRoute.js` |
| Middleware | `middleware/authMiddleware.js` |

Standard stack for MVPs; swap OAuth later.

---

### Mongo session store 🟢

| Item | Location |
|------|----------|
| Store | `config/session.js` (`connect-mongo`) |

Works for any Express app needing persistent sessions.

---

## DevOps & developer experience

### Access app from phone on LAN 🟢

**Doc:** [ACCESS_FROM_PHONE.md](./ACCESS_FROM_PHONE.md)  
**Config:** `HOST=0.0.0.0`, `APP_URL`, console LAN URLs in `index.js`

---

### ESLint flat config 🟢

| Item | Location |
|------|----------|
| Config | `eslint.config.js` |

---

### LOC / project stats for portfolio 🟢

| Item | Location |
|------|----------|
| Counter | `utils/countLoc.js` |

Counts code lines by folder/extension — useful for resume “project size” claims. Wire to dev dashboard or a CLI script.

---

## What to extract vs rewrite

| Keep as-is | Adapt heavily | Reference only |
|------------|---------------|----------------|
| `wrapAsync`, cache, static cache, retention utils | Listing/booking models, search, Razorpay flow | EJS views (if you use React) |
| Dev access middleware, countLoc | Notification copy & event types | NullStay branding/CSS |
| Feature-flag config pattern | Socket room names per user | `data/sampleData.js` |

---

## Suggested copy map

When starting a **new** Express + MongoDB project, copy in this order:

1. `utils/wrapAsync.js` + `middleware/errorMiddleware.js`
2. `config/cache.js` + `utils/cache.js` + static cache middleware
3. `utils/pagination.js` + infinite-scroll client pattern
4. `config/devAccess.js` + dev dashboard (optional but fast win for demos)
5. Auth: `config/session.js` + Passport setup
6. One integration you need (Cloudinary **or** Razorpay **or** mail)
7. Notifications stack only if you need real-time alerts

---

## Minimal npm packages by feature

| Feature | Packages |
|---------|----------|
| Core | `express`, `mongoose`, `dotenv`, `ejs`, `ejs-mate` |
| Auth | `passport`, `passport-local`, `passport-local-mongoose`, `express-session`, `connect-mongo` |
| Validation | `joi` |
| Payments | `razorpay` |
| Images | `cloudinary`, `multer` |
| Email | `nodemailer` |
| Real-time | `socket.io` |
| Push | `web-push` |
| Dev zip export | `archiver` (^8 — use `{ ZipArchive }` import) |
| UX | `connect-flash`, `method-override` |

---

## Related docs in this repo

| Doc | Use when |
|-----|----------|
| [WEBSITE_FEATURES_AND_PERFORMANCE.md](./WEBSITE_FEATURES_AND_PERFORMANCE.md) | Full NullStay feature list + performance |
| [PERFORMANCE_IMPACT_RESUME.md](./PERFORMANCE_IMPACT_RESUME.md) | Metrics for resume/LinkedIn |
| [CACHING_GUIDE.md](./CACHING_GUIDE.md) | Teaching how cache was built |
| [NOTIFICATIONS_GUIDE.md](./NOTIFICATIONS_GUIDE.md) | Rebuilding notifications elsewhere |

---

*Use this document as a “feature library” when scaffolding your next project — copy the 🟢 items first, then 🟡 items with renamed models and routes.*

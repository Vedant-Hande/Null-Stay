# NullStay — Performance & product impact (resume format)

Summary of improvements from recent work: **in-memory caching**, **infinite scroll pagination**, **wishlist AJAX**, **landing/info pages**, and **booking retention**. Use these bullets on a resume, portfolio, or LinkedIn.

> **Note:** Timing ranges below are **typical local-dev estimates** from architecture (cache HIT vs MongoDB MISS), not lab benchmarks on your machine. Run your own test with `CACHE_DEBUG=true` and DevTools Network for exact numbers.

---

## Headline (one line)

**~80% less data on first listings load · &lt;2 ms cache hits · ~2 fewer DB calls per repeat search · 60s fresh catalog · AJAX wishlist saves ~1–2 s per click**

---

## Performance & scale

| Metric | Before (typical) | After | Improvement |
|--------|------------------|-------|-------------|
| Listings first paint (DB docs) | Load **all** matching listings + reviews | Load **12** per request | **~80–95%** fewer documents on first `/listings` visit (e.g. 60 listings → 12 = **80%** less) |
| Repeat catalog API (same filter/page, within 60s) | `countDocuments` + `find` + `populate` | In-memory cache **HIT** | **~2 MongoDB round-trips removed**; server DB time often **~40–150 ms → &lt;1–5 ms** for listing rows |
| In-memory cache read | N/A | `Map` lookup | **~0.1–2 ms** per key (data only, not full page) |
| Home featured listings (repeat visitors) | DB query every time | Shared cache (60s TTL) | **~1 DB query saved** per hit (~**30–80 ms** server-side, typical local MongoDB) |
| Listing detail (repeat views, same ID) | Full `findById` + nested populate | Cached lean document | **~1 heavy query saved** on HIT (~**50–200 ms** server-side, varies by review count) |
| Static assets (CSS/JS, return visit) | Re-fetched every time (dev) | `Cache-Control` **~1 day** in production | **~200–800 KB** less re-download per repeat session (depends on bundle size) |
| Infinite scroll page 2+ | Would require loading entire catalog upfront | Loads **12** at a time on demand | Initial HTML stays small; scroll loads only what’s needed |

---

## User experience

| Feature | Impact (resume-style) |
|---------|------------------------|
| **Infinite scroll** (`/listings`) | No page buttons; **12 listings** load first, more on scroll — faster first paint vs loading full catalog |
| **Server caching** | Popular paths (home, browse, API search, detail) serve repeat traffic with **sub-ms** memory reads vs **tens–hundreds of ms** DB work on miss |
| **Wishlist AJAX** | Heart toggle **without full page reload** — saves **~0.5–2 s** perceived wait per action |
| **Home landing** | Branded landing + **live search mocks** (`GET /api/listings/search`) — stronger first impression / discovery |
| **Info pages theme** | Help, Terms, Privacy, Hosting, etc. on shared **landing layout** — consistent brand across static pages |
| **Booking retention** | Auto-prune cancelled/rejected bookings after **15 days** — cleaner host/guest lists |

---

## Reliability & maintainability

| Item | Value |
|------|--------|
| Listings per chunk | **12** (`LISTINGS_PER_PAGE`) |
| Cache TTL | **60 s** default (`CACHE_TTL_SECONDS`) |
| Max cache keys | **300** (`CACHE_MAX_ENTRIES`) |
| Cache invalidation paths | **5** (create/update/delete listing, add/delete review) |
| Documentation | `PAGINATION.md`, `CACHING.md`, `CACHING_GUIDE.md` |

---

## Resume bullets (copy-paste)

- Reduced initial listings DB load by **~80%+** by paginating browse to **12 listings/chunk** with infinite scroll instead of loading the full catalog on first paint.
- Implemented **in-memory TTL caching** (60s, 300 keys) for home, catalog search, and listing detail — eliminates **~2 MongoDB queries per cache HIT** on repeat API/browse requests.
- Achieved **sub-millisecond (~0.1–2 ms) catalog data retrieval** on cache hits; full HTML/API responses still include EJS render + per-user wishlist lookup.
- Cut repeat static asset bandwidth **~200–800 KB/session** via production `Cache-Control` (**1 day**) on `/public` CSS/JS.
- Improved wishlist UX with **AJAX heart toggle** — no full page reload (**~0.5–2 s** saved per toggle, perceived).
- Shipped **branded landing** and **7+ info pages** on a shared layout with live listing search on the home page.
- Documented **pagination and caching** end-to-end for onboarding and future Redis migration.

---

## Timing clarification (for interviews)

| What | Realistic timing |
|------|------------------|
| **Cached listing rows only** (server memory) | **~0.1–2 ms** |
| **Full `/listings` HTML page** (EJS + network) | Usually **~50–400 ms** TTFB locally |
| **Full page in browser** (paint + images) | Often **~0.5–2 s** depending on images and network |

**Strong resume wording:**

> Cached catalog queries resolve in **&lt;2 ms** server-side; repeat browse/API requests avoid **~40–150 ms** of MongoDB work per hit.

Avoid claiming the **entire website** loads in 0.5 ms — that applies to **in-memory cache reads**, not full page delivery.

---

## How to verify on your machine

1. Add to `.env`: `CACHE_DEBUG=true`
2. Restart the server.
3. Open `/listings` and scroll — in DevTools → Network, open `GET /api/listings/search`:
   - First request: response header **`X-Cache: MISS`**
   - Same filter/page within 60s: **`X-Cache: HIT`**
4. Compare **Waiting (TTFB)** between MISS and HIT.

---

## Related docs

- [PAGINATION.md](./PAGINATION.md) — infinite scroll
- [CACHING.md](./CACHING.md) — cache configuration
- [CACHING_GUIDE.md](./CACHING_GUIDE.md) — how caching was built

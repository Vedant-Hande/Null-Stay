# NullStay — SEO guide

Technical SEO for NullStay: meta tags, crawl rules, XML sitemap, and indexing checklist.

---

## How SEO works (process)

1. **Technical SEO (code)** — titles, descriptions, canonical URLs, `robots.txt`, `sitemap.xml`
2. **On-page** — one `h1` per page, good listing copy, image `alt` text
3. **Indexing** — submit sitemap in [Google Search Console](https://search.google.com/search-console)
4. **Ongoing** — fix crawl errors, track impressions/clicks

Google indexes **public** pages only. Login, bookings, messages, checkout, and `/dev` are `noindex` and blocked in `robots.txt`.

---

## What we implemented

| Feature | Location |
|---------|----------|
| SEO builder | [`utils/seo.js`](../utils/seo.js) |
| Head partial | [`views/includes/seoHead.ejs`](../views/includes/seoHead.ejs) |
| Layouts | [`views/layouts/boilerplate.ejs`](../views/layouts/boilerplate.ejs), [`views/layouts/landing.ejs`](../views/layouts/landing.ejs) |
| Robots + XML sitemap | [`routes/seoRoute.js`](../routes/seoRoute.js) |
| Default `res.locals.seo` | [`index.js`](../index.js) middleware |
| Per-route overrides | Listing, info, auth, booking routes |

### Public pages (indexed)

- `/` — home
- `/listings` — browse (canonical includes filters when used)
- `/listings/:id` — listing detail + JSON-LD (`LodgingBusiness`, `AggregateRating` when reviews exist)
- `/help`, `/hosting`, `/terms`, `/privacy`, `/careers`, `/sitemap` (HTML nav)

### Private pages (`noindex`)

Login, signup, account, analytics, all `/bookings/*`, messages, notifications, wishlists, listing new/edit, checkout, errors.

### URLs for crawlers

| URL | Purpose |
|-----|---------|
| `/robots.txt` | Crawl rules + sitemap pointer |
| `/sitemap.xml` | XML sitemap for Google |
| `/sitemap` | Human-readable site map (unchanged) |

---

## Environment variables

```env
APP_URL=https://your-production-domain.com
SITE_NAME=NullStay
```

- **`APP_URL`** — must be your real public URL in production (no trailing slash). Drives canonical links, Open Graph URLs, and sitemap `<loc>` entries.
- Localhost is fine for development; Google will not index it.

---

## Verify locally

1. Restart the server after changing `.env`.
2. **View page source** on `/` and a listing — check `<title>`, `<meta name="description">`, `<link rel="canonical">`, Open Graph tags.
3. Open `http://localhost:8080/robots.txt` — should list `Disallow` rules and `Sitemap:` line.
4. Open `http://localhost:8080/sitemap.xml` — should list static pages + listing URLs.
5. Open a private page (e.g. `/login`) — `<meta name="robots" content="noindex, nofollow">`.
6. [Rich Results Test](https://search.google.com/test/rich-results) — paste a listing URL after deploy.

---

## After deploy (Search Console checklist)

- [ ] Set `APP_URL` to production HTTPS URL
- [ ] Add property in [Google Search Console](https://search.google.com/search-console)
- [ ] Submit `https://your-domain.com/sitemap.xml`
- [ ] Request indexing for `/` and 2–3 listing URLs
- [ ] Monitor **Pages** → indexing and crawl errors weekly
- [ ] Ensure listing images are HTTPS (Cloudinary URLs work for `og:image`)

---

## Performance and SEO

Fast pages help rankings. See [PERFORMANCE_IMPACT_RESUME.md](./PERFORMANCE_IMPACT_RESUME.md) and [CACHING.md](./CACHING.md) for cache and static asset `Cache-Control`.

---

## Not in v1 (future)

- Blog / content marketing
- `hreflang` for multiple languages
- Aggressive indexing of every filter query URL (duplicate content risk)
- Google Ads

---

## Related docs

- [WEBSITE_FEATURES_AND_PERFORMANCE.md](./WEBSITE_FEATURES_AND_PERFORMANCE.md)
- [ACCESS_FROM_PHONE.md](./ACCESS_FROM_PHONE.md) — LAN testing vs production URL

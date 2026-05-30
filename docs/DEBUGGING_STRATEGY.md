# Fast Debugging Strategy (How to Find Bugs Quickly)

This guide summarizes a practical workflow used while fixing NullStay issues (listing show crashes, infinite scroll “Could not load more”, wrong titles, contact form email). The goal is **find the real error first**, then **fix the smallest correct thing**—not guess in the dark.

---

## 1. Start at the symptom, end at the stack trace

| What you see | What to open first |
|--------------|-------------------|
| Red message in the browser | Browser **Network** tab → failed request → **Response** |
| Page half-loads / wrong data | Same request → check **status code** (404, 500, etc.) |
| Server “something broke” | Terminal running `nodemon` / `node index.js` — **last error + line number** |

**Example (this project):**

```text
TypeError: Cannot read properties of undefined (reading 'length')
    at routes/listingRoute.js:348:23
```

That single line tells you: **file**, **line**, **what was undefined** (`reviews`).

**Rule:** Never change random files until you have a stack trace or a failed HTTP status.

---

## 2. Read the error name (it narrows the search)

| Error type | Usually means |
|------------|----------------|
| `TypeError` | Wrong type or missing property (`undefined.length`) |
| `CastError` (Mongoose) | Bad `ObjectId` / wrong shape in a query |
| `ValidationError` | Joi/Mongoose schema rejected body |
| `EADDRINUSE` | Port already in use (old `node` still running) |
| Failed `fetch` / `res.ok` false | API returned 4xx/5xx — read server log for that route |

**Example (infinite scroll):**

```text
CastError: Cast to ObjectId failed for value "{ buffer: Uint8Array(12) [...] }"
at path "listing" for model "Wishlist"
```

That points to **wishlist query + bad IDs from cache**, not the front-end scroll script itself.

---

## 3. Grep the codebase (fastest “where is this?” tool)

Use ripgrep / IDE search for:

1. **Exact error text** — e.g. `Could not load more`
2. **Route path** — e.g. `/api/listings/search`
3. **Symbol from stack** — e.g. `getWishlistedIdsForUser`

```bash
# From project root (examples)
rg "Could not load more" .
rg "getWishlistedIdsForUser" .
rg "listingRoute.js" routes/
```

**Why it’s fast:** You jump straight to the UI message, API handler, or helper—no need to read the whole app.

---

## 4. Follow the request path (one feature at a time)

Draw a short chain for the broken feature:

```text
Browser scroll
  → public/js/listings-infinite.js (fetch)
  → GET /api/listings/search
  → routes/apiListingRoute.js
  → utils/listingCache.js (cached rows)
  → utils/wishlistIds.js (if logged in)
  → MongoDB Wishlist.find({ listing: { $in: [...] } })
```

Fix or log **one hop at a time**. For NullStay listing scroll, the break was between **cache** and **wishlist**, not in the EJS template.

---

## 5. Reproduce outside the browser (proves backend vs frontend)

### Quick API check (Node)

```bash
node -e "fetch('http://127.0.0.1:8080/api/listings/search?page=2&format=grid&limit=12').then(r=>console.log(r.status)).then(r=>r.json()).then(console.log)"
```

- **200** → server OK for that case; bug may be auth/session-only.
- **500** → read terminal stack trace immediately.

### Check data in MongoDB

When the UI “looks wrong” but might be data:

```bash
node -e "import('mongoose').then(async m=>{await m.connect(process.env.DB_URL||'mongodb://127.0.0.1:27017/null-stay');const L=(await import('./models/listing.js')).default;const d=await L.find({},'title').limit(5).lean();console.log(d);await m.disconnect();})"
```

**Example:** Multiple pages showing “Test 2” was partly **stale browser page after 500** + only one listing actually named “Test 2” in DB.

---

## 6. Separate “symptom” from “root cause”

| Symptom | Root cause (examples from this repo) |
|---------|--------------------------------------|
| “Could not load more” on scroll | API 500 → `CastError` on wishlist |
| Wrong listing title on every page | Show route crashed; browser showed last good page |
| Contact shows random name/email | Server prefilled `req.user` on GET `/contact` |
| Mail not sending | SMTP env / quoted `SMTP_PASS` / `SUPPORT_EMAIL` missing |

Fix the **root cause**, not only the message users see.

---

## 7. Tools checklist (what to use when)

| Tool | Use for |
|------|---------|
| **Terminal / nodemon log** | Stack traces, `[mail]`, `[support]` logs |
| **Browser DevTools → Network** | Which URL failed, status, response body |
| **Browser DevTools → Console** | Client JS errors (infinite scroll catch) |
| **Grep / IDE “Find references”** | Locate strings, functions, routes |
| **Read file at stack line ±20 lines** | See assumptions (`listing.reviews.length`) |
| **`curl` / `node -e fetch(...)`** | Repeat API without clicking UI |
| **MongoDB shell / one-off `node` script** | Verify documents, titles, IDs |
| **Git diff** | See what changed recently (cache, `structuredClone`) |

You do **not** need every tool every time. Order: **terminal → grep → read code → reproduce**.

---

## 8. Debugging workflow (copy this order)

```text
1. Reproduce once (note URL + logged in or not)
2. Read terminal / Network status + response
3. Grep error text or route
4. Open file:line from stack trace
5. Ask: what variable is wrong shape / undefined?
6. Trace backward: who passed it? (cache, populate, req.body)
7. Reproduce with fetch or DB query
8. Smallest fix + one manual retest
9. Hard refresh browser (Ctrl+Shift+R) if cache/CSS
```

---

## 9. Good habits that save hours

1. **Log once at the failure point** — e.g. `console.error('[support]', err.message)` (already used in contact route).
2. **Don’t swallow errors in the client** — `listings-infinite.js` throws on `!res.ok`; always check server when you see its message.
3. **Invalidate or avoid bad cache** — in-memory cache + `structuredClone` broke MongoDB `ObjectId`s; shallow copy + `String(id)` for queries fixed it.
4. **Guard optional data** — `const reviews = listing.reviews || []` before `.length`.
5. **One change, one retest** — avoids not knowing which fix worked.
6. **Env vars** — for email: `SMTP_*`, `SUPPORT_EMAIL`; strip quotes from passwords in `.env`.

---

## 10. NullStay-specific map (where bugs often hide)

| Area | Key files |
|------|-----------|
| Listing detail / reviews | `routes/listingRoute.js`, `utils/listingCache.js` |
| Infinite scroll API | `public/js/listings-infinite.js`, `routes/apiListingRoute.js`, `utils/wishlistIds.js` |
| Cache / ObjectIds | `utils/listingCache.js` (`getCachedListingSearch`, `cloneSearchRows`) |
| Contact / email | `routes/infoRoute.js`, `utils/supportEmail.js`, `config/mail.js` |
| Auth / session | `middleware/authMiddleware.js`, `index.js` (passport, flash) |
| Port in use | Kill PID on `8080`, restart `nodemon` |

---

## 11. When you’re stuck (5-minute checklist)

- [ ] Did nodemon restart after the save?
- [ ] Same bug logged out **and** logged in? (wishlist only when logged in)
- [ ] Network tab: which exact URL and status?
- [ ] Full stack trace copied from terminal?
- [ ] Recent change in cache, populate, or lean + clone?
- [ ] Tried hard refresh / incognito?
- [ ] DB actually has the data you expect?

---

## 12. What “fast” really means

Fast debugging is not typing fixes faster. It is:

1. **Getting a precise error** (stack or HTTP status) in under a minute  
2. **Searching the repo** instead of reading everything  
3. **Reproducing minimally** (one API call, one DB query)  
4. **Fixing one layer** (data shape, then UI)  

Use this doc as a checklist next time something breaks on NullStay—or any Node + EJS + MongoDB app with a similar layout.

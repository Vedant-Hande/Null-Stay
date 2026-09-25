# NullStay — Career guide (resume, interviews, job search)

Guide for positioning **NullStay** on your resume and in interviews. Written for: diploma IT + ~1 year startup experience, B.Tech 2nd year, working job + college, planning a switch.

---

## Verdict: Is NullStay resume-worthy in the AI era?

**Yes — if you can explain what you built and why, not only that you “used AI.”**

In 2026, recruiters don’t reject projects because AI exists. They reject candidates who:

- Can’t explain architecture, tradeoffs, or bugs they fixed
- Only have a pretty UI with no backend depth
- Claim metrics they can’t defend

### Why NullStay stands out

| Strength | Why it matters to recruiters |
|----------|------------------------------|
| **Real product shape** | Marketplace: listings, bookings, payments, reviews, messaging |
| **Integrations** | Razorpay, Cloudinary, SMTP, Socket.io, Web Push |
| **Performance work** | Pagination, in-memory cache, invalidation, static caching (documented) |
| **Auth & authorization** | Passport, review rules, owner checks |
| **Ops-minded docs** | Caching, pagination, notifications guides |

### Honest gaps (prepare answers)

- **EJS/SSR** not React/Next (fine for many startups; some want React)
- **In-memory cache** not Redis (designed for single-server + migration path)
- **Limited automated tests** in docs — be ready for “how do you test?”
- **AI tools:** answer honestly — AI helped speed; you own design, debugging, payments, cache, review auth

### One-line resume positioning

> Full-stack vacation-rental marketplace (Node/Express/MongoDB) with Razorpay payments, real-time notifications, booking overlap prevention, and performance optimizations (pagination + TTL cache).

---

## Your profile (how recruiters read you)

| Signal | How they see it |
|--------|------------------|
| Diploma IT + placement | Already worked professionally — positive |
| **1 year at startup** | Real experience; switching at 1 year is common in India |
| **B.Tech 2nd year + job** | Hustle; some HR ask about notice period and exams |
| Side project (NullStay) | Strong **if** deployed + demoable (GitHub + live URL or video) |

**Target band:** Associate / SDE-1 / Junior Full-Stack (~0–2 YOE), not “fresher only.”

---

## Resume bullets (use 3–5)

Only include what you can defend in interview:

1. Built end-to-end booking flow with **date overlap checks**, host approve/reject, and **Razorpay** checkout (test/live).
2. Implemented **infinite scroll** (12 items/page) and **TTL in-memory cache** with invalidation on listing/review changes; documented HIT/MISS with `CACHE_DEBUG`.
3. Shipped **real-time layer**: Socket.io notifications + optional **Web Push** (VAPID).
4. Integrated **Cloudinary** for listing images/galleries with client-side compression before upload.
5. Enforced **review authorization** (login, one review per user, host cannot self-review, owner-only delete).

**Also add:** GitHub link, live demo URL, stack line.

More metrics: [PERFORMANCE_IMPACT_RESUME.md](./PERFORMANCE_IMPACT_RESUME.md)  
Full feature list: [WEBSITE_FEATURES_AND_PERFORMANCE.md](./WEBSITE_FEATURES_AND_PERFORMANCE.md)

---

## Interview Q&A

### 1. “Walk me through NullStay in 2 minutes.”

**Structure:** Problem → users (guest/host) → stack → 3 hardest features → outcome.

> NullStay is an Airbnb-style stay marketplace. Guests search and book; hosts list properties and manage reservations. Backend is Node, Express, MongoDB with EJS views. Hardest parts: booking overlap prevention, Razorpay payment + booking state, and caching/pagination so browse doesn’t load the entire catalog. I also added Socket.io notifications and review auth so only eligible guests can post once.

---

### 2. “What did YOU build vs the team?”

Be specific. If solo, say solo. If team overlap, name modules you owned. Never claim the whole company’s work.

---

### 3. “Why in-memory cache instead of Redis?”

> Single-node deployment and fast iteration. Cache keys are per search/page/listing with 60s TTL and explicit invalidation on writes. For multi-instance production I’d move to Redis and keep the same key strategy. User-specific data like wishlists stays out of cache.

**Related files:** `config/cache.js`, `utils/listingCache.js`, [CACHING.md](./CACHING.md)

---

### 4. “How does double-booking prevention work?”

> On checkout/reserve, the server queries existing bookings for that listing and checks date range overlap. The frontend Flatpickr disables booked ranges, but the server is the source of truth for race conditions.

**Review before interview:** `utils/bookingUtils.js`, booking routes.

---

### 5. “Explain the Razorpay flow.”

> Create order on server with amount from nights × rate + fees → client opens Razorpay checkout → verify signature on callback → create/update booking → send email/notification. Test keys in dev, live keys for production.

**Related:** `config/razorpay.js`, `utils/razorpayPayments.js`, `utils/createBookingFromCheckout.js`

---

### 6. “How do notifications work?”

> Three layers: MongoDB inbox, Socket.io for live tab updates, Web Push with service worker when VAPID is configured. Booking events trigger notification helpers.

**Related:** [NOTIFICATIONS_GUIDE.md](./NOTIFICATIONS_GUIDE.md)

---

### 7. “How did you handle review authentication?”

> POST requires login + middleware: not listing owner, no duplicate review. DELETE only review owner. UI hides form/delete for unauthorized users; server enforces again.

**Related:** `middleware/authMiddleware.js`, `utils/reviewEligibility.js`, `routes/reviewRoute.js`

---

### 8. “What would you improve next?”

Strong answers: Redis cache, unit/integration tests, React or API-first frontend, CI/CD, MongoDB indexes on search fields, rate limiting, OAuth.

---

### 9. “You used AI — what’s really yours?”

> AI helped with boilerplate and docs. I designed routes, cache invalidation, payment verification, booking rules, and debugged issues like ESM imports and port conflicts. I can walk through any file and explain changes.

**Offer:** “Ask me to explain `listingCache.js` or the booking create flow live.”

---

### 10. “Why leave after 1 year?”

> I learned [specific skills] at [company]. I’m pursuing B.Tech while working and want [stronger mentorship / larger product / clearer growth]. I’m committed to proper notice and planning around exams.

**Avoid** badmouthing your current employer.

---

### 11. “Can you manage job + college?”

> I’ve done both for [X months]. I block exam weeks early, communicate clearly, and don’t commit to deadlines I can’t meet.

---

### 12. DSA / fundamentals

Expect: arrays, strings, OOP basics, MongoDB queries, HTTP/REST, session vs JWT. For many startups at ~1 YOE, a solid project + medium DSA is often enough.

---

## Behavioral questions (STAR format)

- **Conflict or missed deadline** — Situation, Task, Action, Result
- **Production bug** — logs, Network tab, `CACHE_DEBUG`, MongoDB state
- **Fastest learning** — e.g. Razorpay or Socket.io integration

---

## Where to apply (India, ~1 YOE)

### Tier A — Strong fit

- Early-stage startups (SDE-1, Associate Engineer, Full Stack 0–2 yrs)
- SaaS / fintech / edtech / proptech using Node + MongoDB
- Payment-adjacent startups (Razorpay experience helps)
- Remote-first startups (be upfront about college schedule)

### Tier B — Achievable with DSA + project

- Mid-size product companies (0–2 or 1–3 yrs bands)
- IT services with product teams (verify product work vs bench)

### Tier C — Harder now

- Big tech — heavy DSA + competition
- Pure AI/ML roles — unless you have separate ML work

### Channels

- LinkedIn (Open to Work + short demo video)
- Naukri, Instahyre, Wellfound, Cutshort
- Referrals (best conversion)
- GitHub + deployed URL on every application

**Search terms:** `Node.js developer 1 year India`, `associate full stack remote India`

Apply consistently (e.g. 20–40 relevant roles per week) and tailor bullets to each JD (payments, real-time, performance).

---

## AI-era positioning

| Do | Don’t |
|----|--------|
| Demo live app + GitHub | Screenshots only |
| Explain tradeoffs (cache, auth, payments) | Buzzwords without depth |
| Mention AI as a **tool** | “AI built my entire project” |
| Point to docs you wrote | Fake benchmarks you didn’t measure |
| Prepare one debug/failure story | “Everything worked first time” |

---

## Pre-apply checklist

- [ ] Deploy NullStay (free tier OK) — URL on resume
- [ ] 90-second screen recording: search → listing → book
- [ ] Clean GitHub — no `.env` secrets, solid README
- [ ] LinkedIn headline: `Full-Stack Developer | Node.js, MongoDB | ~1 YOE`
- [ ] Notice period on resume (e.g. 30 days or negotiable)
- [ ] Run `CACHE_DEBUG=true` once — speak HIT/MISS honestly

---

## Bottom line

**NullStay is eligible for junior/associate full-stack roles at Indian startups**, especially where they value payments, real-time features, and performance thinking. In the AI era, your edge is **proving you understand the system you shipped** — rehearse cache, bookings, notifications, and review auth.

---

## Related project docs

- [WEBSITE_FEATURES_AND_PERFORMANCE.md](./WEBSITE_FEATURES_AND_PERFORMANCE.md)
- [PERFORMANCE_IMPACT_RESUME.md](./PERFORMANCE_IMPACT_RESUME.md)
- [REUSABLE_FEATURES_FOR_OTHER_PROJECTS.md](./REUSABLE_FEATURES_FOR_OTHER_PROJECTS.md)
- [NOTIFICATIONS_GUIDE.md](./NOTIFICATIONS_GUIDE.md)
- [CACHING_GUIDE.md](./CACHING_GUIDE.md)
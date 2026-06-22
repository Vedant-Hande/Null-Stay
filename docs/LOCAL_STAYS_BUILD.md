# NullStay local stays — what we built (step-by-step)

This document describes the **local stays pivot**: rooms, PG, and flats in **multiple cities** (Pune, Nashik, Mumbai, Nagpur, Aurangabad). It lists what was built, what was **not** built, and how the code works.

**Related:** [LOCAL_STAYS_PRODUCT_AND_MARKETING.md](./LOCAL_STAYS_PRODUCT_AND_MARKETING.md) (strategy), [SEARCH.md](./SEARCH.md) (search flow).

---

## Table of contents

1. [Summary](#1-summary)
2. [What we built](#2-what-we-built)
3. [What we did NOT build](#3-what-we-did-not-build)
4. [How we built it (step-by-step with code)](#4-how-we-built-it-step-by-step-with-code)
5. [How to test](#5-how-to-test)
6. [Files changed (checklist)](#6-files-changed-checklist)

---

## 1. Summary

**Before:** NullStay looked like a vacation-rental site (Goa, pools, beachfront, price per night).

**After:** Same engine, repositioned for **local stays** — PG, rooms, flats — with **city**, **area**, **property type**, **monthly rent**, and filters for **who it’s suitable for**.

The app is still one codebase. Old listings without `city` still work; new listings should fill city + property type.

---

## 2. What we built

| # | Feature | What it does |
|---|---------|----------------|
| 1 | **City field** | Each listing can be tied to `pune`, `nashik`, `mumbai`, etc. |
| 2 | **Area / locality** | Dropdown per city (Hinjewadi, College Road, …) |
| 3 | **Property type** | PG, shared room, 1BHK, hostel, family house, … |
| 4 | **Price unit** | Rent **per month** or **per night** |
| 5 | **Suitable for** | Students, family, bachelors, girls-only PG, boys-only PG |
| 6 | **Security deposit** | Optional deposit amount on listing |
| 7 | **Search & filters** | Filter by `city`, `q` (area/keyword), `propertyType`, `suitableFor`, price |
| 8 | **Homepage rebrand** | Copy + city/area search (not Goa vacation) |
| 9 | **Listings page UI** | Property-type chips + city pills; price shows `/mo` or `/night` |
| 10 | **Navbar search** | City dropdown + area keyword (replaces country-only) |
| 11 | **Host forms** | New/edit listing: city, area, type, rent period, suitable for, local amenities |
| 12 | **Listing detail badges** | City, area, type, monthly/nightly, suitable-for tags |
| 13 | **Booking card** | Shows `month` or `night` next to price |
| 14 | **SEO copy** | Home + browse meta descriptions for local stays |
| 15 | **Config module** | `utils/localStaysConfig.js` — single place for cities, areas, labels |
| 16 | **Social share** | Share modal + copy link + WhatsApp/X/LinkedIn/Facebook share links |

---

## 3. What we did NOT build

| Not built | Why / when to add |
|-----------|-------------------|
| **Separate app per city** | One DB + `city` field is enough |
| **Monthly payment checkout** | Still uses nightly booking math + Razorpay; monthly rent is display-first |
| **“Enquire only” without payment** | Can use request-to-book; no dedicated “Visit PG” button yet |
| **Owner phone on listing** | Still message-in-app only |
| **Verified landlord badge** | Manual process; no admin UI |
| **WhatsApp enquiry to owner** | Can add “Chat on WhatsApp” (owner number + consent) later |
| **Auto-migrate old listings** | Old rows have empty `city`; hosts should edit and set city |
| **Map search (all pins)** | Map still one listing per detail page |
| **Hindi UI** | English only |
| **Broker dashboard** | Same host account as owner |
| **Rent agreement / e-sign** | Out of scope |
| **Dedicated `/pune` URLs** | Uses `?city=pune` query param for now |

---

## 4. How we built it (step-by-step with code)

### Step 1 — Central config (`utils/localStaysConfig.js`)

**Why:** Cities, areas, and labels should not be scattered in 10 files.

**What we added:**

- `CITIES` — Pune, Nashik, Mumbai, Nagpur, Aurangabad  
- `AREAS_BY_CITY` — e.g. `pune: ['Hinjewadi', 'Wakad', …]`  
- `PROPERTY_TYPES` — pg, shared_room, 1bhk, …  
- `SUITABLE_FOR_OPTIONS` — students, family, …  
- `LOCAL_AMENITIES` — Wifi, AC, food included, …  
- Helpers: `formatPriceLabel()`, `formatPriceShort()`, `getCityLabel()`, …

**How views use it:** `index.js` sets `res.locals.localStays = localStays` so every EJS template can use `localStays.CITIES`, etc.

```javascript
// index.js (middleware)
res.locals.localStays = localStays;
res.locals.formatPriceShort = localStays.formatPriceShort;
res.locals.getCityLabel = localStays.getCityLabel;
```

---

### Step 2 — Database fields (`models/listing.js`)

**Why:** MongoDB needs fields to store city, type, and monthly rent.

**New fields:**

| Field | Type | Purpose |
|-------|------|---------|
| `city` | String, indexed, lowercase | `pune`, `nashik`, … |
| `area` | String | Hinjewadi, College Road |
| `propertyType` | enum | pg, 1bhk, … |
| `priceUnit` | `night` \| `month` | Default `month` |
| `suitableFor` | [String] | Tags array |
| `deposit` | Number | Optional |
| `houseRules` | String | Reserved for future UI |

**Note:** Existing listings in DB keep working; missing `city` shows location + country only.

---

### Step 3 — Validation (`schemas/listing.js`)

**Why:** Block bad data on create/update.

**What changed:**

- Joi rules for `city`, `area`, `propertyType`, `priceUnit`, `suitableFor[]`, `deposit`
- `suitableFor` uses same array pattern as `amenities` (checkboxes → array)
- `city` optional in Joi so **old listings** can still be edited

---

### Step 4 — Search filter (`utils/listingSearch.js`)

**Why:** Browse page must filter by city and property type.

**Logic:**

```javascript
if (city?.trim()) {
  filter.city = city.trim().toLowerCase();
}
if (propertyType?.trim()) {
  filter.propertyType = propertyType.trim();
}
if (suitableFor?.trim()) {
  filter.suitableFor = suitableFor.trim(); // matches array contains
}
```

Text search (`q`) also searches `city` and `area` in the `$or` regex block.

**Legacy:** Old `category` (pools, beachfront) still works via `CATEGORY_KEYWORDS`.

---

### Step 5 — Save listing (`routes/listingRoute.js`)

**Why:** City must be stored consistently.

```javascript
if (newListing.city) {
  newListing.city = String(newListing.city).trim().toLowerCase();
}
```

Same on `PUT` update.

**Map:** Geocode string now includes area + city:

```javascript
geocodeLocation(
  [listing.area, listing.location, listing.city, listing.country].filter(Boolean).join(", "),
  listing.country,
);
```

---

### Step 6 — Host forms (EJS partials)

**Files:**

- `views/includes/localStaysFormFields.ejs` — city select, area select, property type, street  
- `views/includes/localStaysSuitableFor.ejs` — checkboxes  
- `public/js/listingCityAreas.js` — when city changes, fill area dropdown from `AREAS_BY_CITY`

**Used in:** `newListing.ejs`, `editListing.ejs`

**Pricing step:** Rent period (`priceUnit`) + deposit + optional cleaning/service fee.

---

### Step 7 — Browse UI

**`views/layouts/boilerplate.ejs`**

- Expanded search: **City** dropdown + **Area/keyword** input  
- Listings bar: **Property type** links + **City** pills  

**`views/listings/listings.ejs`**

- Filter chips for city, property type, suitable for  
- Cards show `formatPriceShort(price, priceUnit)` → `₹8,000/mo`  
- `data-search` JSON includes new params for infinite scroll  

**`public/js/listings-infinite.js`**

- Uses `listing.priceLabel` from API for loaded cards  

---

### Step 8 — API (`routes/apiListingRoute.js` + `utils/serializeListing.js`)

**Why:** Infinite scroll must return new fields.

`serializeListingForGrid` adds:

```javascript
priceLabel: priceUnit === "night" ? "₹X/night" : "₹X/mo",
city, area, propertyType, priceUnit,
```

---

### Step 9 — Homepage (`views/home.ejs`)

- Headline: rooms & flats in your city  
- Hero search: **city** select + **area** text + guests  
- Badge: Pune, Nashik & more  

---

### Step 10 — Listing detail (`views/listings/show.ejs`)

- Badges: city · area, property type, monthly/nightly, suitable-for tags  
- Booking card: `/month` or `/night` label  

---

### Step 11 — SEO (`utils/seo.js`)

- Home title/description mention PG, flats, Pune/Nashik  
- Listings index SEO includes `city`, `propertyType` in filter text  

---

## 5. How to test

1. **Restart server** (`nodemon index.js`).
2. **Create listing** → `/listings/new` → pick **Pune**, area **Hinjewadi**, type **PG**, rent **per month**, suitable for **Students**.
3. **Browse** → `/listings?city=pune` → see your listing.
4. **Filter** → click **PG / Paying guest** chip or **Pune** pill.
5. **Detail page** → badges and `₹X/mo` on booking card.
6. **Edit old listing** → add city if missing.

**MongoDB check:**

```bash
mongosh "mongodb://localhost:27017/null-stay" --eval "db.listings.findOne({}, {title:1, city:1, propertyType:1, priceUnit:1, suitableFor:1})"
```

---

## 6. Files changed (checklist)

| File | Change |
|------|--------|
| `utils/localStaysConfig.js` | **New** — cities, areas, types, labels |
| `models/listing.js` | New schema fields |
| `schemas/listing.js` | Joi validation |
| `utils/listingSearch.js` | Filters for city, type, suitableFor |
| `utils/serializeListing.js` | Grid JSON + priceLabel |
| `index.js` | `res.locals.localStays` + helpers |
| `routes/listingRoute.js` | Normalize city; geocode string |
| `routes/apiListingRoute.js` | Query echo |
| `utils/seo.js` | Local stays meta |
| `views/includes/localStaysFormFields.ejs` | **New** |
| `views/includes/localStaysSuitableFor.ejs` | **New** |
| `public/js/listingCityAreas.js` | **New** |
| `views/listings/newListing.ejs` | Partials + pricing |
| `views/listings/editListing.ejs` | Partials + pricing |
| `views/listings/listings.ejs` | Chips + price display |
| `views/listings/show.ejs` | Badges |
| `views/layouts/boilerplate.ejs` | Search + filter bar |
| `views/home.ejs` | Rebrand + city search |
| `views/includes/bookingCard.ejs` | month/night label |
| `public/js/listings-infinite.js` | priceLabel on cards |
| `docs/LOCAL_STAYS_BUILD.md` | **This file** |

---

## Product vs website (after this build)

| | Status |
|---|--------|
| **Website / product code** | Yes — local stays features are implemented |
| **Real marketplace** | Only when you add **real listings** in Pune/Nashik and market locally |
| **Your next step** | 20 real PG/flats in one city + Instagram/WhatsApp per [LOCAL_STAYS_PRODUCT_AND_MARKETING.md](./LOCAL_STAYS_PRODUCT_AND_MARKETING.md) |

---

*Build completed: local stays data model, search, UI rebrand, host forms, multi-city filters.*

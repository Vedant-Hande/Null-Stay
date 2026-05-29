# Developer-only routes

These endpoints are **hidden from the public**: wrong or missing credentials return **404** (same as a missing page).

---

## Setup

Add to `.env` (at least **16 characters**):

```env
DEV_ACCESS_KEY=your_long_random_secret_here
```

Restart the server.

---

## Lines of code — `GET /dev/loc`

Counts source under the project (routes, views, public, utils, models, docs, etc.). Excludes `node_modules`, `package-lock.json`, and similar.

### Access

**Query string**

```http
GET /dev/loc?key=YOUR_DEV_ACCESS_KEY
```

**Header**

```http
GET /dev/loc
X-Dev-Access-Key: YOUR_DEV_ACCESS_KEY
```

### Response formats

| URL | Output |
|-----|--------|
| `/dev/loc?key=...` | JSON (default) |
| `/dev/loc?key=...&format=html` | Simple HTML dashboard |

### JSON fields

- `totals.code` — non-blank, non-comment lines (main “LOC” number)
- `totals.total` — all lines in files
- `byTopLevelFolder` — breakdown by folder
- `byExtension` — breakdown by `.js`, `.ejs`, `.css`, `.md`, `.json`
- `files` — per-file detail

---

## Security notes

- Do **not** commit `DEV_ACCESS_KEY` to git.
- Use a long random string (e.g. 32+ chars).
- If `DEV_ACCESS_KEY` is unset, `/dev/*` always returns 404.

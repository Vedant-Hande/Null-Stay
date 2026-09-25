# Developer-only routes

Private dashboard: **system status** + **codebase LOC summary**. Wrong or missing credentials return **404**.

---

## Setup

Add to `.env` (at least **16 characters**):

```env
DEV_ACCESS_KEY=your_long_random_secret_here
```

Restart the server.

---

## Dashboard — `GET /dev`

### Access

```http
GET /dev?key=YOUR_DEV_ACCESS_KEY
```

Or header:

```http
GET /dev
X-Dev-Access-Key: YOUR_DEV_ACCESS_KEY
```

### Formats

| URL | Output |
|-----|--------|
| `/dev?key=...` | HTML dashboard (default in browser) |
| `/dev?key=...&format=json` | JSON (`loc` + `server`) |

Legacy URLs redirect to `/dev`:

- `/dev/loc?key=...`
- `/dev/status?key=...`

Public `/status` was removed; use `/dev` with your key.

---

## Folder downloads — `GET /dev/download/:target`

Download a project folder or file as a **zip** (requires dev key).

Examples:

```http
GET /dev/download/views-listings?key=YOUR_DEV_ACCESS_KEY
GET /dev/download/routes?key=YOUR_DEV_ACCESS_KEY
GET /dev/download/models?key=YOUR_DEV_ACCESS_KEY
```

Available targets are listed on the dashboard under **Download folders**, or in JSON at `GET /dev?key=...&format=json` → `downloads[]`.

Excludes `node_modules`, `.git`, `.env`, and similar from archives.

---

## JSON fields

- `loc` — lines of code (`totals`, `byTopLevelFolder`, `byExtension`, `files`)
- `server` — uptime, memory, MongoDB, integrations (cache, email, Razorpay, web push)

---

## Security

- Do **not** commit `DEV_ACCESS_KEY` to git.
- Use a long random string (32+ chars).
- If unset, `/dev/*` always returns 404.

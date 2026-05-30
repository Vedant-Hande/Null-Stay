# NullStay logging

Structured logging for the Node/Express app: colored console output in development, optional daily log files, HTTP request logging, and namespaced modules.

## Quick start

Defaults (no `.env` changes):

- Console logs at **info** level and above
- **HTTP** requests logged (skips static assets: `/css`, `/js`, `/img`)
- Errors include stack traces in the **error** middleware

Optional in `.env`:

```env
LOG_LEVEL=debug
LOG_HTTP=true
LOG_TO_FILE=true
```

Restart the server after changing env vars.

## Log levels

| Level | Use for |
|-------|---------|
| `error` | Failures, 5xx, uncaught exceptions |
| `warn` | 4xx, skipped mail, retention issues |
| `info` | Startup, DB connected, mail sent |
| `http` | Request line (method, URL, status, ms) |
| `debug` | Verbose detail (mail skipped, cache) |

Set `LOG_LEVEL=debug` to see everything; use `error` in production if you only want failures.

## Log files

When `LOG_TO_FILE=true` (or `NODE_ENV=production`):

- Path: `logs/app-YYYY-MM-DD.log`
- Format: one JSON object per line (easy to grep or ship to a log tool)
- Git ignores `logs/*.log`

Example line:

```json
{"ts":"2026-05-30T10:00:00.000Z","level":"http","module":"http","message":"GET /listings","meta":{"status":200,"ms":42}}
```

## Use in your code

```js
import { createLogger } from "../config/logger.js";

const log = createLogger("bookings");

log.info("Booking created", { bookingId: booking._id });
log.warn("Payment pending", { bookingId });
log.error("Razorpay verify failed", err);
log.debug("Payload", { body: req.body });
```

Do **not** log passwords, SMTP secrets, or full card data.

## What is already wired

| Module | Logger name |
|--------|-------------|
| App startup | `app` |
| HTTP requests | `http` |
| Global errors | `error` |
| MongoDB | `db` |
| SMTP | `mail` |
| Contact form | `support` |
| Process crashes | `app` (uncaughtException / unhandledRejection) |

Files:

- `config/logger.js` — core logger
- `middleware/requestLogger.js` — HTTP middleware
- `middleware/errorMiddleware.js` — logs every handled error

## Disable noise

```env
LOG_HTTP=false
```

Stops per-request logs (still logs errors).

## Related

- [DEBUGGING_STRATEGY.md](./DEBUGGING_STRATEGY.md) — how to use logs + terminal to find bugs fast

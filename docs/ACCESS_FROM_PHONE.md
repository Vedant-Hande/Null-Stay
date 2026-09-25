# Access NullStay from your phone (LAN & port forwarding)

## Quick fix (same Wi‑Fi — no router setup)

Port forwarding is **not required** if your phone and PC are on the **same Wi‑Fi**.

1. Restart the server after updating (it listens on `0.0.0.0` by default).
2. In the terminal you should see lines like:
   ```text
   Reach this PC on your LAN (phone on same Wi‑Fi):
     → http://192.168.1.5:8080
   ```
3. On your phone browser, open that **exact** URL (not `localhost`).
4. In `.env`, set `APP_URL` to the same address, e.g. `APP_URL=http://192.168.1.5:8080`, then restart.

Find your IP manually (Windows): `ipconfig` → **IPv4 Address** under Wi‑Fi.

---

## If port forwarding still does not work

### 1. Server must listen on all interfaces

In `.env`:

```env
HOST=0.0.0.0
CONN_PORT=8080
```

Restart nodemon. You should see the LAN URLs in the console.

### 2. Windows Firewall — allow inbound port 8080

Run **PowerShell as Administrator**:

```powershell
New-NetFirewallRule -DisplayName "NullStay Dev 8080" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

### 3. Router port forward settings

| Setting | Example |
|---------|---------|
| External / WAN port | `8080` (or any port you choose) |
| Internal IP | Your PC’s LAN IP (e.g. `192.168.1.5`) — from `ipconfig` |
| Internal port | `8080` |
| Protocol | TCP |

Test **LAN first** (`http://192.168.x.x:8080` on phone). Only then test from **mobile data** using your **public IP**:

- Visit [https://whatismyip.com](https://whatismyip.com) on the PC.
- On phone (mobile data): `http://YOUR_PUBLIC_IP:8080`

### 4. Common blockers

| Problem | What to do |
|---------|------------|
| `localhost` on phone | Use PC LAN IP or public IP, never `localhost` |
| PC IP changed (DHCP) | Reserve a fixed IP in the router, or update port forward |
| ISP CGNAT / no public IP | Port forward from the internet **won’t work** — use [ngrok](https://ngrok.com) or deploy (Render, Railway, etc.) |
| MongoDB | Stays on `127.0.0.1` on the PC — only the Node app must be reachable |
| HTTPS required (push on iOS) | Use ngrok HTTPS URL or a deployed host with SSL |

### 5. Easier alternative: ngrok (no router)

```bash
npx ngrok http 8080
```

Use the `https://....ngrok-free.app` URL on your phone. Set in `.env`:

```env
APP_URL=https://your-subdomain.ngrok-free.app
```

---

## Checklist

- [ ] `HOST=0.0.0.0` in `.env`
- [ ] Server restarted; LAN URL printed in terminal
- [ ] Phone on same Wi‑Fi → open `http://192.168.x.x:8080`
- [ ] Windows Firewall rule for port 8080
- [ ] Router forward: WAN port → PC LAN IP:8080
- [ ] `APP_URL` matches the URL you use on the phone

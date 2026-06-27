# Trackr Push Worker

Sends due-date reminders as Web Push notifications so users get them **even when
the app is completely closed**. It scans Supabase on an interval and pushes to
each subscribed device using the VAPID keys.

## One-time setup

1. **Create the push tables** — in the Supabase dashboard → SQL Editor, run
   [`../supabase/push.sql`](../supabase/push.sql).

2. **Install deps** (already done if you ran `npm install` here):
   ```bash
   cd server && npm install
   ```

3. **VAPID keys** — already generated and placed in `.env` / the frontend `.env`.
   To make new ones: `npm run vapid`, then put the public key in BOTH
   `server/.env` (`VAPID_PUBLIC_KEY`) and the frontend `.env`
   (`VITE_VAPID_PUBLIC_KEY`), and the private key in `server/.env`.

4. **Service role key** — open `server/.env` and set `SUPABASE_SERVICE_ROLE_KEY`
   from Supabase → Project Settings → API → `service_role` (secret).
   ⚠️ This key bypasses Row Level Security. Keep it server-side only.

## Run it

```bash
cd server && npm start
```

Leave it running. Every `SCAN_INTERVAL_SECONDS` (default 60) it checks for
reminders that are due and pushes any that haven't been sent yet.

## How it fits together

- The browser subscribes via the service worker ([`../public/sw.js`](../public/sw.js))
  and saves the subscription + reminder prefs to the `push_subscriptions` table
  (toggled from Settings → Notifications → "Remind me when the app is closed").
- This worker reads those subscriptions + each user's assignments, computes which
  reminders are due, and sends them with `web-push`.
- The `push_sent` table dedupes so each reminder is delivered once per device.
- Expired/revoked subscriptions (HTTP 404/410) are removed automatically.

## Notes

- Local dev over `http://localhost` works for Web Push. In production the app
  must be served over **HTTPS**.
- For real deployment, run this worker as a long-lived process (e.g. a small VM,
  Railway/Render/Fly worker, or a systemd service). A serverless cron also works
  if you convert the `scan()` call into a single invocation.

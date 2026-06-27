# Deploying Trackr to Vercel

Vercel hosts the **frontend** (the Vite/React app). Supabase already hosts your
database + auth. The **push worker** (`server/`) can't run on Vercel (it's a
long-running process) — see the last section for options.

## 1. Put the project in its own GitHub repo

From the project folder:

```bash
cd ~/Projects/studyflow
git init
git add -A
git commit -m "Trackr initial commit"
```

Then create an **empty** repo on github.com (no README), and push:

```bash
git remote add origin https://github.com/<you>/trackr.git
git branch -M main
git push -u origin main
```

> Secrets are safe: `.env` and `server/.env` are gitignored, so your keys are
> not committed.

## 2. Import the repo into Vercel

1. Go to **vercel.com** → sign in (use "Continue with GitHub").
2. **Add New… → Project** → import your `trackr` repo.
3. Vercel auto-detects **Vite**. Leave the defaults:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

## 3. Add environment variables (before the first deploy)

In the import screen (or Project → Settings → Environment Variables), add these
three. Copy the values from your local `.env` file — they're all safe to expose
in a browser bundle:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://fzypzdyxwsnismzooucr.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (the long anon key from `.env`) |
| `VITE_VAPID_PUBLIC_KEY` | (the VAPID public key from `.env`) |

Then click **Deploy**. You'll get a URL like `https://trackr.vercel.app`.

## 4. Point Supabase auth at the new domain

So signup/confirmation/password emails link back to your live site:

- Supabase Dashboard → **Authentication → URL Configuration**
  - **Site URL**: `https://your-app.vercel.app`
  - **Redirect URLs**: add `https://your-app.vercel.app/**`

(Localhost keeps working for dev.)

## 5. Done — verify

Visit the Vercel URL, sign in, and check the dashboard, calendar, deep links
(refresh on `/settings`), and notifications. HTTPS is automatic, so the service
worker + in-tab desktop notifications work in production.

---

## The push worker (closed-app notifications)

`server/index.js` is an always-on process, which Vercel's serverless model
doesn't support. Pick one:

- **Easiest: host the worker on an always-on service** — Railway, Render, or
  Fly.io. Deploy the `server/` folder, set the same env vars as `server/.env`
  (including the **service_role** key), and run `npm start`. It keeps scanning
  and pushing.
- **Vercel Cron + a serverless function** — convert `scan()` into an API route
  triggered by a Vercel Cron job. Note: on the Hobby plan, cron runs at most
  once per day, which is too coarse for hour-level reminders; the Pro plan
  allows frequent schedules. Ask and I'll refactor it.

Until the worker is hosted somewhere always-on, **in-tab** notifications (the
bell + "Desktop alerts") still work whenever the app is open — only the
"remind me when the app is closed" path needs the worker running.

## Auto-deploys

Once connected, every `git push` to `main` triggers a new Vercel deploy
automatically. Pull requests get their own preview URLs.

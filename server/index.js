import 'dotenv/config'
import webpush from 'web-push'
import ws from 'ws'
import { createClient } from '@supabase/supabase-js'

// Node 18 has no global WebSocket, which newer supabase-js requires. We only use
// the REST API here, but the client constructs a realtime client regardless, so
// polyfill it. (Upgrading to Node 20+ also resolves this.)
if (!globalThis.WebSocket) globalThis.WebSocket = ws

const {
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT = 'mailto:admin@example.com',
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SCAN_INTERVAL_SECONDS = '60',
} = process.env

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars. Copy .env.example to .env and fill it in (see README).')
  process.exit(1)
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

// Service-role client bypasses RLS so the worker can read every user's data.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const isToday = (d) => {
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

// Mirrors the client-side notification logic, driven by each subscription's
// stored preferences.
function buildNotifications(sub, assignments, now) {
  const out = []
  for (const a of assignments) {
    if (a.completed) continue
    const due = new Date(a.due_date)
    const diffHrs = (due - now) / 3600000

    if (due - now < 0) {
      if (sub.overdue) {
        out.push({
          key: `${a.id}:overdue`,
          title: a.title,
          body: `Overdue — was due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        })
      }
      continue
    }

    if (sub.reminder && diffHrs <= sub.hours_before) {
      const hrs = Math.max(1, Math.round(diffHrs))
      out.push({
        key: `${a.id}:reminder`,
        title: a.title,
        body: hrs <= 1 ? 'Due within the hour' : `Due in about ${hrs} hours`,
      })
    } else if (sub.due_today && isToday(due)) {
      out.push({
        key: `${a.id}:today`,
        title: a.title,
        body: `Due today at ${due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
      })
    }
  }
  return out
}

async function alreadySent(endpoint, key) {
  const { data } = await supabase
    .from('push_sent')
    .select('notif_key')
    .eq('endpoint', endpoint)
    .eq('notif_key', key)
    .maybeSingle()
  return Boolean(data)
}

async function scan() {
  const now = new Date()

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('enabled', true)
  if (error) {
    console.error('Failed to load subscriptions:', error.message)
    return
  }
  if (!subs || subs.length === 0) return

  const userIds = [...new Set(subs.map((s) => s.user_id))]
  const { data: assignments, error: aErr } = await supabase
    .from('assignments')
    .select('id, title, due_date, completed, user_id')
    .in('user_id', userIds)
    .eq('completed', false)
  if (aErr) {
    console.error('Failed to load assignments:', aErr.message)
    return
  }

  const byUser = {}
  for (const a of assignments ?? []) (byUser[a.user_id] ||= []).push(a)

  let sentCount = 0
  for (const sub of subs) {
    const notifs = buildNotifications(sub, byUser[sub.user_id] ?? [], now)
    for (const n of notifs) {
      if (await alreadySent(sub.endpoint, n.key)) continue
      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify({ title: n.title, body: n.body, tag: n.key, url: '/' })
        )
        await supabase.from('push_sent').insert({ endpoint: sub.endpoint, notif_key: n.key })
        sentCount++
      } catch (err) {
        // 404/410 mean the subscription expired or was revoked — clean it up.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          console.log(`Removed expired subscription ${sub.endpoint.slice(-12)}`)
        } else {
          console.error('Push send failed:', err.statusCode, err.body || err.message)
        }
      }
    }
  }

  if (sentCount > 0) console.log(`[${now.toISOString()}] sent ${sentCount} push notification(s)`)
}

const intervalMs = Number(SCAN_INTERVAL_SECONDS) * 1000
console.log(`Trackr push worker started. Scanning every ${SCAN_INTERVAL_SECONDS}s.`)
scan()
setInterval(scan, intervalMs)

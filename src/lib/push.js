import { supabase } from './supabase.js'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export const pushSupported =
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  typeof window !== 'undefined' &&
  'PushManager' in window

// Web Push needs the VAPID key as a Uint8Array.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}

export async function getSubscription() {
  if (!pushSupported) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

export async function subscribeToPush() {
  if (!pushSupported) throw new Error('Push notifications are not supported in this browser.')
  if (!VAPID_PUBLIC_KEY) throw new Error('Missing VITE_VAPID_PUBLIC_KEY in your .env.')
  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }
  return sub
}

// Stores the subscription + the user's reminder prefs so the backend worker
// knows when and what to send. Upserts on the unique endpoint.
export async function saveSubscription(sub, prefs) {
  return supabase.from('push_subscriptions').upsert(
    {
      endpoint: sub.endpoint,
      subscription: sub.toJSON(),
      enabled: prefs.enabled,
      reminder: prefs.reminder,
      hours_before: prefs.hoursBefore,
      due_today: prefs.dueToday,
      overdue: prefs.overdue,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  )
}

export async function unsubscribeFromPush() {
  const sub = await getSubscription()
  if (!sub) return null
  const { endpoint } = sub
  await sub.unsubscribe()
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  return endpoint
}

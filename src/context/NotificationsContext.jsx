import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAssignments } from './AssignmentsContext.jsx'
import {
  pushSupported, registerServiceWorker, subscribeToPush, saveSubscription,
  unsubscribeFromPush, getSubscription,
} from '../lib/push.js'

const NotificationsContext = createContext(null)

const PREFS_KEY = 'studyflow.notif.prefs'
const READ_KEY = 'studyflow.notif.read'
const PUSHED_KEY = 'studyflow.notif.pushed'

const browserSupportsPush = typeof window !== 'undefined' && 'Notification' in window

export const DEFAULT_PREFS = {
  enabled: true,
  reminder: true, // remind N hours before due
  hoursBefore: 24,
  dueToday: true, // anything due today
  overdue: true, // past-due and not done
  browserPush: false, // mirror reminders as OS/desktop notifications (tab open)
  closedPush: false, // deliver via Web Push even when the app is closed
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return DEFAULT_PREFS
}

function loadRead() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

const isToday = (d) => {
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function loadPushed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(PUSHED_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

export function NotificationsProvider({ children }) {
  const { assignments } = useAssignments()
  const [prefs, setPrefsState] = useState(loadPrefs)
  const [readIds, setReadIds] = useState(loadRead)
  const [now, setNow] = useState(() => new Date())
  const [permission, setPermission] = useState(
    browserSupportsPush ? Notification.permission : 'unsupported'
  )
  // Ids we've already fired an OS notification for (kept in a ref so the firing
  // effect doesn't loop on its own state updates).
  const pushedRef = useRef(loadPushed())

  // Re-evaluate time-based notifications every minute.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  }, [prefs])

  useEffect(() => {
    localStorage.setItem(READ_KEY, JSON.stringify([...readIds]))
  }, [readIds])

  function setPrefs(patch) {
    setPrefsState((p) => ({ ...p, ...patch }))
  }

  async function requestPermission() {
    if (!browserSupportsPush) return 'unsupported'
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }

  // Register the service worker once so it can receive push messages.
  useEffect(() => {
    if (pushSupported) registerServiceWorker()
  }, [])

  // Subscribe this device to Web Push (works when the app is fully closed).
  async function enablePush() {
    if (!pushSupported) return 'unsupported'
    const perm = permission === 'granted' ? 'granted' : await requestPermission()
    if (perm !== 'granted') return perm
    try {
      const sub = await subscribeToPush()
      await saveSubscription(sub, { ...prefs, closedPush: true })
      setPrefs({ closedPush: true })
      return 'granted'
    } catch (e) {
      return e.message || 'error'
    }
  }

  async function disablePush() {
    try {
      await unsubscribeFromPush()
    } catch {
      /* ignore */
    }
    setPrefs({ closedPush: false })
  }

  // Keep the backend's stored copy of prefs in sync while closed-app push is on.
  useEffect(() => {
    if (!pushSupported || !prefs.closedPush) return
    getSubscription().then((sub) => {
      if (sub) saveSubscription(sub, prefs)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.enabled, prefs.reminder, prefs.hoursBefore, prefs.dueToday, prefs.overdue, prefs.closedPush])

  const notifications = useMemo(() => {
    if (!prefs.enabled) return []
    const list = []

    for (const a of assignments) {
      if (a.completed) continue
      const due = new Date(a.dueDate)
      const diffMs = due - now
      const diffHrs = diffMs / 3600000

      if (diffMs < 0) {
        if (prefs.overdue) {
          list.push({
            id: `${a.id}:overdue`,
            type: 'overdue',
            assignmentId: a.id,
            title: a.title,
            message: `Overdue — was due ${due.toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
            time: due,
          })
        }
        continue
      }

      if (prefs.reminder && diffHrs <= prefs.hoursBefore) {
        const hrs = Math.max(1, Math.round(diffHrs))
        list.push({
          id: `${a.id}:reminder`,
          type: 'reminder',
          assignmentId: a.id,
          title: a.title,
          message: hrs <= 1 ? 'Due within the hour' : `Due in about ${hrs} hours`,
          time: due,
        })
      } else if (prefs.dueToday && isToday(due)) {
        // Only as a fallback when the reminder window hasn't already covered it.
        list.push({
          id: `${a.id}:today`,
          type: 'today',
          assignmentId: a.id,
          title: a.title,
          message: `Due today at ${due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
          time: due,
        })
      }
    }

    return list.sort((x, y) => x.time - y.time)
  }, [assignments, prefs, now])

  // Mirror new in-app notifications as OS/desktop notifications. They fire even
  // when the tab is in the background (as long as the browser is running).
  useEffect(() => {
    if (!browserSupportsPush) return
    if (!prefs.enabled || !prefs.browserPush || permission !== 'granted') return

    const toFire = notifications.filter((n) => !pushedRef.current.has(n.id))
    if (toFire.length === 0) return

    toFire.forEach((n) => {
      try {
        const note = new Notification(n.title, { body: n.message, tag: n.id })
        note.onclick = () => window.focus()
      } catch {
        /* ignore */
      }
      pushedRef.current.add(n.id)
    })
    localStorage.setItem(PUSHED_KEY, JSON.stringify([...pushedRef.current]))
  }, [notifications, prefs.enabled, prefs.browserPush, permission])

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length

  function markAllRead() {
    setReadIds((prev) => {
      const next = new Set(prev)
      notifications.forEach((n) => next.add(n.id))
      return next
    })
  }

  const value = {
    prefs,
    setPrefs,
    notifications,
    unreadCount,
    isRead: (id) => readIds.has(id),
    markAllRead,
    permission,
    requestPermission,
    browserSupportsPush,
    pushSupported,
    enablePush,
    disablePush,
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}

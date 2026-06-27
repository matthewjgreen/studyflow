import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationsContext.jsx'
import { BellIcon, notifIcon } from './Icons.jsx'

const toneFor = {
  reminder: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  today: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
  overdue: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
}

export default function NotificationsBell() {
  const { prefs, notifications, unreadCount, markAllRead } = useNotifications()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) markAllRead() // opening clears the unread badge
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Notifications</h4>
            <button
              onClick={() => {
                setOpen(false)
                navigate('/settings')
              }}
              className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
            >
              Settings
            </button>
          </div>

          {!prefs.enabled ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              Notifications are turned off. Enable them in Settings.
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">You're all caught up! 🎉</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {notifications.map((n) => {
                const Icon = notifIcon[n.type] ?? BellIcon
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        setOpen(false)
                        navigate('/assignments')
                      }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/60"
                    >
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneFor[n.type]}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {n.title}
                        </span>
                        <span className="block truncate text-xs text-slate-400">{n.message}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

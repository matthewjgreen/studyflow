import { useMemo, useState } from 'react'
import { useAssignments, formatDueLabel, courseById } from '../context/AssignmentsContext.jsx'
import { accentFor } from '../lib/accents.js'
import { statusMeta } from '../lib/status.js'
import { typeIcon } from '../components/Icons.jsx'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export default function Calendar() {
  const { assignments, courses } = useAssignments()
  const today = new Date()

  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selected, setSelected] = useState(today)
  const [mode, setMode] = useState('month') // 'month' | 'week'

  // Group assignments by their due-date key (YYYY-M-D) for O(1) cell lookups.
  const byDay = useMemo(() => {
    const map = {}
    for (const a of assignments) {
      const d = new Date(a.dueDate)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      ;(map[key] ||= []).push(a)
    }
    return map
  }, [assignments])

  const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

  // Month mode → 6-week grid (42 cells). Week mode → the 7 days of the week
  // containing the selected date.
  const cells = useMemo(() => {
    if (mode === 'week') {
      const start = new Date(selected)
      start.setDate(selected.getDate() - selected.getDay()) // back up to Sunday
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(start)
        date.setDate(start.getDate() + i)
        return date
      })
    }
    const first = new Date(view.year, view.month, 1)
    const start = new Date(first)
    start.setDate(first.getDate() - first.getDay())
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return date
    })
  }, [mode, view, selected])

  function shiftMonth(delta) {
    setView((v) => {
      const m = v.month + delta
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 }
    })
  }

  function shiftWeek(delta) {
    const d = new Date(selected)
    d.setDate(selected.getDate() + delta * 7)
    setSelected(d)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }

  const shiftPrev = () => (mode === 'week' ? shiftWeek(-1) : shiftMonth(-1))
  const shiftNext = () => (mode === 'week' ? shiftWeek(1) : shiftMonth(1))

  function switchMode(next) {
    setMode(next)
    // Keep the month grid aligned with whatever day is currently selected.
    if (next === 'month') setView({ year: selected.getFullYear(), month: selected.getMonth() })
  }

  function goToday() {
    setView({ year: today.getFullYear(), month: today.getMonth() })
    setSelected(today)
  }

  const selectedItems = (byDay[dayKey(selected)] ?? []).sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
  )

  // Header label: "June 2026" (month) or "Jun 22 – 28, 2026" (week).
  const headerLabel =
    mode === 'week'
      ? (() => {
          const s = cells[0]
          const e = cells[6]
          const sm = MONTHS[s.getMonth()].slice(0, 3)
          const em = MONTHS[e.getMonth()].slice(0, 3)
          return s.getMonth() === e.getMonth()
            ? `${sm} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`
            : `${sm} ${s.getDate()} – ${em} ${e.getDate()}, ${e.getFullYear()}`
        })()
      : `${MONTHS[view.month]} ${view.year}`

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Calendar</h2>
          <p className="mt-1 text-sm text-slate-400">{headerLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Month / Week toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 p-0.5 dark:border-slate-600">
            {['month', 'week'].map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition ${
                  mode === m
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={shiftPrev}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            ‹
          </button>
          <button
            onClick={goToday}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Today
          </button>
          <button
            onClick={shiftNext}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Month grid */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-card lg:col-span-2">
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="pb-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400"
              >
                {d}
              </div>
            ))}

            {cells.map((date) => {
              const inMonth = mode === 'week' ? true : date.getMonth() === view.month
              const isToday = sameDay(date, today)
              const isSelected = sameDay(date, selected)
              const items = byDay[dayKey(date)] ?? []
              const max = mode === 'week' ? 4 : 2
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelected(new Date(date))}
                  className={`flex ${mode === 'week' ? 'min-h-[120px] md:min-h-[170px]' : 'min-h-[68px] md:min-h-[88px]'} flex-col rounded-xl border p-1.5 text-left transition ${
                    isSelected
                      ? 'border-brand-400 bg-brand-50/60 ring-1 ring-brand-200 dark:border-brand-500 dark:bg-slate-700 dark:ring-brand-500/40'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-600 dark:hover:bg-slate-700'
                  } ${inMonth ? '' : 'opacity-40'}`}
                >
                  <span
                    className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <div className="space-y-0.5">
                    {items.slice(0, max).map((a) => {
                      const accent = accentFor(courseById(courses, a.courseId)?.color)
                      return (
                        <div
                          key={a.id}
                          className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium ${accent.pill} ${
                            a.status === 'completed' ? 'line-through opacity-60' : ''
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusMeta(a.status).dot}`} />
                          <span className="truncate">{a.title}</span>
                        </div>
                      )
                    })}
                    {items.length > max && (
                      <div className="px-1 text-[10px] font-semibold text-slate-400">
                        +{items.length - max} more
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected-day detail */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {selected.toLocaleDateString([], { weekday: 'long' })}
          </p>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {MONTHS[selected.getMonth()]} {selected.getDate()}
          </h3>

          <ul className="mt-4 space-y-3">
            {selectedItems.map((a) => {
              const Icon = typeIcon[a.type] ?? typeIcon.Homework
              const accent = accentFor(courseById(courses, a.courseId)?.color)
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-700/40"
                >
                  <span className={`h-8 w-1 rounded-full ${accent.dot}`} />
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent.pill}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${a.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-100'}`}>
                      {a.title}
                    </p>
                    <p className="truncate text-xs text-slate-400">{formatDueLabel(a.dueDate)}</p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusMeta(a.status).pill}`}>
                    {statusMeta(a.status).label}
                  </span>
                </li>
              )
            })}
            {selectedItems.length === 0 && (
              <li className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-xs text-slate-400">
                Nothing due this day.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

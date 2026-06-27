import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAssignments, formatDueLabel, courseById } from '../context/AssignmentsContext.jsx'
import { accentFor } from '../lib/accents.js'
import { SearchIcon, typeIcon } from '../components/Icons.jsx'

const FILTERS = ['All', 'Active', 'Completed']

export default function Assignments() {
  const { assignments, courses, toggleComplete, removeAssignment } = useAssignments()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  // Keep the input in sync when arriving via the top-bar search (?q=…).
  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  function onQueryChange(value) {
    setQuery(value)
    const next = new URLSearchParams(searchParams)
    if (value.trim()) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  const term = query.trim().toLowerCase()

  const filtered = assignments
    .filter((a) =>
      filter === 'All' ? true : filter === 'Active' ? !a.completed : a.completed
    )
    .filter((a) => {
      if (!term) return true
      const course = courseById(courses, a.courseId)
      const haystack = [a.title, a.subtitle, a.type, course?.name, a.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Assignments</h2>
        <p className="mt-1 text-sm text-slate-400">
          {assignments.filter((a) => !a.completed).length} active ·{' '}
          {assignments.filter((a) => a.completed).length} completed
        </p>
      </div>

      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search assignments…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              filter === f
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {filtered.map((a) => {
          const Icon = typeIcon[a.type] ?? typeIcon.Homework
          const accent = accentFor(courseById(courses, a.courseId)?.color).soft
          return (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-card md:gap-4"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-bold ${a.completed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                  {a.title}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {a.subtitle} · {a.type} · {formatDueLabel(a.dueDate)}
                </p>
              </div>
              {a.priority === 'Critical' && !a.completed && (
                <span className="hidden shrink-0 rounded-md bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-500 sm:inline">
                  Critical
                </span>
              )}
              <button
                onClick={() => removeAssignment(a.id)}
                className="shrink-0 text-xs font-medium text-slate-300 hover:text-rose-500"
                title="Delete"
              >
                ✕
              </button>
              <input
                type="checkbox"
                checked={a.completed}
                onChange={() => toggleComplete(a.id)}
                className="h-5 w-5 shrink-0 rounded-md border-slate-300 text-brand-600 focus:ring-brand-400"
              />
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center text-sm text-slate-400">
            {term ? `No assignments match "${query.trim()}".` : 'No assignments here yet.'}
          </li>
        )}
      </ul>
    </div>
  )
}

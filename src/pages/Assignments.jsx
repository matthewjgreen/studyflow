import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAssignments, courseById } from '../context/AssignmentsContext.jsx'
import { accentFor } from '../lib/accents.js'
import { dueMeta, bucketFor, DUE_BUCKETS } from '../lib/due.js'
import StatusSelect from '../components/StatusSelect.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { SkeletonRows } from '../components/Skeleton.jsx'
import { SearchIcon, ListIcon, EditIcon, typeIcon } from '../components/Icons.jsx'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'not_started', label: 'Not Started' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
]

export default function Assignments() {
  const { assignments, courses, setStatus, removeAssignment, loading } = useAssignments()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

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
    .filter((a) => (filter === 'all' ? true : a.status === filter))
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

  // Group into Overdue / Today / This week / Later / Completed.
  const grouped = DUE_BUCKETS.map((b) => ({
    ...b,
    items: filtered.filter((a) => bucketFor(a) === b.key),
  })).filter((g) => g.items.length > 0)

  function renderRow(a) {
    const Icon = typeIcon[a.type] ?? typeIcon.Homework
    const course = courseById(courses, a.courseId)
    const accent = accentFor(course?.color)
    const done = a.status === 'completed'
    const dm = dueMeta(a.dueDate)
    return (
      <li
        key={a.id}
        className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card dark:bg-slate-800 md:gap-4"
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.soft}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-bold ${done ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
            {a.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {course && (
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${accent.soft}`}>
                {course.name}
              </span>
            )}
            <span className="text-xs text-slate-400">{a.type}</span>
            {!done && (
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${dm.tone}`}>
                {dm.label}
              </span>
            )}
          </div>
        </div>
        {a.priority === 'Critical' && !done && (
          <span className="hidden shrink-0 rounded-md bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-500 sm:inline dark:bg-rose-500/10 dark:text-rose-400">
            Critical
          </span>
        )}
        <StatusSelect value={a.status} onChange={(s) => setStatus(a.id, s)} />
        <button
          onClick={() => navigate(`/assignments/${a.id}/edit`)}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-700 dark:hover:text-brand-300"
          title="Edit"
        >
          <EditIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => removeAssignment(a.id)}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
          title="Delete"
        >
          ✕
        </button>
      </li>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Assignments</h2>
        <p className="mt-1 text-sm text-slate-400">
          {assignments.filter((a) => a.status === 'not_started').length} not started ·{' '}
          {assignments.filter((a) => a.status === 'in_progress').length} in progress ·{' '}
          {assignments.filter((a) => a.status === 'completed').length} completed
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

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              filter === f.key
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonRows count={5} />
      ) : grouped.length === 0 ? (
        <EmptyState icon={ListIcon} className="bg-white py-12 dark:bg-slate-800">
          {term ? `No assignments match "${query.trim()}".` : 'No assignments yet — add your first one.'}
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.key}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">{g.label}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                  {g.items.length}
                </span>
              </div>
              <ul className="space-y-3">{g.items.map(renderRow)}</ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssignments, courseById, formatDueLabel } from '../context/AssignmentsContext.jsx'
import Avatar from './Avatar.jsx'
import NotificationsBell from './NotificationsBell.jsx'
import NotesPanel from './NotesPanel.jsx'
import { SearchIcon, PlusIcon, typeIcon } from './Icons.jsx'

// Desktop top bar with global search + quick-add. Hidden on mobile, where the
// header lives inside each page instead.
export default function Topbar({ showQuickAdd = false }) {
  const navigate = useNavigate()
  const { assignments, courses } = useAssignments()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const boxRef = useRef(null)

  const term = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!term) return []
    return assignments
      .filter((a) => {
        const course = courseById(courses, a.courseId)
        const haystack = [a.title, a.subtitle, a.type, course?.name, a.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(term)
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 6)
  }, [term, assignments, courses])

  // Close the dropdown when clicking outside the search box.
  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => setHighlight(0), [term])

  function goToResults() {
    if (!term) return
    navigate(`/assignments?q=${encodeURIComponent(query.trim())}`)
    setOpen(false)
  }

  function openAssignment() {
    // Single source of truth for assignment detail is the list; route there
    // filtered to the picked item's title.
    navigate(`/assignments?q=${encodeURIComponent(query.trim())}`)
    setOpen(false)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      goToResults()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <header className="hidden md:flex items-center gap-4 border-b border-slate-200/70 bg-white/80 px-8 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
      <div ref={boxRef} className="relative flex-1 max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search tasks, courses, or notes…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />

        {open && term && (
          <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-800">
            {results.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                No matches for "{query.trim()}"
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {results.map((a, i) => {
                  const Icon = typeIcon[a.type] ?? typeIcon.Homework
                  return (
                    <li key={a.id}>
                      <button
                        onMouseEnter={() => setHighlight(i)}
                        onClick={openAssignment}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                          highlight === i ? 'bg-brand-50 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm font-semibold ${a.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-100'}`}>
                            {a.title}
                          </span>
                          <span className="block truncate text-xs text-slate-400">
                            {a.subtitle} · {formatDueLabel(a.dueDate)}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
                <li className="border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={goToResults}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-brand-600 hover:bg-slate-50 dark:text-brand-300 dark:hover:bg-slate-700/60"
                  >
                    See all results for "{query.trim()}"
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {showQuickAdd && (
          <button
            onClick={() => navigate('/assignments/new')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:from-brand-700 hover:to-brand-600"
          >
            <PlusIcon className="h-4 w-4" /> Quick Add
          </button>
        )}
        <NotesPanel />
        <NotificationsBell />
        <Avatar size={36} />
      </div>
    </header>
  )
}

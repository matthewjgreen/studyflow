import { useNavigate } from 'react-router-dom'
import { useAssignments, courseById } from '../context/AssignmentsContext.jsx'
import { accentFor } from '../lib/accents.js'
import ProgressRing from '../components/ProgressRing.jsx'
import StatusSelect from '../components/StatusSelect.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { SkeletonRows } from '../components/Skeleton.jsx'
import { ClockIcon, TrendIcon, EditIcon } from '../components/Icons.jsx'

const STAT_CARDS = [
  { key: 'total', label: 'Total', tone: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' },
  { key: 'inProgress', label: 'In Progress', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  { key: 'completed', label: 'Completed', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  { key: 'overdue', label: 'Overdue', tone: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
]

export default function Dashboard() {
  const { assignments, courses, stats, setStatus, loading } = useAssignments()
  const navigate = useNavigate()

  const outlook = [...assignments]
    .filter((a) => a.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4)

  return (
    <div className="mx-auto max-w-6xl px-5 py-5 md:px-8 md:py-6">
      {/* Outlook */}
      <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-amber-500" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Outlook</h3>
          </div>
          <button
            onClick={() => navigate('/calendar')}
            className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
          >
            View Week
          </button>
        </div>

        {loading ? (
          <SkeletonRows count={3} />
        ) : outlook.length === 0 ? (
          <EmptyState icon={ClockIcon}>Nothing coming up — you're all caught up. 🎉</EmptyState>
        ) : (
          <ul className="space-y-3">
            {outlook.map((a) => {
              const accent = accentFor(courseById(courses, a.courseId)?.color)
              const due = new Date(a.dueDate)
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-700/40"
                >
                  <span className={`h-9 w-1 rounded-full ${accent.bar}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {due.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                      {due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-100">{a.title}</p>
                  </div>
                  <StatusSelect value={a.status} onChange={(s) => setStatus(a.id, s)} />
                  <button
                    onClick={() => navigate(`/assignments/${a.id}/edit`)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-600 dark:hover:text-brand-300"
                    title="Edit"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Progress + at-a-glance stats */}
      <section className="mt-5 rounded-2xl bg-white p-6 shadow-card dark:bg-slate-800">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Semester Progress</h3>
          <TrendIcon className="h-4 w-4 text-mint-500" />
        </div>

        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-around">
          <ProgressRing percent={stats.percent} />

          <div className="grid w-full max-w-sm grid-cols-2 gap-3 sm:w-auto">
            {STAT_CARDS.map((c) => (
              <div key={c.key} className={`rounded-xl px-4 py-3 ${c.tone}`}>
                <p className="text-2xl font-extrabold leading-none">
                  {String(stats[c.key] ?? 0).padStart(2, '0')}
                </p>
                <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest opacity-70">
                  {c.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          {stats.completed} of {stats.total} assignments completed.
        </p>
      </section>
    </div>
  )
}

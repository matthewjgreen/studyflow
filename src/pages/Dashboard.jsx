import { useNavigate } from 'react-router-dom'
import { useAssignments, formatDueLabel, courseById } from '../context/AssignmentsContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { accentFor } from '../lib/accents.js'
import { bannerByKey } from '../lib/banners.js'
import ProgressRing from '../components/ProgressRing.jsx'
import StatusSelect from '../components/StatusSelect.jsx'
import {
  ClockIcon, CheckCircleIcon, TrendIcon,
  PlusIcon, typeIcon,
} from '../components/Icons.jsx'

export default function Dashboard() {
  const { assignments, courses, stats, setStatus } = useAssignments()
  const { user, profile } = useAuth()
  const { banner } = useTheme()
  const navigate = useNavigate()

  // Prefer the saved first name; otherwise fall back to the email local part.
  const firstName =
    profile.firstName?.trim() ||
    (user?.email?.split('@')[0] ?? 'there').replace(/^\w/, (c) => c.toUpperCase())

  const upcoming = [...assignments]
    .filter((a) => a.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

  const outlook = upcoming.slice(0, 3)
  const active = upcoming.slice(0, 4)

  return (
    <div className="mx-auto max-w-6xl px-5 py-5 md:px-8 md:py-6">
      {/* Welcome banner */}
      <section
        className="overflow-hidden rounded-2xl px-6 py-6 text-white shadow-soft"
        style={{ background: bannerByKey(banner).gradient }}
      >
        <h2 className="text-xl font-bold md:text-2xl">Hey, {firstName}! 👋</h2>
        <p className="mt-1 text-sm text-white/90">
          You've completed {stats.percent}% of your semester goals. Keep up the great momentum!
        </p>
      </section>

      {/* Outlook — moved to the top */}
      <section className="mt-5 rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-amber-500" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Outlook</h3>
          </div>
          <button
            onClick={() => navigate('/calendar')}
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            View Week
          </button>
        </div>

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
                    {due.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-100">{a.title}</p>
                </div>
                <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${accent.chipBg} ${accent.chipText}`}>
                  {due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
              </li>
            )
          })}
          {outlook.length === 0 && (
            <li className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 text-center text-xs text-slate-400">
              Nothing on the horizon — nice.
            </li>
          )}
        </ul>
      </section>

      {/* Semester progress */}
      <section className="mt-5 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-card">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Semester Progress</h3>
          <TrendIcon className="h-4 w-4 text-mint-500" />
        </div>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-around">
          <ProgressRing percent={stats.percent} />

          <div className="grid w-full max-w-xs grid-cols-2 gap-3 sm:w-auto sm:grid-cols-1">
            <StatChip
              tone="mint"
              label="Weekly Tasks"
              value={String(stats.weeklyTasks).padStart(2, '0')}
            />
            <StatChip
              tone="amber"
              label="Completed"
              value={String(stats.weeklyCompleted).padStart(2, '0')}
            />
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          {stats.completed} of {stats.total} assignments completed this semester.
        </p>
      </section>

      {/* Active assignments */}
      <section className="mt-5 rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-card md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Active Assignments</h3>
          <CheckCircleIcon className="h-4 w-4 text-brand-500" />
        </div>

        <ul className="space-y-3">
          {active.map((a) => {
            const accent = accentFor(courseById(courses, a.courseId)?.color)
            const Icon = typeIcon[a.type] ?? typeIcon.Homework
            const critical = a.priority === 'Critical'
            return (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:shadow-sm md:gap-4 md:p-4 dark:border-slate-700 dark:hover:border-slate-600"
              >
                <span className={`h-10 w-1.5 shrink-0 rounded-full ${accent.bar}`} />
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.chipBg} ${accent.chipText}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{a.title}</p>
                  <p className="truncate text-xs text-slate-400">
                    {a.subtitle} · {formatDueLabel(a.dueDate)}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <span className={`text-xs font-bold ${critical ? 'text-rose-500' : 'text-slate-400'}`}>
                    {critical ? 'Critical' : 'Normal'}
                  </span>
                  <p className="text-[10px] uppercase tracking-wide text-slate-300">Priority</p>
                </div>
                <StatusSelect value={a.status} onChange={(s) => setStatus(a.id, s)} />
              </li>
            )
          })}
          {active.length === 0 && (
            <li className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-400">
              All caught up! Add a new assignment to get started.
            </li>
          )}
        </ul>

        <button
          onClick={() => navigate('/assignments/new')}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-200 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 md:hidden"
        >
          <PlusIcon className="h-4 w-4" /> Add Assignment
        </button>
      </section>
    </div>
  )
}

function StatChip({ tone, label, value }) {
  const tones = {
    mint: 'bg-mint-50 text-mint-600 dark:bg-mint-500/10 dark:text-mint-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  }
  return (
    <div className={`rounded-xl px-4 py-3 ${tones[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  )
}

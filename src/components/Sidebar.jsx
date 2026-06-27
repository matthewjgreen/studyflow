import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from './Modal.jsx'
import {
  DashboardIcon, CalendarIcon, ListIcon, SettingsIcon,
  PlusIcon, HelpIcon, LogoutIcon,
} from './Icons.jsx'

const nav = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { to: '/assignments', label: 'Assignments', icon: ListIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [showHelp, setShowHelp] = useState(false)

  return (
    <>
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white px-4 py-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="px-3 mb-8">
        <h1 className="text-xl font-extrabold text-brand-700">StudyFlow</h1>
        <p className="text-[10px] font-semibold tracking-[0.15em] text-slate-400 uppercase">
          Assignment Tracker
        </p>
      </div>

      <nav className="flex-1 space-y-1">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-slate-700 dark:text-brand-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => navigate('/assignments/new')}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700"
      >
        <PlusIcon className="h-5 w-5" />
        Add Assignment
      </button>

      <div className="mt-6 space-y-1 border-t border-slate-100 pt-4 dark:border-slate-700">
        <button
          onClick={() => setShowHelp(true)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <HelpIcon className="h-5 w-5" /> Help
        </button>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <LogoutIcon className="h-5 w-5" /> Logout
        </button>
      </div>
    </aside>

      <Modal open={showHelp} onClose={() => setShowHelp(false)} title="Need help?">
        If you have any questions, text or call Matthew J. Green. You should have his number.
      </Modal>
    </>
  )
}

import { NavLink } from 'react-router-dom'
import {
  DashboardIcon, CalendarIcon, ListIcon,
} from './Icons.jsx'

// Settings + sign-out live in the avatar menu (top-right) on mobile.
const items = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { to: '/assignments', label: 'Assignments', icon: ListIcon },
]

export default function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 backdrop-blur md:hidden dark:border-slate-700 dark:bg-slate-800/95">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
              isActive ? 'text-brand-600' : 'text-slate-400'
            }`
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

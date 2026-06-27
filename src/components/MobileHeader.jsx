import AvatarMenu from './AvatarMenu.jsx'
import NotificationsBell from './NotificationsBell.jsx'
import NotesPanel from './NotesPanel.jsx'

// Top bar shown only on mobile (desktop uses the sidebar + Topbar instead).
export default function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur md:hidden dark:border-slate-700 dark:bg-slate-800/95">
      <div>
        <h1 className="text-base font-extrabold leading-none text-brand-700">StudyFlow</h1>
        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400">
          Assignment Tracker
        </p>
      </div>
      <div className="flex items-center gap-1">
        <NotesPanel />
        <NotificationsBell />
        <AvatarMenu size={32} />
      </div>
    </header>
  )
}

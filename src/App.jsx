import { Routes, Route, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { AssignmentsProvider } from './context/AssignmentsContext.jsx'
import { NotificationsProvider } from './context/NotificationsContext.jsx'
import { NotesProvider } from './context/NotesContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import MobileNav from './components/MobileNav.jsx'
import MobileHeader from './components/MobileHeader.jsx'
import Topbar from './components/Topbar.jsx'
import FloatingAddButton from './components/FloatingAddButton.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AddAssignment from './pages/AddAssignment.jsx'
import Assignments from './pages/Assignments.jsx'
import Calendar from './pages/Calendar.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <AssignmentsProvider>
      <NotificationsProvider>
        <NotesProvider>
          <AuthedApp />
        </NotesProvider>
      </NotificationsProvider>
    </AssignmentsProvider>
  )
}

function AuthedApp() {
  const location = useLocation()
  // The Add Assignment page has its own "Quick Add" button in the top bar, so
  // we also hide the mobile floating add button there.
  const onAddPage = location.pathname.startsWith('/assignments/new')
  const showQuickAdd = onAddPage

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <Topbar showQuickAdd={showQuickAdd} />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/assignments/new" element={<AddAssignment />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>

      {!onAddPage && <FloatingAddButton />}
      <MobileNav />
    </div>
  )
}

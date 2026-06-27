import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'
import { DEFAULT_COURSES } from '../data/seed.js'

const AssignmentsContext = createContext(null)

// --- row <-> app-object mappers (DB is snake_case, app is camelCase) ---
function assignmentFromRow(r) {
  return {
    id: r.id,
    title: r.title,
    courseId: r.course_id,
    type: r.type,
    subtitle: r.subtitle ?? '',
    dueDate: r.due_date,
    priority: r.priority,
    completed: r.completed,
    notes: r.notes ?? '',
  }
}

function assignmentToRow(data) {
  return {
    title: data.title,
    course_id: data.courseId || null,
    type: data.type,
    subtitle: data.subtitle ?? '',
    due_date: data.dueDate,
    priority: data.priority,
    completed: data.completed ?? false,
    notes: data.notes ?? '',
  }
}

export function AssignmentsProvider({ children }) {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Insert the starter course set the first time a user signs in.
  const seedCourses = useCallback(async () => {
    const { data, error } = await supabase
      .from('courses')
      .insert(DEFAULT_COURSES)
      .select()
    if (error) throw error
    return data
  }, [])

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      let { data: courseRows, error: cErr } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true })
      if (cErr) throw cErr

      if (!courseRows || courseRows.length === 0) {
        courseRows = await seedCourses()
      }

      const { data: rows, error: aErr } = await supabase
        .from('assignments')
        .select('*')
        .order('due_date', { ascending: true })
      if (aErr) throw aErr

      setCourses(courseRows.map((c) => ({ id: c.id, name: c.name, color: c.color })))
      setAssignments((rows ?? []).map(assignmentFromRow))
    } catch (e) {
      setError(e.message ?? 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [user, seedCourses])

  useEffect(() => {
    if (user) loadData()
    else {
      setCourses([])
      setAssignments([])
    }
  }, [user, loadData])

  async function addCourse({ name, color }) {
    const { data: row, error } = await supabase
      .from('courses')
      .insert({ name, color })
      .select()
      .single()
    if (error) {
      setError(error.message)
      return null
    }
    setCourses((prev) => [...prev, { id: row.id, name: row.name, color: row.color }])
    return row.id
  }

  async function updateCourse(id, patch) {
    const prev = courses
    setCourses((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    const { error } = await supabase.from('courses').update(patch).eq('id', id)
    if (error) {
      setError(error.message)
      setCourses(prev) // rollback
    }
  }

  async function removeCourse(id) {
    const prevCourses = courses
    const prevAssignments = assignments
    // The DB sets course_id to null on delete; mirror that locally.
    setCourses((p) => p.filter((c) => c.id !== id))
    setAssignments((p) => p.map((a) => (a.courseId === id ? { ...a, courseId: null } : a)))
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) {
      setError(error.message)
      setCourses(prevCourses)
      setAssignments(prevAssignments)
    }
  }

  async function addAssignment(data) {
    const { data: row, error } = await supabase
      .from('assignments')
      .insert(assignmentToRow(data))
      .select()
      .single()
    if (error) {
      setError(error.message)
      return null
    }
    const created = assignmentFromRow(row)
    setAssignments((prev) => [...prev, created])
    return created.id
  }

  async function updateAssignment(id, patch) {
    const prev = assignments
    // Optimistic update so the UI feels instant.
    setAssignments((p) => p.map((a) => (a.id === id ? { ...a, ...patch } : a)))
    const { error } = await supabase
      .from('assignments')
      .update(assignmentToRow({ ...prev.find((a) => a.id === id), ...patch }))
      .eq('id', id)
    if (error) {
      setError(error.message)
      setAssignments(prev) // rollback
    }
  }

  function toggleComplete(id) {
    const current = assignments.find((a) => a.id === id)
    if (!current) return
    return updateAssignment(id, { completed: !current.completed })
  }

  async function removeAssignment(id) {
    const prev = assignments
    setAssignments((p) => p.filter((a) => a.id !== id))
    const { error } = await supabase.from('assignments').delete().eq('id', id)
    if (error) {
      setError(error.message)
      setAssignments(prev) // rollback
    }
  }

  // Stats are derived from the user's real data.
  const stats = useMemo(() => {
    const total = assignments.length
    const completed = assignments.filter((a) => a.completed).length
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
    return {
      total,
      completed,
      percent,
      weeklyTasks: total - completed,
      weeklyCompleted: completed,
    }
  }, [assignments])

  const value = {
    courses,
    assignments,
    stats,
    loading,
    error,
    addCourse,
    updateCourse,
    removeCourse,
    addAssignment,
    updateAssignment,
    toggleComplete,
    removeAssignment,
    reload: loadData,
  }

  return (
    <AssignmentsContext.Provider value={value}>
      {children}
    </AssignmentsContext.Provider>
  )
}

export function useAssignments() {
  const ctx = useContext(AssignmentsContext)
  if (!ctx) throw new Error('useAssignments must be used within AssignmentsProvider')
  return ctx
}

// Shared helpers for displaying course + date info consistently across pages.
export function courseById(courses, id) {
  return courses.find((c) => c.id === id)
}

export function formatDueLabel(dueDate) {
  const due = new Date(dueDate)
  const now = new Date()
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const days = Math.round((startOfDay(due) - startOfDay(now)) / 86400000)

  const time = due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  if (days < 0) return `Overdue · ${Math.abs(days)}d ago`
  if (days === 0) {
    const hours = Math.round((due - now) / 3600000)
    if (hours <= 0) return 'Due now'
    return `Due in ${hours}h`
  }
  if (days === 1) return 'Due Tomorrow'
  if (days < 7) return `Due in ${days} days`
  return `Due ${due.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`
}

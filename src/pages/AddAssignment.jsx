import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssignments } from '../context/AssignmentsContext.jsx'
import { typeIcon, PaperclipIcon, LinkIcon } from '../components/Icons.jsx'

const TYPES = ['Test', 'Quiz', 'Homework', 'Project']

const emptyForm = {
  title: '',
  courseId: '',
  dueDate: '',
  type: 'Test',
  priority: 'Normal',
  notes: '',
}

export default function AddAssignment() {
  const { courses, addAssignment } = useAssignments()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function buildPayload() {
    const course = courses.find((c) => c.id === form.courseId)
    return {
      title: form.title.trim(),
      courseId: form.courseId,
      type: form.type,
      subtitle: course ? course.name : 'General',
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : new Date().toISOString(),
      priority: form.priority,
      notes: form.notes.trim(),
    }
  }

  function validate() {
    if (!form.title.trim()) return 'Please add an assignment title.'
    if (!form.courseId) return 'Please choose a course.'
    if (!form.dueDate) return 'Please set a due date.'
    return ''
  }

  async function handleSave(addAnother) {
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }
    setBusy(true)
    const id = await addAssignment(buildPayload())
    setBusy(false)

    if (!id) {
      setError('Could not save the assignment. Please try again.')
      return
    }
    if (addAnother) {
      setForm(emptyForm)
      setError('')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Add New Assignment</h2>
        <p className="mt-1 text-sm text-slate-400">
          Fill in the details below to keep your academic momentum going.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main form card */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-card lg:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wide text-brand-600">
            Assignment Title
          </label>
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Molecular Biology Lab Report"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:bg-slate-700"
          />

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">Course Name</label>
              <select
                value={form.courseId}
                onChange={(e) => set('courseId', e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="">Select a course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">Due Date</label>
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">Assignment Type</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TYPES.map((t) => {
                const Icon = typeIcon[t]
                const selected = form.type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('type', t)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      selected
                        ? 'border-brand-600 bg-brand-600 text-white shadow-soft'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {t}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-card">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Urgency Status</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => set('priority', 'Critical')}
                className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                  form.priority === 'Critical'
                    ? 'bg-rose-500 text-white shadow-soft'
                    : 'bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400'
                }`}
              >
                Urgent
              </button>
              <button
                type="button"
                onClick={() => set('priority', 'Normal')}
                className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                  form.priority === 'Normal'
                    ? 'bg-brand-600 text-white shadow-soft'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Normal
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-card">
            <p className="text-sm font-semibold text-brand-600">Productivity Tip</p>
            <p className="mt-2 text-sm italic text-slate-500">
              "The secret of getting ahead is getting started." — Mark Twain
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleSave(false)}
              disabled={busy}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Save Assignment'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={busy}
              className="w-full rounded-xl border border-brand-200 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 disabled:opacity-60"
            >
              Save &amp; Add Another
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-1 text-center text-sm font-medium text-slate-400 hover:text-slate-600"
            >
              Discard Changes
            </button>
          </div>
        </div>
      </div>

      {/* Notes & resources */}
      <div className="mt-5 rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-card">
        <p className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          Additional Notes &amp; Resources (Optional)
        </p>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={4}
          placeholder="Paste links, mention specific requirements, or list sub-tasks here…"
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:bg-slate-700"
        />
        <div className="mt-3 flex items-center gap-5 text-sm font-medium text-brand-600">
          <button className="flex items-center gap-1.5 hover:underline">
            <PaperclipIcon className="h-4 w-4" /> Attach File
          </button>
          <button className="flex items-center gap-1.5 hover:underline">
            <LinkIcon className="h-4 w-4" /> Add Link
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  )
}

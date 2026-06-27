import { useEffect, useRef, useState } from 'react'
import { useNotes } from '../context/NotesContext.jsx'
import { NoteIcon, PlusIcon, TrashIcon } from './Icons.jsx'

// Quick personal notes, opened from a button next to the notifications bell.
export default function NotesPanel() {
  const { notes, addNote, updateNote, removeNote } = useNotes()
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notes"
        className="relative rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
      >
        <NoteIcon className="h-5 w-5" />
        {notes.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {notes.length > 9 ? '9+' : notes.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Notes</h4>
            <button
              onClick={addNote}
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
            >
              <PlusIcon className="h-3.5 w-3.5" /> New note
            </button>
          </div>

          {notes.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              No notes yet. Tap “New note” to jot something down.
            </p>
          ) : (
            <ul className="max-h-96 space-y-2 overflow-y-auto p-3">
              {notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-2 dark:border-slate-700 dark:bg-slate-700/40"
                >
                  <textarea
                    value={n.text}
                    onChange={(e) => updateNote(n.id, e.target.value)}
                    rows={3}
                    placeholder="Write a note…"
                    className="w-full resize-none rounded-lg border-none bg-transparent px-2 py-1 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  />
                  <div className="flex items-center justify-between px-2 pb-0.5">
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.updatedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => removeNote(n.id)}
                      className="rounded-md p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                      title="Delete note"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

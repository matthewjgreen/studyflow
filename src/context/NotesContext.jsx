import { createContext, useContext, useEffect, useState } from 'react'

const NotesContext = createContext(null)
const STORAGE_KEY = 'studyflow.notes'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore corrupt storage */
  }
  return []
}

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  function addNote() {
    const id = `n_${Date.now()}`
    setNotes((prev) => [{ id, text: '', updatedAt: Date.now() }, ...prev])
    return id
  }

  function updateNote(id, text) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text, updatedAt: Date.now() } : n))
    )
  }

  function removeNote(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, removeNote }}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('useNotes must be used within NotesProvider')
  return ctx
}

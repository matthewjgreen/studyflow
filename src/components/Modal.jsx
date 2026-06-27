import { useEffect } from 'react'

// Centered modal dialog with a dimmed backdrop. Closes on backdrop click,
// the close button, or the Escape key.
export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft dark:bg-slate-800">
        {title && (
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        )}
        <div className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {children}
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Got it
        </button>
      </div>
    </div>
  )
}

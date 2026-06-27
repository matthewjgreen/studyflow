// Maps a course color name to the Tailwind classes used across the app.
// Courses store their color in the database; UI components look it up here so
// the palette stays consistent on the Dashboard, Calendar, and Assignments.

export const COLOR_ACCENTS = {
  emerald: { bar: 'bg-emerald-400', dot: 'bg-emerald-400', chipBg: 'bg-emerald-50', chipText: 'text-emerald-600', pill: 'bg-emerald-50 text-emerald-700', soft: 'bg-emerald-50 text-emerald-600' },
  rose: { bar: 'bg-rose-400', dot: 'bg-rose-400', chipBg: 'bg-rose-50', chipText: 'text-rose-600', pill: 'bg-rose-50 text-rose-700', soft: 'bg-rose-50 text-rose-600' },
  amber: { bar: 'bg-amber-400', dot: 'bg-amber-400', chipBg: 'bg-amber-50', chipText: 'text-amber-600', pill: 'bg-amber-50 text-amber-700', soft: 'bg-amber-50 text-amber-600' },
  sky: { bar: 'bg-sky-400', dot: 'bg-sky-400', chipBg: 'bg-sky-50', chipText: 'text-sky-600', pill: 'bg-sky-50 text-sky-700', soft: 'bg-sky-50 text-sky-600' },
  violet: { bar: 'bg-violet-400', dot: 'bg-violet-400', chipBg: 'bg-violet-50', chipText: 'text-violet-600', pill: 'bg-violet-50 text-violet-700', soft: 'bg-violet-50 text-violet-600' },
}

export const COLOR_OPTIONS = Object.keys(COLOR_ACCENTS)

export function accentFor(color) {
  return COLOR_ACCENTS[color] ?? COLOR_ACCENTS.emerald
}

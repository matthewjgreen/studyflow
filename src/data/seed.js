// Default courses inserted for a user the first time they sign in (when their
// courses table is empty). Assignments are no longer seeded — new accounts
// start with a clean slate and data lives in Supabase.

export const DEFAULT_COURSES = [
  { name: 'CS101', color: 'emerald' },
  { name: 'PSYCH 200', color: 'rose' },
  { name: 'HIST 110', color: 'amber' },
  { name: 'BIO 150', color: 'sky' },
]

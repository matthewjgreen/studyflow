import { createClient } from '@supabase/supabase-js'

// Credentials come from Vite env vars (see .env). Both are safe to expose in a
// browser bundle: the anon key only grants what Row Level Security allows.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Surfaced clearly in the console if the .env file hasn't been filled in.
  console.error(
    'Missing Supabase env vars. Copy .env.example to .env and add your project URL + anon key.'
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '')

export const isSupabaseConfigured = Boolean(url && anonKey)

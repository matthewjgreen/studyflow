import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore an existing session on load, then subscribe to changes
    // (sign in, sign out, token refresh).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  // Stored in Supabase auth user_metadata.
  async function updateProfile({ firstName, lastName }) {
    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName },
    })
    return error?.message ?? null
  }

  // Changing email sends a confirmation link to the new address; it only takes
  // effect after the user clicks it.
  async function updateEmail(email) {
    const { error } = await supabase.auth.updateUser({ email })
    return error?.message ?? null
  }

  async function updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    return error?.message ?? null
  }

  // Saves the public URL of an uploaded avatar to user_metadata. (Shallow-merges,
  // so first/last name are preserved.)
  async function updateAvatar(avatarUrl) {
    const { error } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } })
    return error?.message ?? null
  }

  const meta = session?.user?.user_metadata ?? {}

  const value = {
    session,
    user: session?.user ?? null,
    profile: {
      firstName: meta.first_name ?? '',
      lastName: meta.last_name ?? '',
      email: session?.user?.email ?? '',
      avatarUrl: meta.avatar_url ?? '',
    },
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updateEmail,
    updatePassword,
    updateAvatar,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

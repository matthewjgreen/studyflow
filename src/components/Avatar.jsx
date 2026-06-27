import { useAuth } from '../context/AuthContext.jsx'

// Shows the user's uploaded photo, or falls back to the first initial of their
// first name (then email) on a gradient circle.
export default function Avatar({ size = 36, className = '' }) {
  const { profile } = useAuth()
  const initial = (profile.firstName || profile.email || '?').charAt(0).toUpperCase()
  const dimension = { width: size, height: size }

  if (profile.avatarUrl) {
    return (
      <img
        src={profile.avatarUrl}
        alt="Your avatar"
        style={dimension}
        className={`rounded-full object-cover ring-2 ring-white dark:ring-slate-700 ${className}`}
      />
    )
  }

  return (
    <div
      style={dimension}
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 font-bold text-white ring-2 ring-white dark:ring-slate-700 ${className}`}
    >
      <span style={{ fontSize: size * 0.42 }}>{initial}</span>
    </div>
  )
}

import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAssignments } from '../context/AssignmentsContext.jsx'
import { useNotifications } from '../context/NotificationsContext.jsx'
import { supabase } from '../lib/supabase.js'
import { COLOR_OPTIONS, accentFor } from '../lib/accents.js'
import { fileToDataUrl } from '../lib/image.js'
import Avatar from '../components/Avatar.jsx'
import CropModal from '../components/CropModal.jsx'
import {
  UserIcon, BookIcon, SunIcon, MoonIcon, TrashIcon, PlusIcon, BellIcon,
} from '../components/Icons.jsx'

export default function Settings() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-6 md:px-8">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h2>
        <p className="mt-1 text-sm text-slate-400">Manage your profile, courses, and preferences.</p>
      </div>

      <div className="space-y-5">
        <ProfileSection />
        <CoursesSection />
        <PasswordSection />
        <AppearanceSection />
        <NotificationsSection />
        <AvatarSection />
      </div>
    </div>
  )
}

/* ---------- shared bits ---------- */

function Card({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-card dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-3">
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-slate-700 dark:text-brand-300">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:bg-slate-700'
const labelClass = 'block text-sm font-semibold text-slate-600 dark:text-slate-300'
const primaryBtn =
  'rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:opacity-60'

function Status({ msg }) {
  if (!msg) return null
  const ok = msg.type === 'ok'
  return (
    <p
      className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${
        ok
          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
          : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'
      }`}
    >
      {msg.text}
    </p>
  )
}

/* ---------- profile (name + email) ---------- */

function ProfileSection() {
  const { profile, updateProfile, updateEmail } = useAuth()
  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [email, setEmail] = useState(profile.email)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)

    const errName = await updateProfile({ firstName, lastName })
    let errEmail = null
    if (email && email !== profile.email) {
      errEmail = await updateEmail(email)
    }
    setBusy(false)

    if (errName || errEmail) {
      setMsg({ type: 'err', text: errName || errEmail })
    } else if (email !== profile.email) {
      setMsg({ type: 'ok', text: 'Saved. Check your new email inbox to confirm the address change.' })
    } else {
      setMsg({ type: 'ok', text: 'Profile updated.' })
    }
  }

  return (
    <Card icon={UserIcon} title="Profile" subtitle="Your name and email address">
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>First name</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="Alex" />
          </div>
          <div>
            <label className={labelClass}>Last name</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Rivera" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <Status msg={msg} />
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </Card>
  )
}

/* ---------- password ---------- */

function PasswordSection() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function save(e) {
    e.preventDefault()
    setMsg(null)
    if (password.length < 6) return setMsg({ type: 'err', text: 'Password must be at least 6 characters.' })
    if (password !== confirm) return setMsg({ type: 'err', text: 'Passwords do not match.' })

    setBusy(true)
    const err = await updatePassword(password)
    setBusy(false)
    if (err) setMsg({ type: 'err', text: err })
    else {
      setMsg({ type: 'ok', text: 'Password updated.' })
      setPassword('')
      setConfirm('')
    }
  }

  return (
    <Card icon={UserIcon} title="Password" subtitle="Choose a new password">
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>New password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" autoComplete="new-password" />
          </div>
          <div>
            <label className={labelClass}>Confirm password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} placeholder="••••••••" autoComplete="new-password" />
          </div>
        </div>
        <Status msg={msg} />
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </Card>
  )
}

/* ---------- appearance (theme) ---------- */

function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  const options = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
  ]
  return (
    <Card icon={SunIcon} title="Appearance" subtitle="Choose how StudyFlow looks">
      <div className="grid grid-cols-2 gap-3">
        {options.map(({ value, label, icon: Icon }) => {
          const active = theme === value
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition ${
                active
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-slate-700 dark:text-brand-200'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="h-5 w-5" /> {label}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

/* ---------- profile photo ---------- */

function AvatarSection() {
  const { user, profile, updateAvatar } = useAuth()
  const fileRef = useRef(null)
  const [cropSrc, setCropSrc] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  // Step 1: pick any image (any size) and open the cropper.
  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // let the user re-pick the same file later
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMsg({ type: 'err', text: 'Please choose an image file.' })
      return
    }
    setMsg(null)
    try {
      setCropSrc(await fileToDataUrl(file))
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  // Step 2: the cropper hands back a square Blob — upload it.
  async function uploadBlob(blob) {
    setBusy(true)
    setMsg(null)
    try {
      const path = `${user.id}/avatar.jpg`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const err = await updateAvatar(`${data.publicUrl}?v=${Date.now()}`) // cache-bust
      if (err) throw new Error(err)
      setMsg({ type: 'ok', text: 'Photo updated.' })
      setCropSrc(null)
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Upload failed.' })
    } finally {
      setBusy(false)
    }
  }

  async function removePhoto() {
    setBusy(true)
    setMsg(null)
    await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`])
    await updateAvatar('')
    setBusy(false)
  }

  return (
    <Card icon={UserIcon} title="Profile photo" subtitle="Shown in the top-right corner">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar size={64} className="ring-slate-200 dark:ring-slate-600" />
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={() => fileRef.current?.click()} disabled={busy} className={primaryBtn}>
            {profile.avatarUrl ? 'Change photo' : 'Upload photo'}
          </button>
          {profile.avatarUrl && (
            <button
              onClick={removePhoto}
              disabled={busy}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Remove
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      </div>
      <Status msg={msg} />

      <CropModal
        imageSrc={cropSrc}
        open={!!cropSrc}
        busy={busy}
        onCancel={() => !busy && setCropSrc(null)}
        onSave={uploadBlob}
      />
    </Card>
  )
}

/* ---------- notifications ---------- */

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-400">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function NotificationsSection() {
  const {
    prefs, setPrefs, permission, requestPermission, browserSupportsPush,
    pushSupported, enablePush, disablePush,
  } = useNotifications()

  async function toggleDesktop(on) {
    if (!on) {
      setPrefs({ browserPush: false })
      return
    }
    const perm = permission === 'granted' ? 'granted' : await requestPermission()
    setPrefs({ browserPush: perm === 'granted' })
  }

  async function toggleClosed(on) {
    if (!on) {
      await disablePush()
      return
    }
    await enablePush() // only flips closedPush on if permission is granted
  }

  return (
    <Card icon={BellIcon} title="Notifications" subtitle="Reminders shown in the bell at the top">
      <Toggle
        label="Enable notifications"
        checked={prefs.enabled}
        onChange={(v) => setPrefs({ enabled: v })}
      />

      {prefs.enabled && (
        <div className="mt-4 space-y-5 border-t border-slate-100 pt-4 dark:border-slate-700">
          {browserSupportsPush ? (
            <div>
              <Toggle
                label="Desktop alerts"
                description="Also show reminders as browser/OS notifications — even when this tab isn't focused."
                checked={prefs.browserPush && permission === 'granted'}
                onChange={toggleDesktop}
              />
              {permission === 'denied' && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  Notifications are blocked for this site. Allow them in your browser's site
                  settings, then turn this on again.
                </p>
              )}
              {prefs.browserPush && permission === 'granted' && (
                <button
                  onClick={() =>
                    new Notification('StudyFlow', { body: "Test notification — you're all set! 🔔" })
                  }
                  className="mt-2 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
                >
                  Send a test notification
                </button>
              )}

              {pushSupported && (
                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
                  <Toggle
                    label="Remind me when the app is closed"
                    description="Delivers reminders to this device even when StudyFlow isn't open. Requires the push server to be running."
                    checked={prefs.closedPush && permission === 'granted'}
                    onChange={toggleClosed}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Your browser doesn't support desktop notifications.
            </p>
          )}

          <div>
            <Toggle
              label="Due-date reminder"
              description="A heads-up a set number of hours before each assignment is due."
              checked={prefs.reminder}
              onChange={(v) => setPrefs({ reminder: v })}
            />
            {prefs.reminder && (
              <div className="mt-3 flex flex-wrap items-center gap-2 pl-1">
                <span className="text-sm text-slate-500 dark:text-slate-400">Remind me</span>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={prefs.hoursBefore}
                  onChange={(e) =>
                    setPrefs({ hoursBefore: Math.max(1, Math.min(168, Number(e.target.value) || 1)) })
                  }
                  className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">hours before it's due</span>
              </div>
            )}
          </div>

          <Toggle
            label="Due today"
            description="A reminder for anything due later the same day."
            checked={prefs.dueToday}
            onChange={(v) => setPrefs({ dueToday: v })}
          />

          <Toggle
            label="Overdue alerts"
            description="Flag assignments whose due date has passed and aren't done."
            checked={prefs.overdue}
            onChange={(v) => setPrefs({ overdue: v })}
          />
        </div>
      )}
    </Card>
  )
}

/* ---------- courses ---------- */

function CoursesSection() {
  const { courses, addCourse, updateCourse, removeCourse } = useAssignments()
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0])
  const [busy, setBusy] = useState(false)

  async function add(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setBusy(true)
    await addCourse({ name: newName.trim(), color: newColor })
    setBusy(false)
    setNewName('')
    setNewColor(COLOR_OPTIONS[0])
  }

  return (
    <Card icon={BookIcon} title="Courses" subtitle="Add, rename, recolor, or remove your courses">
      <ul className="space-y-2">
        {courses.map((c) => (
          <li key={c.id} className="flex items-center gap-2 rounded-xl border border-slate-100 p-2 dark:border-slate-700">
            <ColorPicker value={c.color} onChange={(color) => updateCourse(c.id, { color })} />
            <input
              defaultValue={c.name}
              onBlur={(e) => {
                const name = e.target.value.trim()
                if (name && name !== c.name) updateCourse(c.id, { name })
              }}
              className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-slate-200 focus:bg-slate-50 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:bg-slate-700"
            />
            <button
              onClick={() => removeCourse(c.id)}
              className="rounded-lg p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
              title="Delete course"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </li>
        ))}
        {courses.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-700">
            No courses yet — add your first one below.
          </li>
        )}
      </ul>

      <form onSubmit={add} className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
        <ColorPicker value={newColor} onChange={setNewColor} />
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. MATH 240"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-300 focus:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <button type="submit" disabled={busy} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          <PlusIcon className="h-4 w-4" /> Add
        </button>
      </form>
    </Card>
  )
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {COLOR_OPTIONS.map((color) => {
        const active = value === color
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            title={color}
            className={`h-5 w-5 rounded-full ${accentFor(color).bar} ${
              active ? 'ring-2 ring-offset-1 ring-slate-400 dark:ring-offset-slate-800' : 'opacity-60 hover:opacity-100'
            }`}
          />
        )
      })}
    </div>
  )
}


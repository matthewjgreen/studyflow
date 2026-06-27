// Color options for the dashboard greeting banner.
//
// We use explicit CSS gradient strings (applied via inline `style`) rather than
// Tailwind gradient classes. Tailwind purges utility classes it can't see at
// build time, and arbitrary gradient-stop positions were getting dropped — a
// plain CSS string is bulletproof and gives exact control over the stops.
//
// Each gradient stays a solid color across the left (where the greeting text
// sits) until 45%, then fades to a lighter accent on the right.

export const BANNER_OPTIONS = [
  { key: 'sunset', label: 'Sunset', gradient: 'linear-gradient(to right, #c026d3 45%, #fb923c)' },
  { key: 'ocean', label: 'Ocean', gradient: 'linear-gradient(to right, #2563eb 45%, #22d3ee)' },
  { key: 'forest', label: 'Forest', gradient: 'linear-gradient(to right, #059669 45%, #2dd4bf)' },
  { key: 'berry', label: 'Berry', gradient: 'linear-gradient(to right, #4f46e5 45%, #c084fc)' },
  { key: 'flamingo', label: 'Flamingo', gradient: 'linear-gradient(to right, #e11d48 45%, #f472b6)' },
  { key: 'ember', label: 'Ember', gradient: 'linear-gradient(to right, #dc2626 45%, #fbbf24)' },
  { key: 'mint', label: 'Mint', gradient: 'linear-gradient(to right, #10b981 45%, #67e8f9)' },
  { key: 'indigo', label: 'Indigo', gradient: 'linear-gradient(to right, #4f46e5 45%, #60a5fa)' },
  { key: 'midnight', label: 'Midnight', gradient: 'linear-gradient(to right, #1e293b 45%, #475569)' },
]

export const DEFAULT_BANNER = 'sunset'

export function bannerByKey(key) {
  return BANNER_OPTIONS.find((b) => b.key === key) ?? BANNER_OPTIONS[0]
}

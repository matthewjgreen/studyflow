import { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_BANNER } from '../lib/banners.js'

const ThemeContext = createContext(null)
const THEME_KEY = 'studyflow.theme'
const BANNER_KEY = 'studyflow.banner'

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  // Fall back to the OS preference the first time.
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialBanner() {
  return localStorage.getItem(BANNER_KEY) || DEFAULT_BANNER
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)
  const [banner, setBannerState] = useState(getInitialBanner)

  // Toggle the `dark` class on <html> so Tailwind's dark: variants apply, and
  // remember the choice for next time.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(BANNER_KEY, banner)
  }, [banner])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const setBanner = (key) => setBannerState(key)

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, banner, setBanner }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

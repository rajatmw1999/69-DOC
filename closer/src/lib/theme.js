// Light/dark theme, persisted per-browser. Applied to <html data-theme>.
import { useEffect, useState } from 'react'

const KEY = 'closer.theme'

export function getTheme() {
  try {
    const t = localStorage.getItem(KEY)
    if (t === 'light' || t === 'dark') return t
  } catch { /* ignore */ }
  return 'dark' // premium dark is the default
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try { localStorage.setItem(KEY, theme) } catch { /* ignore */ }
}

// Call once at boot so the very first paint is correct.
export function initTheme() {
  applyTheme(getTheme())
}

const listeners = new Set()
export function setTheme(theme) {
  applyTheme(theme)
  listeners.forEach((fn) => fn(theme))
}

export function useTheme() {
  const [theme, setLocal] = useState(getTheme)
  useEffect(() => {
    const fn = (t) => setLocal(t)
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])
  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  return { theme, toggle, setTheme }
}

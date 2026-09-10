// App shell: sidebar (desktop) + top/bottom bars (mobile) around routed pages.
import { NavLink, Outlet, Link } from 'react-router-dom'
import { useSyncExternalStore } from 'react'
import { getProfile, subscribe } from '../lib/storage.js'
import { levelFromXp, rankForLevel } from '../lib/xp.js'
import { APP_VERSION } from '../lib/version.js'
import { useTheme } from '../lib/theme.js'

export function useProfile() {
  return useSyncExternalStore(subscribe, getProfile, getProfile)
}

const NAV = [
  { group: 'Train', items: [
    { to: '/app', label: 'Dashboard', icon: '◈', end: true },
    { to: '/app/simulator', label: 'Phone Simulator', icon: '📞' },
    { to: '/app/arena', label: 'Live Arena', icon: '🎥' },
    { to: '/app/challenges', label: 'Challenges', icon: '🏁' },
    { to: '/app/scenarios', label: 'Scenario Lab', icon: '🧪' },
    { to: '/app/daily', label: 'Daily Practice', icon: '⚡' },
  ]},
  { group: 'Learn', items: [
    { to: '/app/academy', label: 'Skill Academy', icon: '🎓' },
    { to: '/app/coach', label: 'AI Coach', icon: '🧠' },
    { to: '/app/characters', label: 'Characters', icon: '🎭' },
    { to: '/app/toolkit', label: 'Toolkit', icon: '🧰' },
  ]},
  { group: 'Track', items: [
    { to: '/app/analytics', label: 'Analytics', icon: '📊' },
    { to: '/app/review', label: 'Call Review', icon: '🎧' },
    { to: '/app/debrief', label: 'Meeting Debrief', icon: '📝' },
    { to: '/app/community', label: 'Community', icon: '🏆' },
    { to: '/app/settings', label: 'Settings', icon: '⚙' },
  ]},
]

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle light or dark theme" title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
      <span className={theme === 'dark' ? 'on' : ''}>🌙</span>
      <span className={theme === 'light' ? 'on' : ''}>☀️</span>
    </button>
  )
}

const MOBILE_NAV = [
  { to: '/app', label: 'Home', icon: '◈', end: true },
  { to: '/app/simulator', label: 'Dial', icon: '📞' },
  { to: '/app/academy', label: 'Learn', icon: '🎓' },
  { to: '/app/analytics', label: 'Stats', icon: '📊' },
  { to: '/app/community', label: 'Rank', icon: '🏆' },
]

export default function AppShell() {
  const profile = useProfile()
  const { level } = levelFromXp(profile.xp)
  const rank = rankForLevel(level)

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="sidebar-logo">
          <span className="logo-mark">C</span>
          <b>Closer</b>
        </Link>
        {NAV.map((g) => (
          <nav className="nav-group" key={g.group} aria-label={g.group}>
            <small>{g.group}</small>
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="ni" aria-hidden="true">{it.icon}</span>
                {it.label}
              </NavLink>
            ))}
          </nav>
        ))}
        <div className="sidebar-user">
          <span className="avatar">{profile.user.avatar}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{profile.user.name}</b>
            <small>{rank.icon} {rank.name} · Lv {level}</small>
          </div>
          <ThemeToggle />
        </div>
        <div style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--ink-3)', paddingTop: 8 }}>
          Closer v{APP_VERSION}
        </div>
      </aside>

      <div className="mobile-topbar">
        <Link to="/" className="row" style={{ gap: 8 }}>
          <span className="logo-mark sm">C</span>
          <b>Closer</b>
          <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>v{APP_VERSION}</span>
        </Link>
        <div className="row" style={{ gap: 8 }}>
          <ThemeToggle />
          <span className="chip gold">{rank.icon} Lv {level}</span>
        </div>
      </div>

      <main className="main">
        <Outlet />
      </main>

      <nav className="mobile-nav" aria-label="Primary">
        {MOBILE_NAV.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="ni" aria-hidden="true">{it.icon}</span>
            {it.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

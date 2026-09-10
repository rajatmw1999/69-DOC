// Auth screen (demo: any method drops into the app).
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { updateProfile } from '../lib/storage.js'

export default function Auth() {
  const nav = useNavigate()
  const [mode, setMode] = useState('signin')  // signin | magic
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const enter = (via) => {
    setLoading(true)
    if (email) updateProfile((p) => { p.user.email = email })
    setTimeout(() => nav('/app'), via === 'magic' ? 900 : 600)
  }

  const submit = (e) => {
    e.preventDefault()
    if (mode === 'magic') {
      setSent(true)
      setTimeout(() => enter('magic'), 1400)
    } else enter('email')
  }

  return (
    <div className="auth-wrap">
      <div className="hero-glow g1" style={{ position: 'absolute' }} />
      <div className="hero-glow g2" style={{ position: 'absolute' }} />
      <div className="card auth-card anim-scale">
        <Link to="/" className="row" style={{ gap: 9, marginBottom: 22 }}>
          <span className="logo-mark">C</span>
          <b style={{ fontSize: 17 }}>Closer</b>
        </Link>
        <h1 style={{ fontSize: 24, marginBottom: 6 }} className="display">Step into the arena.</h1>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 24 }}>Train daily. Track everything. Close anything.</p>

        <div className="col" style={{ gap: 10 }}>
          <button className="auth-provider" onClick={() => enter('google')} disabled={loading}>
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 5.04c1.6 0 3.05.55 4.18 1.64l3.13-3.13C17.4 1.7 14.9.7 12 .7 7.7.7 3.99 3.17 2.18 6.76l3.66 2.84C6.71 7 9.14 5.04 12 5.04Z"/><path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.46a5.53 5.53 0 0 1-2.4 3.58l3.72 2.89c2.16-2.02 3.72-4.98 3.72-8.71Z"/><path fill="#FBBC05" d="M5.84 14.4a7.2 7.2 0 0 1 0-4.6L2.18 6.96a11.3 11.3 0 0 0 0 10.28l3.66-2.84Z"/><path fill="#34A853" d="M12 23.3c3.04 0 5.6-1 7.46-2.72l-3.72-2.89c-1.03.7-2.36 1.1-3.74 1.1-2.86 0-5.29-1.95-6.16-4.57l-3.66 2.84C4 20.83 7.7 23.3 12 23.3Z"/></svg>
            Continue with Google
          </button>
          <button className="auth-provider" onClick={() => enter('apple')} disabled={loading}>
            <svg width="16" height="19" viewBox="0 0 16 19" fill="currentColor" aria-hidden="true"><path d="M13.06 10.1c.02 2.62 2.3 3.5 2.33 3.5-.02.07-.36 1.25-1.2 2.46-.73 1.06-1.48 2.1-2.67 2.13-1.17.02-1.55-.7-2.89-.7-1.34 0-1.76.67-2.87.72-1.15.04-2.02-1.14-2.75-2.19C1.51 13.87.36 10.03 1.9 7.32a4.26 4.26 0 0 1 3.6-2.18c1.13-.02 2.19.76 2.88.76.69 0 1.98-.94 3.34-.8.57.02 2.17.23 3.2 1.73-.08.05-1.91 1.12-1.87 3.27ZM10.84 3.66c.6-.74 1.01-1.76.9-2.78-.87.04-1.93.58-2.55 1.32-.56.65-1.05 1.7-.92 2.7.97.07 1.96-.5 2.57-1.24Z"/></svg>
            Continue with Apple
          </button>
        </div>

        <div className="auth-divider" style={{ margin: '20px 0' }}>or</div>

        <form onSubmit={submit} className="col" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required className="input" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode === 'signin' && (
            <div className="field">
              <label htmlFor="pw">Password</label>
              <input id="pw" type="password" required className="input" placeholder="••••••••" />
            </div>
          )}
          <button type="submit" className="btn btn-gold btn-block" disabled={loading || sent}>
            {sent ? '✓ Magic link sent, signing you in…' : loading ? 'Entering…' : mode === 'magic' ? 'Send magic link' : 'Sign in'}
          </button>
        </form>

        <button
          className="btn btn-dark btn-block btn-sm" style={{ marginTop: 10 }}
          onClick={() => { setMode(mode === 'magic' ? 'signin' : 'magic'); setSent(false) }}
        >
          {mode === 'magic' ? 'Use password instead' : '✨ Passwordless login'}
        </button>

        <p className="muted" style={{ fontSize: 11.5, marginTop: 18, textAlign: 'center' }}>
          Demo build, any option drops you straight into the app.
        </p>
      </div>
    </div>
  )
}

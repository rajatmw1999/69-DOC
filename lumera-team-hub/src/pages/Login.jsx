import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

export function AuthShell({ sub, children }) {
  return (
    <div className="auth-wrap">
      <div className="card card-glow auth-card">
        <div className="auth-logo">
          <Logo size={42} />
          <div className="an">Lumera<small>Team Hub</small></div>
        </div>
        <p className="auth-sub">{sub}</p>
        {children}
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      if (/email not confirmed/i.test(error.message)) {
        setErr('Your email isn’t confirmed yet — check your inbox for the confirmation link.');
      } else {
        setErr(error.message);
      }
    }
    // success: onAuthStateChange routes into the app
  }

  return (
    <AuthShell sub="Log in to your team workspace.">
      {err && <div className="alert alert-error">{err}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@lumera.app" />
        </div>
        <div className="field">
          <label htmlFor="pw">Password</label>
          <input id="pw" className="input" type="password" required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Signing in…' : 'Log in'}
        </button>
      </form>
      <div className="auth-foot">
        <Link to="/forgot-password">Forgot password?</Link>
        <span style={{ margin: '0 8px' }}>·</span>
        <Link to="/signup">Have an invite? Sign up</Link>
      </div>
    </AuthShell>
  );
}

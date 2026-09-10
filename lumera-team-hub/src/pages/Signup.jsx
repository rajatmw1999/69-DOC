import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthShell } from './Login';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (password.length < 8) {
      setErr('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin + '/login',
      },
    });
    setBusy(false);
    if (error) {
      // The invite-gate trigger aborts un-invited signups; Supabase surfaces it
      // as a generic database error.
      if (/database error/i.test(error.message) || /SIGNUP_NOT_INVITED/i.test(error.message)) {
        setErr('This workspace is invite-only. Ask a Lumera admin to invite this email address first.');
      } else {
        setErr(error.message);
      }
      return;
    }
    if (data.user?.identities?.length === 0) {
      setErr('An account with this email already exists. Try logging in instead.');
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthShell sub="One more step.">
        <div className="alert alert-success">
          Check your inbox — we’ve sent a confirmation link to <b>{email}</b>.
          Click it, then log in.
        </div>
        <div className="auth-foot"><Link to="/login">Back to login</Link></div>
      </AuthShell>
    );
  }

  return (
    <AuthShell sub="Create your account. You’ll need an invite from an admin — the very first account becomes the founder/admin automatically.">
      {err && <div className="alert alert-error">{err}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="nm">Full name</label>
          <input id="nm" className="input" required value={name}
            onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" />
        </div>
        <div className="field">
          <label htmlFor="em">Email (the address you were invited with)</label>
          <input id="em" className="input" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@lumera.app" />
        </div>
        <div className="field">
          <label htmlFor="pw">Password (min 8 characters)</label>
          <input id="pw" className="input" type="password" required autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <div className="auth-foot"><Link to="/login">Already have an account? Log in</Link></div>
    </AuthShell>
  );
}

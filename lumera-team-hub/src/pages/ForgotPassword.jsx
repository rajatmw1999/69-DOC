import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthShell } from './Login';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <AuthShell sub="We’ll email you a link to reset your password.">
      {err && <div className="alert alert-error">{err}</div>}
      {sent ? (
        <div className="alert alert-success">
          If an account exists for <b>{email}</b>, a reset link is on its way.
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="em">Email</label>
            <input id="em" className="input" type="email" required autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@lumera.app" />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
      <div className="auth-foot"><Link to="/login">Back to login</Link></div>
    </AuthShell>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from './Login';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const auth = useAuth();

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (password.length < 8) return setErr('Password must be at least 8 characters.');
    if (password !== confirm) return setErr('Passwords don’t match.');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      if (/session/i.test(error.message)) {
        setErr('This reset link has expired or was already used. Request a new one from the login page.');
      } else {
        setErr(error.message);
      }
      return;
    }
    auth?.setRecovery?.(false);
    nav('/', { replace: true });
  }

  return (
    <AuthShell sub="Choose a new password for your account.">
      {err && <div className="alert alert-error">{err}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="pw">New password</label>
          <input id="pw" className="input" type="password" required autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="field">
          <label htmlFor="pw2">Confirm new password</label>
          <input id="pw2" className="input" type="password" required autoComplete="new-password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </AuthShell>
  );
}

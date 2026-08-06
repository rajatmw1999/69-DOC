import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthCtx = createContext(null);
const ToastCtx = createContext(null);

export function useAuth() { return useContext(AuthCtx); }
export function useToast() { return useContext(ToastCtx); }

export function AppProviders({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [profile, setProfile] = useState(null);
  const [team, setTeam] = useState([]);              // all profiles
  const [recovery, setRecovery] = useState(false);   // arrived via password-reset link
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const toast = useCallback((msg, kind = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const loadTeam = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('name');
    if (!error && data) {
      setTeam(data);
      return data;
    }
    return [];
  }, []);

  const loadProfile = useCallback(async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data ?? null);
    return data;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s ?? null);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') { setProfile(null); setTeam([]); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadProfile(session.user.id);
      loadTeam();
    }
  }, [session?.user?.id]); // eslint-disable-line

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const teamById = {};
  for (const p of team) teamById[p.id] = p;

  return (
    <ToastCtx.Provider value={toast}>
      <AuthCtx.Provider value={{
        session, profile, team, teamById, recovery, setRecovery,
        signOut, refreshProfile: () => session?.user && loadProfile(session.user.id),
        refreshTeam: loadTeam,
      }}>
        {children}
        <div className="toast-stack">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.kind === 'error' ? 'err' : ''}`}>{t.msg}</div>
          ))}
        </div>
      </AuthCtx.Provider>
    </ToastCtx.Provider>
  );
}

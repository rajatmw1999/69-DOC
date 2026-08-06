import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { configOk } from './lib/supabase';
import { AppProviders, useAuth } from './context/AuthContext';
import { NebulaBg, Spinner } from './components/ui';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Documents from './pages/Documents';
import Tasks from './pages/Tasks';
import Meetings from './pages/Meetings';
import Announcements from './pages/Announcements';
import Team from './pages/Team';
import ProfilePage from './pages/Profile';
import Admin from './pages/Admin';
import ActionPlan from './pages/ActionPlan';
import NextSteps from './pages/NextSteps';
import Reports from './pages/Reports';
import MasterDoc from './pages/MasterDoc';

function Gate() {
  const { session, profile, recovery } = useAuth();
  const loc = useLocation();

  if (session === undefined) {
    return <div className="full-center"><Spinner /><div className="text-3 small">Waking the nebula…</div></div>;
  }

  // Password-recovery links sign the user in; force them to the reset screen.
  if (recovery && loc.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />;
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (loc.pathname === '/reset-password') {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    );
  }

  if (!profile) {
    return <div className="full-center"><Spinner /><div className="text-3 small">Loading your profile…</div></div>;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/action-plan" element={<ActionPlan />} />
        <Route path="/next-steps" element={<NextSteps />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/master-doc" element={<MasterDoc />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/team" element={<Team />} />
        <Route path="/team/:id" element={<ProfilePage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  if (!configOk) {
    return (
      <>
        <NebulaBg />
        <div className="auth-wrap">
          <div className="card card-glow auth-card">
            <div className="auth-logo"><div className="logo-orb" /><div className="an">Lumera<small>Team Hub</small></div></div>
            <div className="alert alert-info" style={{ marginTop: 12 }}>
              Supabase isn’t configured yet. Copy <code>.env.example</code> to <code>.env</code>,
              fill in <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> from
              your Supabase project settings, then restart the dev server. Full steps are in the README.
            </div>
          </div>
        </div>
      </>
    );
  }
  return (
    <AppProviders>
      <NebulaBg />
      <Gate />
    </AppProviders>
  );
}

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Avatar, EmptyState, Modal, RoleBadge, Spinner } from '../components/ui';
import { IcPlus } from '../components/Icons';
import { timeAgo, ROLE_LABEL } from '../lib/util';

export default function Admin() {
  const { profile, team, refreshTeam } = useAuth();
  const toast = useToast();
  const [invites, setInvites] = useState(null);
  const [showInvite, setShowInvite] = useState(false);

  const isAdmin = profile.role === 'admin';

  async function load() {
    const { data } = await supabase.from('invites').select('*').order('created_at', { ascending: false });
    setInvites(data || []);
  }
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]); // eslint-disable-line

  if (!isAdmin) return <Navigate to="/" replace />;

  async function revoke(inv) {
    const { error } = await supabase.from('invites').delete().eq('id', inv.id);
    if (error) return toast(error.message, 'error');
    setInvites((l) => l.filter((x) => x.id !== inv.id));
    toast(`Invite for ${inv.email} revoked`);
  }

  async function changeRole(p, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', p.id);
    if (error) return toast(error.message, 'error');
    await refreshTeam();
    toast(`${p.name} is now ${ROLE_LABEL[role]}`);
  }

  const pending = (invites || []).filter((i) => !i.accepted_at);
  const accepted = (invites || []).filter((i) => i.accepted_at);

  return (
    <div style={{ maxWidth: 860 }}>
      <div className="page-header">
        <div>
          <h1>Admin</h1>
          <div className="sub">Invite people and manage roles. Signups are blocked without an invite.</div>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
            <span style={{ width: 15, height: 15, display: 'inline-flex' }}><IcPlus /></span> Invite member
          </button>
        </div>
      </div>

      <div className="card card-pad mb-16">
        <div className="card-title">Pending invites ({pending.length})</div>
        {invites === null ? <Spinner /> : pending.length === 0 ? (
          <div className="text-3 small">No pending invites. Invite someone — then tell them to sign up with that email.</div>
        ) : (
          <div className="mini-list">
            {pending.map((inv) => (
              <div key={inv.id} className="mini-item" style={{ cursor: 'default' }}>
                <div className="mi-main">
                  <div className="mi-title">{inv.email}</div>
                  <div className="mi-sub">{ROLE_LABEL[inv.role]} · {inv.department} · invited {timeAgo(inv.created_at)}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => revoke(inv)}>Revoke</button>
              </div>
            ))}
          </div>
        )}
        {accepted.length > 0 && (
          <div className="text-3 small mt-8">{accepted.length} invite{accepted.length === 1 ? '' : 's'} already accepted.</div>
        )}
      </div>

      <div className="card card-pad">
        <div className="card-title">Members ({team.length})</div>
        <div className="mini-list">
          {team.map((p) => (
            <div key={p.id} className="mini-item" style={{ cursor: 'default' }}>
              <Avatar profile={p} size="md" />
              <div className="mi-main">
                <div className="mi-title">{p.name}{p.id === profile.id && ' (you)'}</div>
                <div className="mi-sub">{p.email} · {p.department}</div>
              </div>
              {p.id === profile.id ? <RoleBadge role={p.role} /> : (
                <select className="select" style={{ width: 170 }} value={p.role}
                  onChange={(e) => changeRole(p, e.target.value)}>
                  <option value="admin">Founder / Admin</option>
                  <option value="lead">Team Lead</option>
                  <option value="member">Member</option>
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)}
          onDone={(inv) => { setShowInvite(false); setInvites((l) => [inv, ...(l || [])]); }} />
      )}
    </div>
  );
}

function InviteModal({ onClose, onDone }) {
  const { profile } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [department, setDepartment] = useState('General');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.from('invites').insert({
      email: email.trim().toLowerCase(), role, department: department.trim() || 'General',
      invited_by: profile.id,
    }).select().single();
    setBusy(false);
    if (error) {
      return toast(error.code === '23505'
        ? 'There’s already a pending invite for this email.' : error.message, 'error');
    }
    setCreated(data);
  }

  if (created) {
    return (
      <Modal title="Invite created" onClose={() => onDone(created)}>
        <div className="alert alert-success">
          <b>{created.email}</b> can now sign up.
        </div>
        <p className="text-2 small">
          Send them the app link and tell them to use <b>Sign up</b> with this exact email address.
          They’ll confirm their email and land in the workspace as {ROLE_LABEL[created.role]}.
        </p>
        <div className="modal-foot">
          <button className="btn btn-primary" onClick={() => onDone(created)}>Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Invite a team member" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" autoFocus required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="teammate@lumera.app" />
        </div>
        <div className="flex g12 wrap">
          <div className="field grow">
            <label>Role</label>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="lead">Team Lead</option>
              <option value="admin">Founder / Admin</option>
            </select>
          </div>
          <div className="field grow">
            <label>Department</label>
            <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)}
              placeholder="Engineering" maxLength={40} />
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create invite'}</button>
        </div>
      </form>
    </Modal>
  );
}

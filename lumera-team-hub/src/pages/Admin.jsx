import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Avatar, Modal, RoleBadge, Spinner } from '../components/ui';
import { IcPlus } from '../components/Icons';
import { timeAgo, ROLE_LABEL, ROLE_TITLES, ROLE_OPTIONS, isAdminRole } from '../lib/util';

export default function Admin() {
  const { profile, team, refreshTeam } = useAuth();
  const toast = useToast();
  const [invites, setInvites] = useState(null);
  const [showInvite, setShowInvite] = useState(false);

  const isAdmin = isAdminRole(profile.role);

  async function load() {
    const { data } = await supabase.from('invites').select('*').order('created_at', { ascending: false });
    setInvites(data || []);
  }
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]); // eslint-disable-line

  if (!isAdmin) return <Navigate to="/" replace />;

  async function revoke(inv) {
    const { error } = await supabase.from('invites').delete().eq('id', inv.id);
    if (error) return toast(error.message, 'error');
    const paths = [inv.nda_path, inv.ip_path, inv.contract_path].filter(Boolean);
    if (paths.length) await supabase.storage.from('contracts').remove(paths);
    setInvites((l) => l.filter((x) => x.id !== inv.id));
    toast(`Invite for ${inv.email} revoked`);
  }

  async function changeRole(p, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', p.id);
    if (error) return toast(error.message, 'error');
    await refreshTeam();
    toast(`${p.name} is now ${ROLE_LABEL[role]}`);
  }

  async function openContract(path) {
    const { data, error } = await supabase.storage.from('contracts').createSignedUrl(path, 120);
    if (error) return toast(error.message, 'error');
    window.open(data.signedUrl, '_blank');
  }

  const pending = (invites || []).filter((i) => !i.accepted_at);
  const accepted = (invites || []).filter((i) => i.accepted_at);

  return (
    <div style={{ maxWidth: 860 }}>
      <div className="page-header">
        <div>
          <h1>Admin</h1>
          <div className="sub">Invite people (with their contracts) and manage roles. Signups are blocked without an invite.</div>
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
              <div key={inv.id} className="mini-item" style={{ cursor: 'default', flexWrap: 'wrap' }}>
                <div className="mi-main">
                  <div className="mi-title">{inv.email}</div>
                  <div className="mi-sub">
                    {inv.title || ROLE_LABEL[inv.role]} · {ROLE_LABEL[inv.role]} · {inv.department} · invited {timeAgo(inv.created_at)}
                  </div>
                  <div className="flex g8 mt-8 wrap">
                    {inv.nda_path && <button className="btn btn-ghost btn-sm" onClick={() => openContract(inv.nda_path)}>NDA</button>}
                    {inv.ip_path && <button className="btn btn-ghost btn-sm" onClick={() => openContract(inv.ip_path)}>IP Agreement</button>}
                    {inv.contract_path && <button className="btn btn-ghost btn-sm" onClick={() => openContract(inv.contract_path)}>Role contract</button>}
                  </div>
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
                <div className="mi-sub">{p.title ? `${p.title} · ` : ''}{p.email} · {p.department}</div>
              </div>
              {p.id === profile.id ? <RoleBadge role={p.role} /> :
                (p.role === 'founder' && profile.role !== 'founder') ? (
                  <RoleBadge role={p.role} />
                ) : (
                  <select className="select" style={{ width: 150 }} value={p.role}
                    onChange={(e) => changeRole(p, e.target.value)}>
                    {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
  const [title, setTitle] = useState(ROLE_TITLES[0]);
  const [customTitle, setCustomTitle] = useState('');
  const [department, setDepartment] = useState('General');
  const [nda, setNda] = useState(null);
  const [ip, setIp] = useState(null);
  const [contract, setContract] = useState(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  const finalTitle = title === '__custom__' ? customTitle.trim() : title;

  async function submit(e) {
    e.preventDefault();
    if (!finalTitle) return toast('Pick or type a role title.', 'error');
    setBusy(true);

    const em = email.trim().toLowerCase();
    const uploaded = [];
    const up = async (file, label) => {
      if (!file) return null;
      const path = `${em}/${label}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('contracts').upload(path, file);
      if (error) throw new Error(`${label.toUpperCase()} upload failed: ${error.message}`);
      uploaded.push(path);
      return path;
    };

    try {
      const ndaPath = await up(nda, 'nda');
      const ipPath = await up(ip, 'ip');
      const contractPath = await up(contract, 'role');
      const { data, error } = await supabase.from('invites').insert({
        email: em, role, department: department.trim() || 'General',
        title: finalTitle, invited_by: profile.id,
        nda_path: ndaPath, ip_path: ipPath, contract_path: contractPath,
      }).select().single();
      if (error) {
        if (uploaded.length) await supabase.storage.from('contracts').remove(uploaded);
        throw new Error(error.code === '23505'
          ? 'There’s already a pending invite for this email.' : error.message);
      }
      setCreated(data);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <Modal title="Invite created" onClose={() => onDone(created)}>
        <div className="alert alert-success">
          <b>{created.email}</b> can now sign up as <b>{created.title}</b>.
        </div>
        <p className="text-2 small">
          Any contracts you attached are stored with the invite. You can also add or update
          them anytime from their profile — the contracts aren’t required to invite. Send them
          the app link and tell them to use <b>Sign up</b> with this exact email address.
        </p>
        <div className="modal-foot">
          <button className="btn btn-primary" onClick={() => onDone(created)}>Done</button>
        </div>
      </Modal>
    );
  }

  const FileField = ({ label, value, set }) => (
    <div className="field">
      <label>{label} {value ? '✓' : ''}</label>
      <input className="input" type="file" accept=".pdf,.doc,.docx"
        onChange={(e) => set(e.target.files?.[0] || null)} />
    </div>
  );

  return (
    <Modal title="Invite a team member" onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" autoFocus required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="teammate@lumera.app" />
        </div>
        <div className="flex g12 wrap">
          <div className="field grow">
            <label>Role title</label>
            <select className="select" value={title} onChange={(e) => setTitle(e.target.value)}>
              {ROLE_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
              <option value="__custom__">Custom…</option>
            </select>
          </div>
          <div className="field grow">
            <label>Access level</label>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="field grow">
            <label>Department</label>
            <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)}
              placeholder="Engineering" maxLength={40} />
          </div>
        </div>
        {title === '__custom__' && (
          <div className="field">
            <label>Custom title</label>
            <input className="input" required value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Finance Associate" maxLength={60} />
          </div>
        )}
        <div className="card card-pad mb-16" style={{ background: 'rgba(168,85,247,0.05)' }}>
          <div className="card-title">Contracts (optional — add now or later)</div>
          <FileField label="Non-Disclosure Agreement (NDA)" value={nda} set={setNda} />
          <FileField label="Intellectual Property Rights Agreement" value={ip} set={setIp} />
          <FileField label="Role-specific contract" value={contract} set={setContract} />
          <div className="text-3 small">Attach whichever you have — you can upload or replace the rest anytime from their profile.</div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Creating…' : 'Create invite'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

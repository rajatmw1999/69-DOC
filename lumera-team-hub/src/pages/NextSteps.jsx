import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Avatar, EmptyState, Modal, Spinner } from '../components/ui';
import { IcPlus } from '../components/Icons';
import { dueState, fmtDate, timeAgo, isAdminRole } from '../lib/util';

export default function NextSteps() {
  const { profile, team, teamById } = useAuth();
  const toast = useToast();
  const [steps, setSteps] = useState(null);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    const { data, error } = await supabase.from('next_steps').select('*')
      .order('status').order('due_date', { ascending: true, nullsFirst: false });
    if (error) toast('Couldn’t load — if you just upgraded, run migration 002 in Supabase.', 'error');
    setSteps(data || []);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function toggle(s) {
    const status = s.status === 'done' ? 'open' : 'done';
    setSteps((l) => l.map((x) => (x.id === s.id ? { ...x, status } : x)));
    const { error } = await supabase.from('next_steps').update({ status }).eq('id', s.id);
    if (error) {
      setSteps((l) => l.map((x) => (x.id === s.id ? { ...x, status: s.status } : x)));
      toast(/row-level security/i.test(error.message)
        ? 'Only the owner, creator or an admin can update this.' : error.message, 'error');
    }
  }

  async function remove(s) {
    if (!window.confirm(`Delete “${s.title}”?`)) return;
    const { error } = await supabase.from('next_steps').delete().eq('id', s.id);
    if (error) return toast(error.message, 'error');
    setSteps((l) => l.filter((x) => x.id !== s.id));
  }

  if (!steps) return <Spinner fill />;
  const open = steps.filter((s) => s.status === 'open');
  const done = steps.filter((s) => s.status === 'done');

  const Row = ({ s }) => {
    const ds = dueState(s.due_date, s.status === 'done' ? 'done' : 'todo');
    const canDelete = s.created_by === profile.id || isAdminRole(profile.role);
    return (
      <div className="mini-item" style={{ cursor: 'default', opacity: s.status === 'done' ? 0.6 : 1 }}>
        <input type="checkbox" checked={s.status === 'done'} onChange={() => toggle(s)}
          style={{ width: 17, height: 17, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} />
        <div className="mi-main">
          <div className="mi-title" style={s.status === 'done' ? { textDecoration: 'line-through' } : {}}>{s.title}</div>
          <div className="mi-sub">
            {s.details && `${s.details.slice(0, 90)}${s.details.length > 90 ? '…' : ''} · `}
            added by {teamById[s.created_by]?.name || '—'} {timeAgo(s.created_at)}
          </div>
        </div>
        {s.owner_id && <Avatar profile={teamById[s.owner_id]} size="sm" />}
        {s.due_date && <span className={`due-pill ${ds || ''}`}>{fmtDate(s.due_date)}</span>}
        {canDelete && <button className="btn btn-ghost btn-sm" onClick={() => remove(s)} title="Delete">✕</button>}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <div className="page-header">
        <div>
          <h1>Next Steps</h1>
          <div className="sub">The team’s shared to-do list for what happens next — check things off as they land.</div>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <span style={{ width: 15, height: 15, display: 'inline-flex' }}><IcPlus /></span> Add next step
          </button>
        </div>
      </div>

      <div className="card card-glow card-pad mb-16">
        <div className="card-title">Open ({open.length})</div>
        {open.length === 0 && <EmptyState title="Nothing queued" sub="Add the next thing the team should do." />}
        <div className="mini-list">{open.map((s) => <Row key={s.id} s={s} />)}</div>
      </div>

      {done.length > 0 && (
        <div className="card card-pad">
          <div className="card-title">Done ({done.length})</div>
          <div className="mini-list">{done.map((s) => <Row key={s.id} s={s} />)}</div>
        </div>
      )}

      {showNew && (
        <NewStep team={team} onClose={() => setShowNew(false)}
          onDone={(s) => { setShowNew(false); setSteps((l) => [s, ...l]); }} />
      )}
    </div>
  );
}

function NewStep({ team, onClose, onDone }) {
  const { profile } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [owner, setOwner] = useState('');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.from('next_steps').insert({
      title: title.trim(), details: details.trim(),
      owner_id: owner || null, due_date: due || null, created_by: profile.id,
    }).select().single();
    setBusy(false);
    if (error) return toast(error.message, 'error');
    onDone(data);
  }

  return (
    <Modal title="Add a next step" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>What needs to happen?</label>
          <input className="input" autoFocus required value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Finalize pricing page copy" maxLength={300} />
        </div>
        <div className="field">
          <label>Details (optional)</label>
          <textarea className="textarea" value={details} onChange={(e) => setDetails(e.target.value)}
            placeholder="Context, links, definition of done…" />
        </div>
        <div className="flex g12 wrap">
          <div className="field grow">
            <label>Owner</label>
            <select className="select" value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="">Unassigned</option>
              {team.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field grow">
            <label>Due date</label>
            <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
        </div>
      </form>
    </Modal>
  );
}

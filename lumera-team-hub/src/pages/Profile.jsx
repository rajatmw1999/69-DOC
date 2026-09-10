import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Avatar, EmptyState, Modal, RoleBadge, Spinner } from '../components/ui';
import { dueState, fmtDate, timeAgo } from '../lib/util';

export default function ProfilePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { profile: me, teamById, refreshProfile, refreshTeam } = useAuth();
  const toast = useToast();

  const person = teamById[id];
  const isMe = id === me.id;
  const [editing, setEditing] = useState(false);
  const [tasks, setTasks] = useState(null);
  const [busyAvatar, setBusyAvatar] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    let alive = true;
    supabase.from('tasks').select('*').eq('assignee_id', id).neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false }).limit(10)
      .then(({ data }) => alive && setTasks(data || []));
    return () => { alive = false; };
  }, [id]);

  if (!person) {
    return <div className="card"><EmptyState title="Member not found"
      sub="They may have been removed from the workspace.">
      <button className="btn btn-ghost mt-16" onClick={() => nav('/team')}>Back to team</button>
    </EmptyState></div>;
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Choose an image file.', 'error');
    if (file.size > 3 * 1024 * 1024) return toast('Max avatar size is 3 MB.', 'error');
    setBusyAvatar(true);
    const ext = file.name.split('.').pop() || 'png';
    const path = `${me.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file);
    if (upErr) { setBusyAvatar(false); return toast('Upload failed: ' + upErr.message, 'error'); }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error } = await supabase.from('profiles').update({ avatar_url: pub.publicUrl }).eq('id', me.id);
    setBusyAvatar(false);
    if (error) return toast(error.message, 'error');
    await refreshProfile();
    await refreshTeam();
    toast('Avatar updated');
  }

  async function changeRole(role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', person.id);
    if (error) return toast(error.message, 'error');
    await refreshTeam();
    if (isMe) await refreshProfile();
    toast(`${person.name} is now ${role}`);
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="card card-glow card-pad mb-16">
        <div className="flex g12 wrap" style={{ alignItems: 'flex-start' }}>
          <div style={{ position: 'relative' }}>
            <Avatar profile={person} size="xl" />
            {isMe && (
              <>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, width: '100%' }}
                  disabled={busyAvatar} onClick={() => fileRef.current?.click()}>
                  {busyAvatar ? '…' : 'Change'}
                </button>
                <input type="file" hidden ref={fileRef} accept="image/*" onChange={uploadAvatar} />
              </>
            )}
          </div>
          <div className="grow">
            <div className="flex aic g12 wrap">
              <h1 style={{ fontSize: 22 }}>{person.name}</h1>
              <RoleBadge role={person.role} />
            </div>
            <div className="text-2 mt-8">{person.department} · <a href={`mailto:${person.email}`}>{person.email}</a></div>
            {person.current_focus && <div className="text-2 mt-8">🎯 <b>Currently:</b> {person.current_focus}</div>}
            {person.bio && <p className="text-2 mt-8" style={{ whiteSpace: 'pre-wrap' }}>{person.bio}</p>}
            <div className="text-3 small mt-8">Joined {timeAgo(person.created_at)}</div>
            <div className="flex g8 mt-16 wrap">
              {isMe && <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit profile</button>}
              {!isMe && <button className="btn btn-primary" onClick={() => nav(`/messages?dm=${person.id}`)}>Message</button>}
              {me.role === 'admin' && !isMe && (
                <select className="select" style={{ width: 180 }} value={person.role}
                  onChange={(e) => changeRole(e.target.value)}>
                  <option value="admin">Founder / Admin</option>
                  <option value="lead">Team Lead</option>
                  <option value="member">Member</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="card-title">{isMe ? 'Your open tasks' : `${person.name.split(' ')[0]}’s open tasks`}</div>
        {tasks === null ? <Spinner /> : tasks.length === 0 ? (
          <div className="text-3 small">No open tasks.</div>
        ) : (
          <div className="mini-list">
            {tasks.map((t) => {
              const ds = dueState(t.due_date, t.status);
              return (
                <div key={t.id} className="mini-item" onClick={() => nav(`/tasks?task=${t.id}`)}>
                  <div className="mi-main">
                    <div className="mi-title">{t.title}</div>
                    <div className="mi-sub">{t.status === 'in_progress' ? 'In progress' : 'To do'}</div>
                  </div>
                  {t.due_date && <span className={`due-pill ${ds || ''}`}>{fmtDate(t.due_date)}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && <EditProfile onClose={() => setEditing(false)} />}
    </div>
  );
}

function EditProfile({ onClose }) {
  const { profile, refreshProfile, refreshTeam } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(profile.name);
  const [department, setDepartment] = useState(profile.department);
  const [bio, setBio] = useState(profile.bio);
  const [focus, setFocus] = useState(profile.current_focus);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from('profiles').update({
      name: name.trim(), department: department.trim() || 'General',
      bio: bio.trim(), current_focus: focus.trim(),
    }).eq('id', profile.id);
    setBusy(false);
    if (error) return toast(error.message, 'error');
    await refreshProfile();
    await refreshTeam();
    onClose();
  }

  return (
    <Modal onClose={onClose} title="Edit profile">
      <form onSubmit={submit}>
        <div className="field">
          <label>Full name</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </div>
        <div className="field">
          <label>Department</label>
          <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)}
            placeholder="Engineering / Design / Marketing / Finance / Leadership" maxLength={40} />
        </div>
        <div className="field">
          <label>What are you working on right now?</label>
          <input className="input" value={focus} onChange={(e) => setFocus(e.target.value)}
            placeholder="Shipping the onboarding flow" maxLength={140} />
        </div>
        <div className="field">
          <label>Bio</label>
          <textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)}
            placeholder="A line or two about you." maxLength={400} />
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

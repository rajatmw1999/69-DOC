import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Avatar, EmptyState, Modal, RoleBadge, Spinner } from '../components/ui';
import { dueState, fmtDate, timeAgo, isAdminRole, ROLE_OPTIONS, birthdayLabel } from '../lib/util';

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

  const isAdmin = isAdminRole(me.role);
  const [contracts, setContracts] = useState([]);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const slotFileRef = useRef(null);
  const pendingSlot = useRef(null);
  const canSeeContracts = isMe || isAdmin;
  const emailFolder = person?.email?.toLowerCase();

  useEffect(() => {
    let alive = true;
    supabase.from('tasks').select('*').eq('assignee_id', id).neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false }).limit(10)
      .then(({ data }) => alive && setTasks(data || []));
    if (canSeeContracts && emailFolder) {
      supabase.storage.from('contracts').list(emailFolder)
        .then(({ data }) => alive && setContracts((data || []).filter((f) => f.id)));
    }
    return () => { alive = false; };
  }, [id, canSeeContracts, emailFolder]);

  const CONTRACT_SLOTS = [
    { key: 'nda', label: 'NDA' },
    { key: 'ip', label: 'IP Rights Agreement' },
    { key: 'role', label: 'Role-specific Contract' },
  ];
  const findContract = (key) => contracts.find((f) => f.name.startsWith(key + '-'));
  const otherContracts = contracts.filter(
    (f) => !CONTRACT_SLOTS.some((s) => f.name.startsWith(s.key + '-')));
  const prettyContract = (name) => {
    const m = name.match(/^(nda|ip|role|other)-\d+-(.*)$/);
    if (!m) return name;
    const lbl = { nda: 'NDA', ip: 'IP Agreement', role: 'Role Contract', other: 'Document' }[m[1]];
    return `${lbl}: ${m[2]}`;
  };

  async function refreshContracts() {
    const { data } = await supabase.storage.from('contracts').list(emailFolder);
    setContracts((data || []).filter((f) => f.id));
  }

  async function openContract(name) {
    const { data, error } = await supabase.storage.from('contracts')
      .createSignedUrl(`${emailFolder}/${name}`, 120);
    if (error) return toast(error.message, 'error');
    window.open(data.signedUrl, '_blank');
  }

  function pickFile(key) {
    pendingSlot.current = key;
    slotFileRef.current?.click();
  }

  async function onSlotFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    const key = pendingSlot.current;
    if (!file || !key) return;
    if (file.size > 25 * 1024 * 1024) return toast('Max contract size is 25 MB.', 'error');
    setUploadingSlot(key);
    const existing = key === 'other' ? null : findContract(key);
    const path = `${emailFolder}/${key}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('contracts').upload(path, file);
    if (!error && existing) {
      await supabase.storage.from('contracts').remove([`${emailFolder}/${existing.name}`]);
    }
    setUploadingSlot(null);
    if (error) return toast('Upload failed: ' + error.message, 'error');
    toast(`${key === 'other' ? 'Document' : key.toUpperCase()} saved for ${person.name.split(' ')[0]}`);
    refreshContracts();
  }

  async function deleteContract(name) {
    if (!window.confirm('Delete this contract?')) return;
    const { error } = await supabase.storage.from('contracts').remove([`${emailFolder}/${name}`]);
    if (error) return toast(error.message, 'error');
    refreshContracts();
  }

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
            {person.title && <div className="text-2 mt-8" style={{ fontWeight: 600 }}>{person.title}</div>}
            <div className="text-2 mt-8">{person.department} · <a href={`mailto:${person.email}`}>{person.email}</a></div>
            <BirthdayRow person={person} canEdit={isMe || isAdminRole(me.role)} onSaved={refreshTeam} />
            {person.current_focus && <div className="text-2 mt-8">🎯 <b>Currently:</b> {person.current_focus}</div>}
            {person.bio && <p className="text-2 mt-8" style={{ whiteSpace: 'pre-wrap' }}>{person.bio}</p>}
            <div className="text-3 small mt-8">Joined {timeAgo(person.created_at)}</div>
            <div className="flex g8 mt-16 wrap">
              {isMe && <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit profile</button>}
              {!isMe && <button className="btn btn-primary" onClick={() => nav(`/messages?dm=${person.id}`)}>Message</button>}
              {isAdminRole(me.role) && !isMe && !(person.role === 'founder' && me.role !== 'founder') && (
                <select className="select" style={{ width: 160 }} value={person.role}
                  onChange={(e) => changeRole(e.target.value)}>
                  {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {(isAdmin || (isMe && contracts.length > 0)) && (
        <div className="card card-pad mb-16">
          <div className="card-title">
            {isMe ? 'Your contracts' : `${person.name.split(' ')[0]}’s contracts`}
          </div>

          {isAdmin ? (
            <>
              <div className="contract-slots">
                {CONTRACT_SLOTS.map((s) => {
                  const f = findContract(s.key);
                  const busy = uploadingSlot === s.key;
                  return (
                    <div key={s.key} className="contract-slot">
                      <div className="cs-label">{s.label} {f && <span style={{ color: 'var(--success)' }}>✓</span>}</div>
                      {f ? (
                        <>
                          <div className="text-3 small ellipsis mb-8" title={prettyContract(f.name)}>
                            {f.name.replace(/^\w+-\d+-/, '')}
                          </div>
                          <div className="flex g8 wrap">
                            <button className="btn btn-ghost btn-sm" onClick={() => openContract(f.name)}>View</button>
                            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => pickFile(s.key)}>
                              {busy ? '…' : 'Replace'}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteContract(f.name)}>✕</button>
                          </div>
                        </>
                      ) : (
                        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => pickFile(s.key)}>
                          {busy ? 'Uploading…' : '＋ Upload'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {otherContracts.length > 0 && (
                <div className="mt-16">
                  <div className="text-3 small mb-8">Other documents</div>
                  <div className="flex g8 wrap">
                    {otherContracts.map((f) => (
                      <span key={f.name} className="flex aic g8">
                        <button className="btn btn-ghost btn-sm" onClick={() => openContract(f.name)}>
                          📄 {f.name.replace(/^\w+-\d+-/, '')}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteContract(f.name)}>✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-16">
                <button className="btn btn-ghost btn-sm" disabled={uploadingSlot === 'other'} onClick={() => pickFile('other')}>
                  {uploadingSlot === 'other' ? 'Uploading…' : '＋ Add another document'}
                </button>
              </div>
              <div className="text-3 small mt-8">
                Only admins can upload or remove contracts. {isMe ? 'You' : person.name.split(' ')[0]} can view them here.
              </div>
              <input type="file" hidden ref={slotFileRef} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={onSlotFile} />
            </>
          ) : (
            <div className="flex g8 wrap">
              {contracts.map((f) => (
                <button key={f.name} className="btn btn-ghost btn-sm" onClick={() => openContract(f.name)}>
                  📄 {prettyContract(f.name)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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

function BirthdayRow({ person, canEdit, onSaved }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(person.birthday || '');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from('profiles')
      .update({ birthday: val || null }).eq('id', person.id);
    setBusy(false);
    if (error) return toast(error.message, 'error');
    setEditing(false);
    person.birthday = val || null; // optimistic local
    onSaved?.();
    toast('Birthday saved');
  }

  if (editing) {
    return (
      <div className="flex aic g8 mt-8 wrap">
        <span>🎂</span>
        <input className="input" style={{ width: 170 }} type="date" value={val || ''}
          onChange={(e) => setVal(e.target.value)} />
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? '…' : 'Save'}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setVal(person.birthday || ''); setEditing(false); }}>Cancel</button>
        <span className="text-3 small">(only the day &amp; month are shown to the team)</span>
      </div>
    );
  }
  if (person.birthday) {
    return (
      <div className="text-2 mt-8">
        🎂 <b>Birthday:</b> {birthdayLabel(person.birthday)}
        {canEdit && <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={() => setEditing(true)}>Edit</button>}
      </div>
    );
  }
  if (canEdit) {
    return (
      <div className="mt-8">
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>🎂 Add birthday</button>
      </div>
    );
  }
  return null;
}

function EditProfile({ onClose }) {
  const { profile, refreshProfile, refreshTeam } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(profile.name);
  const [title, setTitle] = useState(profile.title || '');
  const [department, setDepartment] = useState(profile.department);
  const [bio, setBio] = useState(profile.bio);
  const [focus, setFocus] = useState(profile.current_focus);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from('profiles').update({
      name: name.trim(), title: title.trim(), department: department.trim() || 'General',
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
          <label>Job title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Founder & CEO" maxLength={60} />
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

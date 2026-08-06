import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Avatar, EmptyState, Modal, Spinner } from '../components/ui';
import { IcPlus } from '../components/Icons';
import { fmtBytes, timeAgo, weekStartOf, isAdminRole } from '../lib/util';

export default function Reports() {
  const { profile, teamById } = useAuth();
  const toast = useToast();
  const [reports, setReports] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [open, setOpen] = useState(null); // expanded report id

  async function load() {
    const { data, error } = await supabase.from('weekly_reports').select('*')
      .order('week_start', { ascending: false }).order('created_at', { ascending: false });
    if (error) toast('Couldn’t load — if you just upgraded, run migration 002 in Supabase.', 'error');
    setReports(data || []);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function remove(r) {
    if (!window.confirm(`Delete report “${r.title}”?`)) return;
    const { error } = await supabase.from('weekly_reports').delete().eq('id', r.id);
    if (error) return toast(error.message, 'error');
    if (r.file_path) await supabase.storage.from('chat-files').remove([r.file_path]);
    setReports((l) => l.filter((x) => x.id !== r.id));
  }

  async function openFile(r) {
    const { data, error } = await supabase.storage.from('chat-files')
      .createSignedUrl(r.file_path, 120, { download: r.file_name });
    if (error) return toast(error.message, 'error');
    window.open(data.signedUrl, '_blank');
  }

  if (!reports) return <Spinner fill />;

  const fmtWeek = (d) => {
    const start = new Date(d + 'T00:00:00');
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <div className="page-header">
        <div>
          <h1>Weekly Reports</h1>
          <div className="sub">Write or upload weekly progress reports — or generate a draft from the team’s actual activity.</div>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <span style={{ width: 15, height: 15, display: 'inline-flex' }}><IcPlus /></span> New report
          </button>
        </div>
      </div>

      {reports.length === 0 && (
        <div className="card"><EmptyState title="No reports yet"
          sub="Create the first weekly report — the Generate button drafts it from real activity." /></div>
      )}

      {reports.map((r) => (
        <div key={r.id} className="card card-pad mb-16">
          <div className="flex aic jcb g12 wrap">
            <div className="grow clickable" onClick={() => setOpen(open === r.id ? null : r.id)}>
              <h3 style={{ fontSize: 15.5 }}>{r.title || `Week of ${fmtWeek(r.week_start)}`}</h3>
              <div className="text-3 small mt-8">
                Week {fmtWeek(r.week_start)} · by {teamById[r.created_by]?.name || '—'} · {timeAgo(r.created_at)}
              </div>
            </div>
            <div className="flex g8">
              {r.file_path && (
                <button className="btn btn-ghost btn-sm" onClick={() => openFile(r)}>
                  📎 {r.file_name || 'Attachment'}
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(open === r.id ? null : r.id)}>
                {open === r.id ? 'Collapse' : 'Read'}
              </button>
              {(r.created_by === profile.id || isAdminRole(profile.role)) && (
                <button className="btn btn-danger btn-sm" onClick={() => remove(r)}>Delete</button>
              )}
            </div>
          </div>
          {open === r.id && r.content && (
            <div className="mt-16 text-2" style={{ whiteSpace: 'pre-wrap', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              {r.content}
            </div>
          )}
        </div>
      ))}

      {showNew && (
        <NewReport onClose={() => setShowNew(false)}
          onDone={(r) => { setShowNew(false); setReports((l) => [r, ...l]); }} />
      )}
    </div>
  );
}

function NewReport({ onClose, onDone }) {
  const { profile, teamById } = useAuth();
  const toast = useToast();
  const [week, setWeek] = useState(weekStartOf());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);

  async function generate() {
    setGenBusy(true);
    const start = new Date(week + 'T00:00:00');
    const end = new Date(start); end.setDate(start.getDate() + 7);
    const [s, e] = [start.toISOString(), end.toISOString()];

    const [doneTasks, newDocs, meetings, anns, polls] = await Promise.all([
      supabase.from('tasks').select('title, assignee_id').eq('status', 'done').gte('updated_at', s).lt('updated_at', e),
      supabase.from('documents').select('name, folder, uploaded_by').gte('created_at', s).lt('created_at', e),
      supabase.from('meetings').select('title, starts_at').gte('starts_at', s).lt('starts_at', e),
      supabase.from('announcements').select('title').gte('created_at', s).lt('created_at', e),
      supabase.from('polls').select('question').gte('created_at', s).lt('created_at', e),
    ]);

    const name = (id) => teamById[id]?.name?.split(' ')[0] || 'someone';
    const lines = [];
    lines.push(`WEEKLY REPORT — week of ${start.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`);
    lines.push('');
    lines.push('✅ Shipped / completed');
    if (doneTasks.data?.length) doneTasks.data.forEach((t) => lines.push(`  • ${t.title}${t.assignee_id ? ` (${name(t.assignee_id)})` : ''}`));
    else lines.push('  • (no tasks marked done this week)');
    lines.push('');
    lines.push('📄 Documents added');
    if (newDocs.data?.length) newDocs.data.forEach((d) => lines.push(`  • ${d.name} [${d.folder}] — ${name(d.uploaded_by)}`));
    else lines.push('  • (none)');
    lines.push('');
    lines.push('📅 Meetings held / scheduled');
    if (meetings.data?.length) meetings.data.forEach((m) => lines.push(`  • ${m.title} (${new Date(m.starts_at).toLocaleDateString(undefined, { weekday: 'short' })})`));
    else lines.push('  • (none)');
    if (anns.data?.length) {
      lines.push('');
      lines.push('📣 Announcements');
      anns.data.forEach((a) => lines.push(`  • ${a.title}`));
    }
    if (polls.data?.length) {
      lines.push('');
      lines.push('🗳 Decisions / polls');
      polls.data.forEach((p) => lines.push(`  • ${p.question}`));
    }
    lines.push('');
    lines.push('🚧 Blockers / risks');
    lines.push('  • ');
    lines.push('');
    lines.push('🎯 Focus for next week');
    lines.push('  • ');

    setContent(lines.join('\n'));
    if (!title) setTitle(`Weekly Report — ${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`);
    setGenBusy(false);
    toast('Draft generated from this week’s activity — edit before saving.');
  }

  async function submit(e) {
    e.preventDefault();
    if (!content.trim() && !file) return toast('Write/generate content or attach a file.', 'error');
    setBusy(true);
    let filePath = null;
    if (file) {
      filePath = `reports/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('chat-files').upload(filePath, file);
      if (upErr) { setBusy(false); return toast('Upload failed: ' + upErr.message, 'error'); }
    }
    const { data, error } = await supabase.from('weekly_reports').insert({
      week_start: week, title: title.trim(), content: content.trim(),
      file_path: filePath, file_name: file?.name || null, created_by: profile.id,
    }).select().single();
    setBusy(false);
    if (error) return toast(error.message, 'error');
    onDone(data);
  }

  return (
    <Modal title="New weekly report" onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="flex g12 wrap">
          <div className="field grow">
            <label>Week starting (Monday)</label>
            <input className="input" type="date" value={week} onChange={(e) => setWeek(e.target.value)} required />
          </div>
          <div className="field grow">
            <label>Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly Report — Jul 6" maxLength={120} />
          </div>
        </div>
        <div className="field">
          <div className="flex aic jcb">
            <label>Report</label>
            <button type="button" className="btn btn-ghost btn-sm" onClick={generate} disabled={genBusy}>
              {genBusy ? 'Generating…' : '✨ Generate draft from this week’s activity'}
            </button>
          </div>
          <textarea className="textarea" rows={12} value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Write the report, or hit Generate to prefill it from real tasks, docs, meetings and polls…" />
        </div>
        <div className="field">
          <label>Attachment (optional — e.g. a slides/PDF version)</label>
          <input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file && <div className="text-3 small mt-8">{file.name} · {fmtBytes(file.size)}</div>}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save report'}</button>
        </div>
      </form>
    </Modal>
  );
}

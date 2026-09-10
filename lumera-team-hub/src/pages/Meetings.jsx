import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Avatar, EmptyState, Modal, Spinner } from '../components/ui';
import { IcPlus } from '../components/Icons';
import { fmtDateTime, timeAgo } from '../lib/util';

export default function Meetings() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'polls' ? 'polls' : 'meetings';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Meetings &amp; Polls</h1>
          <div className="sub">Schedule syncs, capture minutes, and make team decisions.</div>
        </div>
      </div>
      <div className="tabs">
        <button className={`tab ${tab === 'meetings' ? 'active' : ''}`} onClick={() => setParams({})}>Meetings</button>
        <button className={`tab ${tab === 'polls' ? 'active' : ''}`} onClick={() => setParams({ tab: 'polls' })}>Polls</button>
      </div>
      {tab === 'meetings' ? <MeetingsTab /> : <PollsTab />}
    </div>
  );
}

/* ================= MEETINGS ================= */

function MeetingsTab() {
  const { profile, teamById } = useAuth();
  const toast = useToast();
  const [meetings, setMeetings] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [openNotes, setOpenNotes] = useState(null); // meeting id

  async function load() {
    const { data } = await supabase.from('meetings')
      .select('*, meeting_attendees(user_id), meeting_notes(id)')
      .order('starts_at', { ascending: false });
    setMeetings(data || []);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  const now = new Date();
  const upcoming = useMemo(() => (meetings || []).filter((m) => new Date(m.starts_at) >= now).reverse(), [meetings]); // eslint-disable-line
  const past = useMemo(() => (meetings || []).filter((m) => new Date(m.starts_at) < now), [meetings]); // eslint-disable-line

  async function remove(m) {
    if (!window.confirm(`Delete “${m.title}”?`)) return;
    const { error } = await supabase.from('meetings').delete().eq('id', m.id);
    if (error) return toast(error.message, 'error');
    setMeetings((l) => l.filter((x) => x.id !== m.id));
  }

  function MeetingCard({ m, past }) {
    const attendees = (m.meeting_attendees || []).map((a) => teamById[a.user_id]).filter(Boolean);
    const mine = m.created_by === profile.id || profile.role === 'admin';
    const amAttendee = (m.meeting_attendees || []).some((a) => a.user_id === profile.id);
    return (
      <div className={`card card-pad mb-16 ${past ? '' : 'card-glow'}`} style={past ? { opacity: 0.75 } : {}}>
        <div className="flex aic jcb g12 wrap">
          <div className="grow">
            <div className="flex aic g8 wrap">
              <h3 style={{ fontSize: 15.5 }}>{m.title}</h3>
              {amAttendee && !past && <span className="badge">You’re attending</span>}
            </div>
            <div className="text-3 small mt-8">
              {fmtDateTime(m.starts_at)}{m.ends_at ? ` – ${new Date(m.ends_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : ''}
              {m.location && <> · {/^https?:\/\//.test(m.location)
                ? <a href={m.location} target="_blank" rel="noreferrer">{m.location}</a> : m.location}</>}
            </div>
          </div>
          <div className="flex aic g8">
            <div className="poll-voters">
              {attendees.slice(0, 6).map((p) => <Avatar key={p.id} profile={p} size="sm" />)}
            </div>
            {attendees.length > 6 && <span className="text-3 small">+{attendees.length - 6}</span>}
            {mine && <button className="btn btn-danger btn-sm" onClick={() => remove(m)}>Delete</button>}
          </div>
        </div>
        {m.agenda && (
          <div className="mt-8 text-2 small" style={{ whiteSpace: 'pre-wrap' }}>
            <b style={{ color: 'var(--text-1)' }}>Agenda:</b> {m.agenda}
          </div>
        )}
        <div className="mt-8">
          <button className="btn btn-ghost btn-sm" onClick={() => setOpenNotes(openNotes === m.id ? null : m.id)}>
            {openNotes === m.id ? 'Hide notes' : `Notes & minutes${m.meeting_notes?.length ? ` (${m.meeting_notes.length})` : ''}`}
          </button>
        </div>
        {openNotes === m.id && <MeetingNotes meetingId={m.id} onCount={load} />}
      </div>
    );
  }

  if (!meetings) return <Spinner fill />;

  return (
    <div>
      <div className="flex jcb aic mb-16">
        <div className="card-title" style={{ margin: 0 }}>Upcoming</div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}><IcPlus /></span> Schedule meeting
        </button>
      </div>
      {upcoming.length === 0 && (
        <div className="card mb-16"><EmptyState title="No upcoming meetings"
          sub="Schedule the next sync — attendees get notified automatically." /></div>
      )}
      {upcoming.map((m) => <MeetingCard key={m.id} m={m} past={false} />)}

      {past.length > 0 && (
        <>
          <div className="card-title mt-16">Past</div>
          {past.slice(0, 10).map((m) => <MeetingCard key={m.id} m={m} past />)}
        </>
      )}

      {showNew && <NewMeeting onClose={() => setShowNew(false)}
        onDone={() => { setShowNew(false); load(); }} />}
    </div>
  );
}

function MeetingNotes({ meetingId, onCount }) {
  const { profile, teamById } = useAuth();
  const toast = useToast();
  const [notes, setNotes] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('meeting_notes').select('*').eq('meeting_id', meetingId).order('created_at')
      .then(({ data }) => setNotes(data || []));
  }, [meetingId]);

  async function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from('meeting_notes').insert({
      meeting_id: meetingId, author_id: profile.id, content: text.trim(),
    }).select().single();
    setBusy(false);
    if (error) return toast(error.message, 'error');
    setNotes((l) => [...l, data]);
    setText('');
    onCount?.();
  }

  if (!notes) return <Spinner />;
  return (
    <div className="mt-8" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
      {notes.length === 0 && <div className="text-3 small mb-8">No notes yet — capture the minutes here.</div>}
      {notes.map((n) => (
        <div key={n.id} className="feed-item">
          <Avatar profile={teamById[n.author_id]} size="sm" />
          <div className="grow">
            <div className="fi-text"><b>{teamById[n.author_id]?.name}</b>
              <span className="fi-time" style={{ marginLeft: 8 }}>{timeAgo(n.created_at)}</span></div>
            <div className="text-2 small" style={{ whiteSpace: 'pre-wrap' }}>{n.content}</div>
          </div>
        </div>
      ))}
      <form onSubmit={add} className="flex g8 mt-8">
        <input className="input" placeholder="Add a note / minute…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>Add</button>
      </form>
    </div>
  );
}

function NewMeeting({ onClose, onDone }) {
  const { profile, team } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [location, setLocation] = useState('');
  const [when, setWhen] = useState('');
  const [duration, setDuration] = useState(30);
  const [attendees, setAttendees] = useState(new Set([profile.id]));
  const [busy, setBusy] = useState(false);

  function toggle(id) {
    setAttendees((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function submit(e) {
    e.preventDefault();
    const starts = new Date(when);
    if (Number.isNaN(starts.getTime())) return toast('Pick a valid date & time.', 'error');
    setBusy(true);
    const { data, error } = await supabase.from('meetings').insert({
      title: title.trim(), agenda: agenda.trim(), location: location.trim(),
      starts_at: starts.toISOString(),
      ends_at: new Date(starts.getTime() + duration * 60000).toISOString(),
      created_by: profile.id,
    }).select().single();
    if (error) { setBusy(false); return toast(error.message, 'error'); }
    if (attendees.size) {
      const { error: e2 } = await supabase.from('meeting_attendees')
        .insert([...attendees].map((uid) => ({ meeting_id: data.id, user_id: uid })));
      if (e2) toast('Meeting saved, but attendees failed: ' + e2.message, 'error');
    }
    setBusy(false);
    onDone();
  }

  return (
    <Modal title="Schedule a meeting" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Title</label>
          <input className="input" autoFocus required value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Weekly launch sync" maxLength={120} />
        </div>
        <div className="flex g12 wrap">
          <div className="field grow">
            <label>Date &amp; time</label>
            <input className="input" type="datetime-local" required value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="field" style={{ width: 130 }}>
            <label>Duration</label>
            <select className="select" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              <option value={15}>15 min</option><option value={30}>30 min</option>
              <option value={45}>45 min</option><option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Location / call link</label>
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="https://meet.google.com/… or ‘Office’" />
        </div>
        <div className="field">
          <label>Agenda</label>
          <textarea className="textarea" value={agenda} onChange={(e) => setAgenda(e.target.value)}
            placeholder="1. Launch checklist&#10;2. Blockers&#10;3. Metrics review" />
        </div>
        <div className="field">
          <label>Attendees ({attendees.size})</label>
          <div className="flex g8 wrap">
            {team.map((p) => (
              <button type="button" key={p.id}
                className={`folder-chip ${attendees.has(p.id) ? 'active' : ''}`}
                style={{ padding: '5px 12px' }}
                onClick={() => toggle(p.id)}>
                <Avatar profile={p} size="sm" /> {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Scheduling…' : 'Schedule'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ================= POLLS ================= */

function PollsTab() {
  const { profile, teamById } = useAuth();
  const toast = useToast();
  const [polls, setPolls] = useState(null);   // [{...poll, poll_options: [...]}]
  const [votes, setVotes] = useState(null);   // all poll_votes
  const [showNew, setShowNew] = useState(false);

  async function load() {
    const [p, v] = await Promise.all([
      supabase.from('polls').select('*, poll_options(*)').order('created_at', { ascending: false }),
      supabase.from('poll_votes').select('*'),
    ]);
    setPolls(p.data || []);
    setVotes(v.data || []);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  useEffect(() => {
    const ch = supabase.channel('polls-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'poll_votes' }, (p) => {
        setVotes((l) => (l && !l.some((x) => x.id === p.new.id)) ? [...l, p.new] : l);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'poll_votes' }, (p) => {
        setVotes((l) => l?.filter((x) => x.id !== p.old.id) || l);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function vote(poll, option) {
    const myVotes = votes.filter((v) => v.poll_id === poll.id && v.voter_id === profile.id);
    const existing = myVotes.find((v) => v.option_id === option.id);
    if (existing) {
      setVotes((l) => l.filter((v) => v.id !== existing.id));
      const { error } = await supabase.from('poll_votes').delete().eq('id', existing.id);
      if (error) { toast(error.message, 'error'); load(); }
      return;
    }
    if (!poll.multi && myVotes.length) {
      // change vote: remove previous first
      setVotes((l) => l.filter((v) => !myVotes.some((m) => m.id === v.id)));
      await supabase.from('poll_votes').delete().in('id', myVotes.map((m) => m.id));
    }
    const { data, error } = await supabase.from('poll_votes').insert({
      poll_id: poll.id, option_id: option.id, voter_id: profile.id,
    }).select().single();
    if (error) { toast(error.message, 'error'); load(); return; }
    setVotes((l) => l.some((x) => x.id === data.id) ? l : [...l, data]);
  }

  async function removePoll(poll) {
    if (!window.confirm(`Delete poll “${poll.question}”?`)) return;
    const { error } = await supabase.from('polls').delete().eq('id', poll.id);
    if (error) return toast(error.message, 'error');
    setPolls((l) => l.filter((x) => x.id !== poll.id));
  }

  if (!polls || !votes) return <Spinner fill />;

  return (
    <div>
      <div className="flex jcb aic mb-16">
        <div className="card-title" style={{ margin: 0 }}>Team polls · live results</div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}><IcPlus /></span> New poll
        </button>
      </div>

      {polls.length === 0 && (
        <div className="card"><EmptyState title="No polls yet"
          sub="Put a decision to the team — votes update live for everyone." /></div>
      )}

      {polls.map((poll) => {
        const pollVotes = votes.filter((v) => v.poll_id === poll.id);
        const total = pollVotes.length;
        const voterIds = [...new Set(pollVotes.map((v) => v.voter_id))];
        const closed = poll.closes_at && new Date(poll.closes_at) < new Date();
        const mine = poll.created_by === profile.id || profile.role === 'admin';
        return (
          <div key={poll.id} className="card card-pad mb-16">
            <div className="flex aic jcb g12 wrap mb-8">
              <div className="grow">
                <h3 style={{ fontSize: 15.5 }}>{poll.question}</h3>
                <div className="text-3 small">
                  by {teamById[poll.created_by]?.name || '—'} · {timeAgo(poll.created_at)} ·
                  {poll.multi ? ' multiple choice' : ' single choice'}
                  {poll.closes_at && (closed ? ' · closed' : ` · closes ${fmtDateTime(poll.closes_at)}`)}
                </div>
              </div>
              {mine && <button className="btn btn-danger btn-sm" onClick={() => removePoll(poll)}>Delete</button>}
            </div>

            {(poll.poll_options || []).sort((a, b) => a.position - b.position).map((opt) => {
              const optVotes = pollVotes.filter((v) => v.option_id === opt.id);
              const pct = total ? Math.round((optVotes.length / total) * 100) : 0;
              const iVoted = optVotes.some((v) => v.voter_id === profile.id);
              return (
                <div key={opt.id} className={`poll-option ${iVoted ? 'voted' : ''}`}
                  onClick={() => !closed && vote(poll, opt)}
                  style={closed ? { cursor: 'default' } : {}}>
                  <div className="po-inner">
                    <div className="po-bar" style={{ width: `${pct}%` }} />
                    <div className="po-label">
                      <span>{opt.label}</span>
                      {iVoted && <span className="badge">Your vote</span>}
                      <span className="po-pct">{pct}% · {optVotes.length}</span>
                      <span className="poll-voters">
                        {optVotes.slice(0, 5).map((v) => (
                          <Avatar key={v.id} profile={teamById[v.voter_id]} size="sm" />
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="text-3 small mt-8">
              {total} vote{total === 1 ? '' : 's'} · {voterIds.length} of {Object.keys(teamById).length} people voted
              {voterIds.length > 0 && <> — {voterIds.map((id) => teamById[id]?.name?.split(' ')[0]).filter(Boolean).join(', ')}</>}
            </div>
          </div>
        );
      })}

      {showNew && <NewPoll onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); load(); }} />}
    </div>
  );
}

function NewPoll({ onClose, onDone }) {
  const { profile } = useAuth();
  const toast = useToast();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multi, setMulti] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const labels = options.map((o) => o.trim()).filter(Boolean);
    if (labels.length < 2) return toast('Add at least two options.', 'error');
    setBusy(true);
    const { data, error } = await supabase.from('polls').insert({
      question: question.trim(), multi, created_by: profile.id,
    }).select().single();
    if (error) { setBusy(false); return toast(error.message, 'error'); }
    const { error: e2 } = await supabase.from('poll_options')
      .insert(labels.map((label, i) => ({ poll_id: data.id, label, position: i })));
    setBusy(false);
    if (e2) return toast(e2.message, 'error');
    onDone();
  }

  return (
    <Modal title="New poll" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Question</label>
          <input className="input" autoFocus required value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder="Which launch date do we commit to?" maxLength={300} />
        </div>
        <div className="field">
          <label>Options</label>
          {options.map((o, i) => (
            <div key={i} className="flex g8 mb-8">
              <input className="input" value={o} placeholder={`Option ${i + 1}`}
                onChange={(e) => setOptions((l) => l.map((x, j) => (j === i ? e.target.value : x)))} />
              {options.length > 2 && (
                <button type="button" className="btn btn-ghost btn-sm"
                  onClick={() => setOptions((l) => l.filter((_, j) => j !== i))}>✕</button>
              )}
            </div>
          ))}
          {options.length < 8 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOptions((l) => [...l, ''])}>
              + Add option
            </button>
          )}
        </div>
        <label className="flex aic g8 clickable mb-16" style={{ fontSize: 13.5 }}>
          <input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
          Allow multiple selections
        </label>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create poll'}</button>
        </div>
      </form>
    </Modal>
  );
}

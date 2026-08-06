import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Avatar, EmptyState, Spinner } from '../components/ui';
import { timeAgo, fmtDateTime, fmtDate, dueState, ROLE_LABEL, fileKind,
  isAdminRole, isBirthdayToday, daysUntilBirthday, birthdayLabel } from '../lib/util';

function greetingWord() {
  const h = new Date().getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { profile, team, teamById } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [posted, setPosted] = useState({});

  const birthdaysToday = (team || []).filter((p) => isBirthdayToday(p.birthday));
  const upcomingBirthdays = (team || [])
    .filter((p) => p.birthday && !isBirthdayToday(p.birthday))
    .map((p) => ({ p, d: daysUntilBirthday(p.birthday) }))
    .filter((x) => x.d > 0 && x.d <= 30)
    .sort((a, b) => a.d - b.d);

  async function postBirthday(p) {
    const { error } = await supabase.from('announcements').insert({
      title: `🎂 Happy Birthday, ${p.name}!`,
      content: `It's ${p.name}'s birthday today! Drop by and wish them well 🎉`,
      author_id: profile.id,
    });
    if (error) return toast(error.message, 'error');
    setPosted((s) => ({ ...s, [p.id]: true }));
    toast('Birthday announcement posted 🎉');
  }

  useEffect(() => {
    let alive = true;
    async function load() {
      const nowIso = new Date().toISOString();
      const [anns, meetings, myAtt, polls, myVotes, docs, myTasks, dmUnread, activity] = await Promise.all([
        supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('meetings').select('*, meeting_attendees(user_id)').gte('starts_at', nowIso).order('starts_at').limit(5),
        supabase.from('meeting_attendees').select('meeting_id').eq('user_id', profile.id),
        supabase.from('polls').select('*, poll_options(id)').order('created_at', { ascending: false }).limit(10),
        supabase.from('poll_votes').select('poll_id').eq('voter_id', profile.id),
        supabase.from('documents').select('*').order('updated_at', { ascending: false }).limit(5),
        supabase.from('tasks').select('*').eq('assignee_id', profile.id).neq('status', 'done').order('due_date', { ascending: true, nullsFirst: false }).limit(8),
        supabase.from('direct_messages').select('*', { count: 'exact', head: true }).eq('recipient_id', profile.id).is('read_at', null),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(12),
      ]);
      if (!alive) return;
      const votedPolls = new Set((myVotes.data || []).map((v) => v.poll_id));
      const pendingPolls = (polls.data || []).filter(
        (p) => !votedPolls.has(p.id) && (!p.closes_at || new Date(p.closes_at) > new Date()),
      );
      const myMeetingIds = new Set((myAtt.data || []).map((a) => a.meeting_id));
      setData({
        anns: anns.data || [],
        meetings: meetings.data || [],
        myMeetingIds,
        pendingPolls,
        docs: docs.data || [],
        myTasks: myTasks.data || [],
        dmUnread: dmUnread.count || 0,
        activity: activity.data || [],
      });
    }
    load();
    return () => { alive = false; };
  }, [profile.id]);

  if (!data) return <Spinner fill />;

  const firstName = profile.name.split(' ')[0];
  const myMeetings = data.meetings.filter((m) => data.myMeetingIds.has(m.id) || m.created_by === profile.id);
  const shownMeetings = myMeetings.length ? myMeetings : data.meetings;

  const stats = [
    { n: data.myTasks.length, l: 'Open tasks assigned to you', to: '/tasks', glow: data.myTasks.some((t) => dueState(t.due_date, t.status) === 'overdue') },
    { n: data.dmUnread, l: 'Unread direct messages', to: '/messages', glow: data.dmUnread > 0 },
    { n: myMeetings.length, l: 'Your upcoming meetings', to: '/meetings' },
    { n: data.pendingPolls.length, l: 'Polls awaiting your vote', to: '/meetings?tab=polls', glow: data.pendingPolls.length > 0 },
  ];

  return (
    <div>
      <div className="greeting">
        <h1>{greetingWord()}, <span className="grad">{firstName}</span></h1>
        <p>{ROLE_LABEL[profile.role]} · {profile.department} — here’s what needs your attention.</p>
      </div>

      <div className="stat-row">
        {stats.map((s, i) => (
          <div key={i} className="card stat-tile" onClick={() => nav(s.to)}>
            <span className={`num ${s.glow ? 'glow' : ''}`}>{s.n}</span>
            <span className="lbl">{s.l}</span>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="col-8">
          <div className="card card-glow card-pad mb-16">
            <div className="card-title">Latest announcements <Link to="/announcements">View all</Link></div>
            {data.anns.length === 0 && <EmptyState title="No announcements yet" sub="Company-wide updates from the founders will appear here." />}
            <div className="mini-list">
              {data.anns.map((a) => (
                <div key={a.id} className="mini-item" onClick={() => nav('/announcements')}>
                  <Avatar profile={teamById[a.author_id]} size="md" />
                  <div className="mi-main">
                    <div className="mi-title">{a.title}</div>
                    <div className="mi-sub">{teamById[a.author_id]?.name || 'Admin'} · {timeAgo(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad mb-16">
            <div className="card-title">Your tasks <Link to="/tasks">Open board</Link></div>
            {data.myTasks.length === 0 && <EmptyState title="Nothing assigned to you" sub="When a teammate assigns you a task, it shows up here." />}
            <div className="mini-list">
              {data.myTasks.map((t) => {
                const ds = dueState(t.due_date, t.status);
                return (
                  <div key={t.id} className="mini-item" onClick={() => nav(`/tasks?task=${t.id}`)}>
                    <span className={`dot-${t.status === 'in_progress' ? 'progress' : 'todo'}`}
                      style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, display: 'inline-block', background: t.status === 'in_progress' ? 'var(--warning)' : 'var(--text-3)' }} />
                    <div className="mi-main">
                      <div className="mi-title">{t.title}</div>
                      <div className="mi-sub">{t.status === 'in_progress' ? 'In progress' : 'To do'}</div>
                    </div>
                    {t.due_date && <span className={`due-pill ${ds || ''}`}>{ds === 'overdue' ? 'Overdue · ' : 'Due '}{fmtDate(t.due_date)}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card card-pad">
            <div className="card-title">Recent documents <Link to="/documents">Document hub</Link></div>
            {data.docs.length === 0 && <EmptyState title="No documents yet" sub="Files your team uploads will appear here." />}
            <div className="mini-list">
              {data.docs.map((d) => (
                <div key={d.id} className="mini-item" onClick={() => nav('/documents')}>
                  <span className="doc-ico">{fileKind(d.name)}</span>
                  <div className="mi-main">
                    <div className="mi-title">{d.name}</div>
                    <div className="mi-sub">{d.folder} · v{d.version} · {teamById[d.uploaded_by]?.name || '—'}</div>
                  </div>
                  <span className="mi-right">{timeAgo(d.updated_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-4">
          {(birthdaysToday.length > 0 || upcomingBirthdays.length > 0) && (
            <div className={`card card-pad mb-16 ${birthdaysToday.length ? 'card-glow' : ''}`}>
              <div className="card-title">🎂 Birthdays</div>
              {birthdaysToday.map((p) => (
                <div key={p.id} className="mini-item" style={{ cursor: 'default', background: 'var(--accent-soft)', borderRadius: 8 }}>
                  <Avatar profile={p} size="md" />
                  <div className="mi-main">
                    <div className="mi-title">{p.name}</div>
                    <div className="mi-sub" style={{ color: 'var(--accent-hi)' }}>Today! Wish them a happy birthday 🎉</div>
                  </div>
                  {isAdminRole(profile.role) && p.id !== profile.id && (
                    posted[p.id]
                      ? <span className="badge">Posted ✓</span>
                      : <button className="btn btn-primary btn-sm" onClick={() => postBirthday(p)}>Post wish</button>
                  )}
                </div>
              ))}
              {upcomingBirthdays.length > 0 && (
                <>
                  {birthdaysToday.length > 0 && <div className="text-3 small mt-8 mb-8">Coming up</div>}
                  <div className="mini-list">
                    {upcomingBirthdays.slice(0, 5).map(({ p, d }) => (
                      <div key={p.id} className="mini-item" onClick={() => nav(`/team/${p.id}`)}>
                        <Avatar profile={p} size="sm" />
                        <div className="mi-main">
                          <div className="mi-title">{p.name}</div>
                          <div className="mi-sub">{birthdayLabel(p.birthday)}</div>
                        </div>
                        <span className="mi-right">{d === 1 ? 'tomorrow' : `in ${d}d`}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="card card-pad mb-16">
            <div className="card-title">Upcoming meetings <Link to="/meetings">All</Link></div>
            {shownMeetings.length === 0 && <EmptyState title="No meetings scheduled" sub="Schedule one from Meetings & Polls." />}
            <div className="mini-list">
              {shownMeetings.slice(0, 4).map((m) => (
                <div key={m.id} className="mini-item" onClick={() => nav('/meetings')}>
                  <div className="mi-main">
                    <div className="mi-title">{m.title}{data.myMeetingIds.has(m.id) && <span className="badge" style={{ marginLeft: 7 }}>You’re in</span>}</div>
                    <div className="mi-sub">{fmtDateTime(m.starts_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data.pendingPolls.length > 0 && (
            <div className="card card-glow card-pad mb-16">
              <div className="card-title">Polls awaiting you</div>
              <div className="mini-list">
                {data.pendingPolls.slice(0, 3).map((p) => (
                  <div key={p.id} className="mini-item" onClick={() => nav('/meetings?tab=polls')}>
                    <div className="mi-main">
                      <div className="mi-title">{p.question}</div>
                      <div className="mi-sub">{p.poll_options?.length || 0} options · by {teamById[p.created_by]?.name || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card card-pad">
            <div className="card-title">Team activity</div>
            {data.activity.length === 0 && <EmptyState title="Quiet for now" sub="Teammates’ actions appear here as they happen." />}
            {data.activity.map((a) => (
              <div key={a.id} className="feed-item clickable" onClick={() => nav(a.link || '/')}>
                <Avatar profile={teamById[a.actor_id]} size="sm" />
                <div>
                  <div className="fi-text"><b>{teamById[a.actor_id]?.name || 'Someone'}</b> {a.verb} <b>{a.entity_label}</b></div>
                  <div className="fi-time">{timeAgo(a.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

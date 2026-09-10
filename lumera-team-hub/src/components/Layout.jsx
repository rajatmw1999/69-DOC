import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { timeAgo, ROLE_LABEL } from '../lib/util';
import { Avatar, EmptyState } from './ui';
import {
  IcHome, IcChat, IcDoc, IcBoard, IcCal, IcMegaphone, IcTeam, IcShield,
  IcBell, IcSearch, IcMenu, IcLogout, IcUser, IcX,
} from './Icons';

const NAV = [
  { to: '/', label: 'Dashboard', ico: IcHome, end: true },
  { to: '/messages', label: 'Messages', ico: IcChat },
  { to: '/documents', label: 'Documents', ico: IcDoc },
  { to: '/tasks', label: 'Tasks', ico: IcBoard },
  { to: '/meetings', label: 'Meetings & Polls', ico: IcCal },
  { to: '/announcements', label: 'Announcements', ico: IcMegaphone },
  { to: '/team', label: 'Team', ico: IcTeam },
];

function useClickOutside(ref, onOut) {
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onOut(); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, onOut]);
}

export default function Layout({ children }) {
  const { profile, signOut, teamById } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const flush = loc.pathname.startsWith('/messages');

  const [sideOpen, setSideOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dmUnread, setDmUnread] = useState(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);

  const notifRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(menuRef, () => setMenuOpen(false));
  useClickOutside(searchRef, () => setResults(null));

  const loadNotifs = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    setNotifs(data || []);
  }, []);

  const loadDmUnread = useCallback(async () => {
    const { count } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', profile.id)
      .is('read_at', null);
    setDmUnread(count || 0);
  }, [profile.id]);

  useEffect(() => {
    loadNotifs();
    loadDmUnread();

    const ch = supabase
      .channel('layout-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          setNotifs((n) => [payload.new, ...n].slice(0, 30));
          const actor = teamById[payload.new.actor_id];
          toast(`${actor?.name || 'Someone'} ${payload.new.body}`);
        })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'direct_messages' },
        () => loadDmUnread())
      .subscribe();

    return () => { supabase.removeChannel(ch); };
    // teamById is rebuilt each render; profile.id is the real dependency.
  }, [profile.id]); // eslint-disable-line

  const unreadCount = notifs.filter((n) => !n.read).length;

  async function openNotif(n) {
    setNotifOpen(false);
    if (!n.read) {
      setNotifs((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      await supabase.from('notifications').update({ read: true }).eq('id', n.id);
    }
    nav(n.link || '/');
  }

  async function markAllRead() {
    setNotifs((list) => list.map((x) => ({ ...x, read: true })));
    await supabase.from('notifications').update({ read: true })
      .eq('user_id', profile.id).eq('read', false);
  }

  async function runSearch(q) {
    setQuery(q);
    if (q.trim().length < 2) { setResults(null); return; }
    const term = `%${q.trim()}%`;
    const [docs, tasks, meetings, anns] = await Promise.all([
      supabase.from('documents').select('id,name,folder').ilike('name', term).limit(5),
      supabase.from('tasks').select('id,title').ilike('title', term).limit(5),
      supabase.from('meetings').select('id,title').ilike('title', term).limit(4),
      supabase.from('announcements').select('id,title').ilike('title', term).limit(4),
    ]);
    const ppl = Object.values(teamById)
      .filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 5);
    const out = [
      ...ppl.map((p) => ({ kind: 'Person', label: p.name, sub: p.department, to: `/team/${p.id}` })),
      ...(docs.data || []).map((d) => ({ kind: 'Doc', label: d.name, sub: d.folder, to: '/documents' })),
      ...(tasks.data || []).map((t) => ({ kind: 'Task', label: t.title, to: `/tasks?task=${t.id}` })),
      ...(meetings.data || []).map((m) => ({ kind: 'Meeting', label: m.title, to: '/meetings' })),
      ...(anns.data || []).map((a) => ({ kind: 'News', label: a.title, to: '/announcements' })),
    ];
    setResults(out);
  }

  return (
    <div className="app-shell">
      {sideOpen && <div className="sidebar-backdrop" onClick={() => setSideOpen(false)} />}

      <aside className={`sidebar ${sideOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-orb" />
          <div>Lumera<small>Team Hub</small></div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, label, ico: Ico, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSideOpen(false)}>
              <span className="nav-ico"><Ico /></span>
              {label}
              <span className="spacer" />
              {to === '/messages' && dmUnread > 0 && <span className="count-badge">{dmUnread}</span>}
            </NavLink>
          ))}
          {profile.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSideOpen(false)}>
              <span className="nav-ico"><IcShield /></span>
              Admin
            </NavLink>
          )}
        </nav>
        <div className="sidebar-user clickable" onClick={() => { nav(`/team/${profile.id}`); setSideOpen(false); }}>
          <Avatar profile={profile} size="md" />
          <div className="who">
            <div className="nm">{profile.name}</div>
            <div className="rl">{ROLE_LABEL[profile.role]}</div>
          </div>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <button className="btn btn-ghost btn-icon hamburger" onClick={() => setSideOpen(true)} aria-label="Menu">
            <span style={{ width: 18, height: 18, display: 'inline-flex' }}><IcMenu /></span>
          </button>

          <div className="topbar-search" ref={searchRef}>
            <span className="search-ico" style={{ width: 15, height: 15 }}><IcSearch /></span>
            <input className="input" placeholder="Search docs, tasks, people…" value={query}
              onChange={(e) => runSearch(e.target.value)}
              onFocus={() => query.trim().length >= 2 && runSearch(query)} />
            {results && (
              <div className="search-results">
                {results.length === 0 && <div className="search-result text-3">No matches for “{query}”</div>}
                {results.map((r, i) => (
                  <div key={i} className="search-result"
                    onClick={() => { nav(r.to); setResults(null); setQuery(''); }}>
                    <span className="sr-kind">{r.kind}</span>
                    <span className="sr-label">{r.label}</span>
                    {r.sub && <span className="sr-sub">{r.sub}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          <div className="dropdown-anchor" ref={notifRef}>
            <button className="btn btn-ghost btn-icon bell-wrap" aria-label="Notifications"
              onClick={() => setNotifOpen((v) => !v)}>
              <span style={{ width: 19, height: 19, display: 'inline-flex' }}><IcBell /></span>
              {unreadCount > 0 && <span className="count-badge bell-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {notifOpen && (
              <div className="dropdown notif-dropdown">
                <div className="flex aic jcb" style={{ padding: '12px 14px 8px' }}>
                  <span className="dropdown-header" style={{ padding: 0 }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>
                  )}
                </div>
                <div className="notif-list">
                  {notifs.length === 0 && (
                    <EmptyState title="All clear" sub="Mentions, task assignments and announcements land here." />
                  )}
                  {notifs.map((n) => {
                    const actor = teamById[n.actor_id];
                    return (
                      <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => openNotif(n)}>
                        <Avatar profile={actor} size="sm" />
                        <div className="nt-body">
                          <div><b>{actor?.name || 'System'}</b> {n.body}</div>
                          <div className="nt-time">{timeAgo(n.created_at)}</div>
                        </div>
                        {!n.read && <span className="notif-dot" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="dropdown-anchor" ref={menuRef}>
            <button className="btn btn-ghost btn-icon" style={{ padding: 3, borderRadius: '50%' }}
              onClick={() => setMenuOpen((v) => !v)} aria-label="Profile menu">
              <Avatar profile={profile} size="md" />
            </button>
            {menuOpen && (
              <div className="dropdown">
                <div className="dropdown-header">{profile.name}<br />
                  <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>{profile.email}</span>
                </div>
                <div className="dropdown-sep" />
                <div className="dropdown-item" onClick={() => { nav(`/team/${profile.id}`); setMenuOpen(false); }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}><IcUser /></span> My profile
                </div>
                <div className="dropdown-sep" />
                <div className="dropdown-item" onClick={signOut}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}><IcLogout /></span> Log out
                </div>
              </div>
            )}
          </div>
        </header>

        <main className={`page ${flush ? 'page-flush' : ''}`}>{children}</main>
      </div>
    </div>
  );
}

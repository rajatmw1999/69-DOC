import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Avatar, EmptyState, Modal, Spinner } from '../components/ui';
import { IcHash, IcMenu, IcSend } from '../components/Icons';
import { clockTime, dayLabel, findMentions, mentionSegments } from '../lib/util';

const readKey = (uid) => `lumera_chan_read_${uid}`;
function getChanReads(uid) {
  try { return JSON.parse(localStorage.getItem(readKey(uid)) || '{}'); } catch { return {}; }
}
function setChanRead(uid, chanId) {
  const m = getChanReads(uid);
  m[chanId] = new Date().toISOString();
  localStorage.setItem(readKey(uid), JSON.stringify(m));
}

export default function Messages() {
  const { profile, team, teamById } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [channels, setChannels] = useState(null);
  const [messages, setMessages] = useState(null);      // messages for active conversation
  const [chanUnread, setChanUnread] = useState({});    // channelId -> count
  const [dmUnread, setDmUnread] = useState({});        // senderId -> count
  const [showCreate, setShowCreate] = useState(false);
  const [listOpen, setListOpen] = useState(false);      // mobile conversation list

  const active = useMemo(() => {
    const dm = params.get('dm');
    const chan = params.get('channel');
    if (dm) return { type: 'dm', id: dm };
    if (chan) return { type: 'channel', id: chan };
    return null;
  }, [params]);
  const activeRef = useRef(active);
  activeRef.current = active;

  const scrollRef = useRef(null);
  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  // ---- initial load: channels + unread counts ----
  useEffect(() => {
    let alive = true;
    async function load() {
      const [{ data: chans }, { data: recent }, { data: dms }] = await Promise.all([
        supabase.from('channels').select('*').order('name'),
        supabase.from('channel_messages').select('id,channel_id,created_at,sender_id')
          .order('created_at', { ascending: false }).limit(400),
        supabase.from('direct_messages').select('id,sender_id')
          .eq('recipient_id', profile.id).is('read_at', null),
      ]);
      if (!alive) return;
      setChannels(chans || []);
      const reads = getChanReads(profile.id);
      const cu = {};
      for (const m of recent || []) {
        if (m.sender_id === profile.id) continue;
        const last = reads[m.channel_id];
        if (!last || m.created_at > last) cu[m.channel_id] = (cu[m.channel_id] || 0) + 1;
      }
      setChanUnread(cu);
      const du = {};
      for (const m of dms || []) du[m.sender_id] = (du[m.sender_id] || 0) + 1;
      setDmUnread(du);
      // default to #general
      if (!activeRef.current && chans?.length) {
        const general = chans.find((c) => c.name === 'general') || chans[0];
        setParams({ channel: general.id }, { replace: true });
      }
    }
    load();
    return () => { alive = false; };
  }, [profile.id]); // eslint-disable-line

  // ---- load active conversation ----
  useEffect(() => {
    if (!active) return;
    let alive = true;
    setMessages(null);
    async function load() {
      if (active.type === 'channel') {
        const { data } = await supabase.from('channel_messages').select('*')
          .eq('channel_id', active.id).order('created_at').limit(200);
        if (!alive) return;
        setMessages(data || []);
        setChanRead(profile.id, active.id);
        setChanUnread((u) => ({ ...u, [active.id]: 0 }));
      } else {
        const { data } = await supabase.from('direct_messages').select('*')
          .or(`and(sender_id.eq.${profile.id},recipient_id.eq.${active.id}),and(sender_id.eq.${active.id},recipient_id.eq.${profile.id})`)
          .order('created_at').limit(200);
        if (!alive) return;
        setMessages(data || []);
        setDmUnread((u) => ({ ...u, [active.id]: 0 }));
        await supabase.from('direct_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('recipient_id', profile.id).eq('sender_id', active.id).is('read_at', null);
      }
      scrollToEnd();
    }
    load();
    return () => { alive = false; };
  }, [active?.type, active?.id, profile.id]); // eslint-disable-line

  // ---- realtime ----
  useEffect(() => {
    const ch = supabase
      .channel('messages-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'channel_messages' }, (p) => {
        const m = p.new;
        const a = activeRef.current;
        if (a?.type === 'channel' && a.id === m.channel_id) {
          setMessages((list) => (list && !list.some((x) => x.id === m.id)) ? [...list, m] : list);
          setChanRead(profile.id, m.channel_id);
          scrollToEnd();
        } else if (m.sender_id !== profile.id) {
          setChanUnread((u) => ({ ...u, [m.channel_id]: (u[m.channel_id] || 0) + 1 }));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (p) => {
        const m = p.new;
        const other = m.sender_id === profile.id ? m.recipient_id : m.sender_id;
        const a = activeRef.current;
        if (a?.type === 'dm' && a.id === other) {
          setMessages((list) => (list && !list.some((x) => x.id === m.id)) ? [...list, m] : list);
          scrollToEnd();
          if (m.recipient_id === profile.id) {
            supabase.from('direct_messages').update({ read_at: new Date().toISOString() }).eq('id', m.id).then(() => {});
          }
        } else if (m.recipient_id === profile.id) {
          setDmUnread((u) => ({ ...u, [m.sender_id]: (u[m.sender_id] || 0) + 1 }));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'channels' }, (p) => {
        setChannels((c) => (c && !c.some((x) => x.id === p.new.id)) ? [...c, p.new].sort((a, b) => a.name.localeCompare(b.name)) : c);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile.id, scrollToEnd]);

  async function send(text) {
    const content = text.trim();
    if (!content || !active) return;
    if (active.type === 'channel') {
      const { data, error } = await supabase.from('channel_messages')
        .insert({ channel_id: active.id, sender_id: profile.id, content })
        .select().single();
      if (error) return toast('Couldn’t send: ' + error.message, 'error');
      setMessages((l) => (l && !l.some((x) => x.id === data.id)) ? [...l, data] : l);
      setChanRead(profile.id, active.id);
      scrollToEnd();
      // @mention notifications
      const chanName = channels?.find((c) => c.id === active.id)?.name || '';
      const mentioned = findMentions(content, team).filter((p) => p.id !== profile.id);
      if (mentioned.length) {
        await supabase.from('notifications').insert(mentioned.map((p) => ({
          user_id: p.id, actor_id: profile.id, type: 'mention',
          body: `mentioned you in #${chanName}`, link: `/messages?channel=${active.id}`,
        })));
      }
    } else {
      const { data, error } = await supabase.from('direct_messages')
        .insert({ sender_id: profile.id, recipient_id: active.id, content })
        .select().single();
      if (error) return toast('Couldn’t send: ' + error.message, 'error');
      setMessages((l) => (l && !l.some((x) => x.id === data.id)) ? [...l, data] : l);
      scrollToEnd();
    }
  }

  const activeChannel = active?.type === 'channel' ? channels?.find((c) => c.id === active.id) : null;
  const activeUser = active?.type === 'dm' ? teamById[active.id] : null;
  const others = team.filter((p) => p.id !== profile.id);

  if (!channels) return <Spinner fill />;

  return (
    <div className="msg-layout grow">
      {listOpen && <div className="sidebar-backdrop" style={{ zIndex: 19 }} onClick={() => setListOpen(false)} />}
      <div className={`msg-sidebar ${listOpen ? 'open' : ''}`}>
        <div className="msg-section">
          <div className="msg-section-title">
            Channels
            <button title="New channel" onClick={() => setShowCreate(true)}>+</button>
          </div>
          {channels.map((c) => (
            <div key={c.id}
              className={`chan-item ${active?.type === 'channel' && active.id === c.id ? 'active' : ''}`}
              onClick={() => { setParams({ channel: c.id }); setListOpen(false); }}>
              <span className="hash">#</span>
              <span className="cn">{c.name}</span>
              {chanUnread[c.id] > 0 && <span className="count-badge">{chanUnread[c.id]}</span>}
            </div>
          ))}
        </div>
        <div className="msg-section">
          <div className="msg-section-title">Direct messages</div>
          {others.map((p) => (
            <div key={p.id}
              className={`chan-item ${active?.type === 'dm' && active.id === p.id ? 'active' : ''}`}
              onClick={() => { setParams({ dm: p.id }); setListOpen(false); }}>
              <Avatar profile={p} size="sm" />
              <span className="cn">{p.name}</span>
              {dmUnread[p.id] > 0 && <span className="count-badge">{dmUnread[p.id]}</span>}
            </div>
          ))}
          {others.length === 0 && <div className="text-3 small" style={{ padding: '0 9px' }}>Invite teammates to start DMs.</div>}
        </div>
      </div>

      <div className="msg-main">
        <div className="msg-header">
          <button className="btn btn-ghost btn-icon hamburger" onClick={() => setListOpen(true)} aria-label="Conversations">
            <span style={{ width: 17, height: 17, display: 'inline-flex' }}><IcMenu /></span>
          </button>
          {activeChannel && (
            <>
              <span style={{ width: 18, height: 18, display: 'inline-flex', color: 'var(--accent-hi)' }}><IcHash /></span>
              <span className="mh-name">{activeChannel.name}</span>
              <span className="mh-desc ellipsis">{activeChannel.description}</span>
            </>
          )}
          {activeUser && (
            <>
              <Avatar profile={activeUser} size="md" />
              <span className="mh-name">{activeUser.name}</span>
              <span className="mh-desc">{activeUser.department}</span>
            </>
          )}
        </div>

        <div className="msg-scroll" ref={scrollRef}>
          {messages === null && <Spinner fill />}
          {messages?.length === 0 && (
            <EmptyState
              title={activeChannel ? `Welcome to #${activeChannel.name}` : `This is the start of your conversation with ${activeUser?.name || 'them'}`}
              sub="Say hello — messages appear for everyone instantly." />
          )}
          {messages?.map((m, i) => {
            const prev = messages[i - 1];
            const sender = teamById[m.sender_id];
            const newDay = !prev || dayLabel(prev.created_at) !== dayLabel(m.created_at);
            const compact = !newDay && prev && prev.sender_id === m.sender_id &&
              new Date(m.created_at) - new Date(prev.created_at) < 5 * 60 * 1000;
            return (
              <div key={m.id}>
                {newDay && <div className="day-divider"><span>{dayLabel(m.created_at)}</span></div>}
                <div className={`msg-row ${compact ? 'compact' : ''}`}>
                  <Avatar profile={sender} size="md" />
                  <div className="mr-body">
                    {!compact && (
                      <div className="mr-head">
                        <span className="mr-name">{sender?.name || 'Unknown'}</span>
                        <span className="mr-time">{clockTime(m.created_at)}</span>
                      </div>
                    )}
                    <div className="mr-text">
                      {mentionSegments(m.content, team).map((seg, j) =>
                        seg.mention ? <span key={j} className="mention">{seg.t}</span> : <span key={j}>{seg.t}</span>,
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {active && <Composer key={active.type + active.id} onSend={send} team={others}
          placeholder={activeChannel ? `Message #${activeChannel.name}` : `Message ${activeUser?.name || ''}`} />}
      </div>

      {showCreate && <CreateChannel onClose={() => setShowCreate(false)}
        onCreated={(c) => { setShowCreate(false); setChannels((l) => l.some((x) => x.id === c.id) ? l : [...l, c].sort((a, b) => a.name.localeCompare(b.name))); setParams({ channel: c.id }); }} />}
    </div>
  );
}

function Composer({ onSend, placeholder, team }) {
  const [text, setText] = useState('');
  const [mention, setMention] = useState(null); // {query, index}
  const [sel, setSel] = useState(0);
  const taRef = useRef(null);

  const matches = mention
    ? team.filter((p) => p.name.toLowerCase().startsWith(mention.query.toLowerCase())).slice(0, 6)
    : [];

  function refreshMention(value, caret) {
    const before = value.slice(0, caret);
    const m = before.match(/@([\w ]{0,24})$/);
    if (m && !m[1].includes('  ')) {
      setMention({ query: m[1], index: before.length - m[0].length });
      setSel(0);
    } else setMention(null);
  }

  function pick(p) {
    const caret = taRef.current?.selectionStart ?? text.length;
    const next = text.slice(0, mention.index) + '@' + p.name + ' ' + text.slice(caret);
    setText(next);
    setMention(null);
    taRef.current?.focus();
  }

  function submit() {
    if (!text.trim()) return;
    onSend(text);
    setText('');
    setMention(null);
  }

  return (
    <div className="msg-compose">
      <div className="compose-box" style={{ position: 'relative' }}>
        {mention && matches.length > 0 && (
          <div className="mention-pop">
            {matches.map((p, i) => (
              <div key={p.id} className={`dropdown-item ${i === sel ? 'sel' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); pick(p); }}>
                <Avatar profile={p} size="sm" /> {p.name}
                <span className="text-3 small" style={{ marginLeft: 'auto' }}>{p.department}</span>
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value);
            refreshMention(e.target.value, e.target.selectionStart);
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px';
          }}
          onKeyDown={(e) => {
            if (mention && matches.length) {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => (s + 1) % matches.length); return; }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => (s - 1 + matches.length) % matches.length); return; }
              if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(matches[sel]); return; }
              if (e.key === 'Escape') { setMention(null); return; }
            }
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
        />
        <button className="btn btn-primary btn-icon" onClick={submit} disabled={!text.trim()} aria-label="Send">
          <span style={{ width: 17, height: 17, display: 'inline-flex' }}><IcSend /></span>
        </button>
      </div>
      <div className="text-3" style={{ fontSize: 11.5, marginTop: 5, paddingLeft: 4 }}>
        Enter to send · Shift+Enter for a new line · @ to mention
      </div>
    </div>
  );
}

function CreateChannel({ onClose, onCreated }) {
  const { profile } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
    if (!slug) return toast('Channel name must contain letters or numbers.', 'error');
    setBusy(true);
    const { data, error } = await supabase.from('channels')
      .insert({ name: slug, description: desc.trim(), created_by: profile.id })
      .select().single();
    setBusy(false);
    if (error) {
      toast(error.code === '23505' ? `#${slug} already exists.` : error.message, 'error');
      return;
    }
    onCreated(data);
  }

  return (
    <Modal title="Create a channel" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Name</label>
          <input className="input" autoFocus required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="launch-week" maxLength={40} />
        </div>
        <div className="field">
          <label>Description (optional)</label>
          <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="What is this channel about?" maxLength={140} />
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create channel'}</button>
        </div>
      </form>
    </Modal>
  );
}

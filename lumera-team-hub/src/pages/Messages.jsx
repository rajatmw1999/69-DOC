import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Avatar, EmptyState, Modal, Spinner } from '../components/ui';
import { IcHash, IcMenu, IcSend, IcUpload, IcX } from '../components/Icons';
import { clockTime, dayLabel, findMentions, fmtBytes, fileKind, mentionSegments, timeAgo, isAdminRole } from '../lib/util';

const IMG_EXT = /\.(png|jpe?g|gif|webp|svg)$/i;

export default function Messages() {
  const { profile, team, teamById } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [channels, setChannels] = useState(null);   // incl. channel_members(user_id)
  const [reads, setReads] = useState({});           // chanId -> {userId: last_read_at}
  const [messages, setMessages] = useState(null);
  const [chanUnread, setChanUnread] = useState({});
  const [dmUnread, setDmUnread] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [listOpen, setListOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [signed, setSigned] = useState({});         // storage path -> signed url

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

  const markRead = useCallback(async (chanId) => {
    const now = new Date().toISOString();
    setReads((r) => ({ ...r, [chanId]: { ...(r[chanId] || {}), [profile.id]: now } }));
    setChanUnread((u) => ({ ...u, [chanId]: 0 }));
    await supabase.from('channel_reads')
      .upsert({ channel_id: chanId, user_id: profile.id, last_read_at: now },
        { onConflict: 'channel_id,user_id' });
  }, [profile.id]);

  const loadChannels = useCallback(async () => {
    const [{ data: chans, error }, { data: readRows }, { data: recent }, { data: dms }] = await Promise.all([
      supabase.from('channels').select('*, channel_members(user_id)').order('created_at'),
      supabase.from('channel_reads').select('*'),
      supabase.from('channel_messages').select('id,channel_id,created_at,sender_id')
        .order('created_at', { ascending: false }).limit(400),
      supabase.from('direct_messages').select('id,sender_id')
        .eq('recipient_id', profile.id).is('read_at', null),
    ]);
    if (error) {
      toast('Couldn’t load channels — if you just upgraded, run migration 002 in the Supabase SQL editor.', 'error');
      setChannels([]);
      return;
    }
    const r = {};
    for (const row of readRows || []) {
      (r[row.channel_id] = r[row.channel_id] || {})[row.user_id] = row.last_read_at;
    }
    setReads(r);
    const cu = {};
    for (const m of recent || []) {
      if (m.sender_id === profile.id) continue;
      const last = r[m.channel_id]?.[profile.id];
      if (!last || m.created_at > last) cu[m.channel_id] = (cu[m.channel_id] || 0) + 1;
    }
    setChanUnread(cu);
    const du = {};
    for (const m of dms || []) du[m.sender_id] = (du[m.sender_id] || 0) + 1;
    setDmUnread(du);
    setChannels(chans || []);
    if (!activeRef.current && chans?.length) {
      const general = chans.find((c) => c.name === 'general') || chans[0];
      setParams({ channel: general.id }, { replace: true });
    }
  }, [profile.id]); // eslint-disable-line

  useEffect(() => { loadChannels(); }, [loadChannels]);

  // ---- load active conversation ----
  useEffect(() => {
    if (!active) return;
    let alive = true;
    setMessages(null);
    setReplyTo(null);
    async function load() {
      if (active.type === 'channel') {
        const { data } = await supabase.from('channel_messages').select('*')
          .eq('channel_id', active.id).order('created_at').limit(200);
        if (!alive) return;
        setMessages(data || []);
        markRead(active.id);
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
          markRead(m.channel_id);
          scrollToEnd();
        } else if (m.sender_id !== profile.id) {
          setChanUnread((u) => ({ ...u, [m.channel_id]: (u[m.channel_id] || 0) + 1 }));
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'channel_messages' }, (p) => {
        setMessages((list) => list?.filter((x) => x.id !== p.old.id) || list);
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages' }, (p) => {
        setMessages((list) => list?.map((x) => (x.id === p.new.id ? p.new : x)) || list);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'direct_messages' }, (p) => {
        setMessages((list) => list?.filter((x) => x.id !== p.old.id) || list);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'channels' }, () => loadChannels())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'channel_members' }, (p) => {
        if (p.new.user_id === profile.id) loadChannels();
        else setChannels((cs) => cs?.map((c) => c.id === p.new.channel_id
          ? { ...c, channel_members: [...(c.channel_members || []), { user_id: p.new.user_id }] } : c) || cs);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channel_reads' }, (p) => {
        const row = p.new;
        if (!row?.channel_id) return;
        setReads((r) => ({ ...r, [row.channel_id]: { ...(r[row.channel_id] || {}), [row.user_id]: row.last_read_at } }));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile.id, markRead, scrollToEnd, loadChannels]);

  // ---- helpers ----
  const activeChannel = active?.type === 'channel' ? channels?.find((c) => c.id === active.id) : null;
  const activeUser = active?.type === 'dm' ? teamById[active.id] : null;
  const others = team.filter((p) => p.id !== profile.id);
  const publicChans = (channels || []).filter((c) => !c.is_private);
  const groupChans = (channels || []).filter((c) => c.is_private);
  const chanLabel = (c) => (c.is_private ? (c.display_name || c.name) : c.name);

  const getSigned = useCallback(async (path) => {
    if (signed[path]) return signed[path];
    const { data } = await supabase.storage.from('chat-files').createSignedUrl(path, 3600);
    if (data?.signedUrl) setSigned((s) => ({ ...s, [path]: data.signedUrl }));
    return data?.signedUrl;
  }, [signed]);

  async function send({ text, file }) {
    const content = (text || '').trim();
    if (!content && !file) return;
    if (!active) return;

    let filePath = null;
    if (file) {
      if (file.size > 50 * 1024 * 1024) return toast('Max file size is 50 MB.', 'error');
      filePath = `${active.type}-${active.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('chat-files').upload(filePath, file);
      if (upErr) return toast('Upload failed: ' + upErr.message, 'error');
    }
    const fileFields = file
      ? { file_path: filePath, file_name: file.name, file_size: file.size }
      : {};
    const replyField = replyTo ? { reply_to: replyTo.id } : {};

    if (active.type === 'channel') {
      const { data, error } = await supabase.from('channel_messages')
        .insert({ channel_id: active.id, sender_id: profile.id, content, ...fileFields, ...replyField })
        .select().single();
      if (error) return toast('Couldn’t send: ' + error.message, 'error');
      setMessages((l) => (l && !l.some((x) => x.id === data.id)) ? [...l, data] : l);
      markRead(active.id);
      scrollToEnd();
      const mentioned = findMentions(content, team).filter((p) => p.id !== profile.id);
      if (mentioned.length) {
        await supabase.from('notifications').insert(mentioned.map((p) => ({
          user_id: p.id, actor_id: profile.id, type: 'mention',
          body: `mentioned you in ${activeChannel?.is_private ? chanLabel(activeChannel) : '#' + (activeChannel?.name || '')}`,
          link: `/messages?channel=${active.id}`,
        })));
      }
    } else {
      const { data, error } = await supabase.from('direct_messages')
        .insert({ sender_id: profile.id, recipient_id: active.id, content, ...fileFields, ...replyField })
        .select().single();
      if (error) return toast('Couldn’t send: ' + error.message, 'error');
      setMessages((l) => (l && !l.some((x) => x.id === data.id)) ? [...l, data] : l);
      scrollToEnd();
    }
    setReplyTo(null);
  }

  async function deleteMsg(m) {
    if (!window.confirm('Delete this message?')) return;
    const table = active.type === 'channel' ? 'channel_messages' : 'direct_messages';
    setMessages((l) => l.filter((x) => x.id !== m.id));
    const { error } = await supabase.from(table).delete().eq('id', m.id);
    if (error) { toast(error.message, 'error'); }
    if (m.file_path) await supabase.storage.from('chat-files').remove([m.file_path]);
  }

  async function forwardTo(target) {
    const m = forwardMsg;
    setForwardMsg(null);
    const origin = teamById[m.sender_id]?.name || 'Unknown';
    const fields = {
      content: m.content, forwarded_from: origin,
      file_path: m.file_path, file_name: m.file_name, file_size: m.file_size,
    };
    let error;
    if (target.type === 'channel') {
      ({ error } = await supabase.from('channel_messages')
        .insert({ channel_id: target.id, sender_id: profile.id, ...fields }));
    } else {
      ({ error } = await supabase.from('direct_messages')
        .insert({ sender_id: profile.id, recipient_id: target.id, ...fields }));
    }
    if (error) return toast('Forward failed: ' + error.message, 'error');
    toast(`Forwarded to ${target.label}`);
    if ((target.type === 'channel' && active?.id !== target.id) || (target.type === 'dm' && active?.id !== target.id)) {
      setParams(target.type === 'channel' ? { channel: target.id } : { dm: target.id });
    }
  }

  // seen-by for my last own channel message
  const lastOwnId = useMemo(() => {
    if (active?.type !== 'channel' || !messages) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_id === profile.id) return messages[i].id;
    }
    return null;
  }, [messages, active, profile.id]);

  function seenByNames(m) {
    const chanReads = reads[active.id] || {};
    return Object.entries(chanReads)
      .filter(([uid, t]) => uid !== profile.id && t >= m.created_at)
      .map(([uid]) => teamById[uid]?.name?.split(' ')[0])
      .filter(Boolean);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) send({ text: '', file });
  }

  if (!channels) return <Spinner fill />;

  const amGroupMember = activeChannel?.is_private &&
    (activeChannel.channel_members || []).some((m) => m.user_id === profile.id);

  return (
    <div className="msg-layout grow">
      {listOpen && <div className="sidebar-backdrop" style={{ zIndex: 19 }} onClick={() => setListOpen(false)} />}
      <div className={`msg-sidebar ${listOpen ? 'open' : ''}`}>
        <div className="msg-section">
          <div className="msg-section-title">
            Channels
            <button title="New channel or group" onClick={() => setShowCreate(true)}>+</button>
          </div>
          {publicChans.map((c) => (
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
          <div className="msg-section-title">
            Group chats
            <button title="New group chat" onClick={() => setShowCreate(true)}>+</button>
          </div>
          {groupChans.length === 0 && <div className="text-3 small" style={{ padding: '0 9px' }}>Create a private group with + above.</div>}
          {groupChans.map((c) => (
            <div key={c.id}
              className={`chan-item ${active?.type === 'channel' && active.id === c.id ? 'active' : ''}`}
              onClick={() => { setParams({ channel: c.id }); setListOpen(false); }}>
              <span className="hash">⛒</span>
              <span className="cn">{chanLabel(c)}</span>
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
        </div>
      </div>

      <div className="msg-main"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
        onDrop={onDrop}>
        {dragOver && (
          <div className="drag-overlay" onDragLeave={() => setDragOver(false)}>
            <div className="drag-inner">Drop to share the file here</div>
          </div>
        )}
        <div className="msg-header">
          <button className="btn btn-ghost btn-icon hamburger" onClick={() => setListOpen(true)} aria-label="Conversations">
            <span style={{ width: 17, height: 17, display: 'inline-flex' }}><IcMenu /></span>
          </button>
          {activeChannel && !activeChannel.is_private && (
            <>
              <span style={{ width: 18, height: 18, display: 'inline-flex', color: 'var(--accent-hi)' }}><IcHash /></span>
              <span className="mh-name">{activeChannel.name}</span>
              <span className="mh-desc ellipsis">{activeChannel.description}</span>
            </>
          )}
          {activeChannel?.is_private && (
            <>
              <span className="mh-name">{chanLabel(activeChannel)}</span>
              <div className="poll-voters clickable" onClick={() => setShowMembers(true)} title="Members">
                {(activeChannel.channel_members || []).slice(0, 5).map((m) => (
                  <Avatar key={m.user_id} profile={teamById[m.user_id]} size="sm" />
                ))}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMembers(true)}>
                {(activeChannel.channel_members || []).length} members
              </button>
            </>
          )}
          {activeUser && (
            <>
              <Avatar profile={activeUser} size="md" />
              <span className="mh-name">{activeUser.name}</span>
              <span className="mh-desc">{activeUser.title || activeUser.department}</span>
            </>
          )}
        </div>

        <div className="msg-scroll" ref={scrollRef}>
          {messages === null && <Spinner fill />}
          {messages?.length === 0 && (
            <EmptyState
              title={activeChannel ? `Welcome to ${activeChannel.is_private ? chanLabel(activeChannel) : '#' + activeChannel.name}` : `This is the start of your conversation with ${activeUser?.name || 'them'}`}
              sub="Say hello — you can also drag & drop a file anywhere here." />
          )}
          {messages?.map((m, i) => {
            const prev = messages[i - 1];
            const sender = teamById[m.sender_id];
            const own = m.sender_id === profile.id;
            const newDay = !prev || dayLabel(prev.created_at) !== dayLabel(m.created_at);
            const compact = !newDay && prev && prev.sender_id === m.sender_id && !m.reply_to && !prev.reply_to &&
              new Date(m.created_at) - new Date(prev.created_at) < 5 * 60 * 1000;
            const quoted = m.reply_to ? messages.find((x) => x.id === m.reply_to) : null;
            const seen = own && active.type === 'channel' && m.id === lastOwnId ? seenByNames(m) : null;
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
                        {active.type === 'dm' && own && (
                          <span className={`ticks ${m.read_at ? 'seen' : ''}`}
                            title={m.read_at ? `Seen ${timeAgo(m.read_at)}` : 'Delivered'}>
                            {m.read_at ? '✓✓ Seen' : '✓ Delivered'}
                          </span>
                        )}
                      </div>
                    )}
                    {m.forwarded_from && (
                      <div className="fwd-tag">↪ Forwarded from {m.forwarded_from}</div>
                    )}
                    {quoted && (
                      <div className="msg-quote">
                        <b>{teamById[quoted.sender_id]?.name || 'Unknown'}:</b>{' '}
                        {quoted.content ? quoted.content.slice(0, 120) : `📎 ${quoted.file_name || 'file'}`}
                      </div>
                    )}
                    {m.reply_to && !quoted && <div className="msg-quote text-3">original message unavailable</div>}
                    {m.content && (
                      <div className="mr-text">
                        {mentionSegments(m.content, team).map((seg, j) =>
                          seg.mention ? <span key={j} className="mention">{seg.t}</span> : <span key={j}>{seg.t}</span>,
                        )}
                      </div>
                    )}
                    {m.file_path && <Attachment m={m} getSigned={getSigned} signed={signed} />}
                    {seen && seen.length > 0 && (
                      <div className="seen-by" title={seen.join(', ')}>✓✓ Seen by {seen.length <= 3 ? seen.join(', ') : `${seen.slice(0, 3).join(', ')} +${seen.length - 3}`}</div>
                    )}
                  </div>
                  <div className="msg-actions">
                    <button title="Reply" onClick={() => setReplyTo(m)}>↩</button>
                    <button title="Forward" onClick={() => setForwardMsg(m)}>↪</button>
                    {own && <button title="Delete" className="danger" onClick={() => deleteMsg(m)}>✕</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {active && (activeChannel?.is_private ? amGroupMember : true) && (
          <Composer key={active.type + active.id} onSend={send} team={others}
            replyTo={replyTo} onCancelReply={() => setReplyTo(null)} teamById={teamById}
            placeholder={activeChannel ? `Message ${activeChannel.is_private ? chanLabel(activeChannel) : '#' + activeChannel.name}` : `Message ${activeUser?.name || ''}`} />
        )}
      </div>

      {showCreate && <CreateChannel team={others} onClose={() => setShowCreate(false)}
        onCreated={(c) => { setShowCreate(false); loadChannels(); setParams({ channel: c.id }); }} />}
      {showMembers && activeChannel?.is_private && (
        <GroupMembers channel={activeChannel} onClose={() => setShowMembers(false)}
          onChanged={loadChannels}
          onLeft={() => { setShowMembers(false); setParams({}); loadChannels(); }} />
      )}
      {forwardMsg && (
        <ForwardModal channels={channels} team={others} chanLabel={chanLabel}
          onClose={() => setForwardMsg(null)} onPick={forwardTo} />
      )}
    </div>
  );
}

function Attachment({ m, getSigned, signed }) {
  const [url, setUrl] = useState(signed[m.file_path] || null);
  useEffect(() => {
    let alive = true;
    if (!url) getSigned(m.file_path).then((u) => alive && setUrl(u));
    return () => { alive = false; };
  }, [m.file_path]); // eslint-disable-line
  const isImg = IMG_EXT.test(m.file_name || '');
  if (isImg && url) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img className="chat-img" src={url} alt={m.file_name} />
      </a>
    );
  }
  return (
    <a className="file-chip" href={url || '#'} target="_blank" rel="noreferrer"
      onClick={(e) => { if (!url) e.preventDefault(); }}>
      <span className="doc-ico">{fileKind(m.file_name || '')}</span>
      <span className="grow ellipsis">{m.file_name}</span>
      <span className="text-3 small">{fmtBytes(m.file_size)}</span>
    </a>
  );
}

function Composer({ onSend, placeholder, team, replyTo, onCancelReply, teamById }) {
  const [text, setText] = useState('');
  const [mention, setMention] = useState(null);
  const [sel, setSel] = useState(0);
  const [busy, setBusy] = useState(false);
  const taRef = useRef(null);
  const fileRef = useRef(null);

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

  async function submit(file) {
    if (!text.trim() && !file) return;
    setBusy(true);
    await onSend({ text, file });
    setBusy(false);
    setText('');
    setMention(null);
    if (taRef.current) taRef.current.style.height = 'auto';
  }

  return (
    <div className="msg-compose">
      {replyTo && (
        <div className="reply-bar">
          <span className="grow ellipsis">
            Replying to <b>{teamById[replyTo.sender_id]?.name || 'Unknown'}</b>:{' '}
            {replyTo.content ? replyTo.content.slice(0, 80) : `📎 ${replyTo.file_name || 'file'}`}
          </span>
          <button className="modal-close" onClick={onCancelReply} aria-label="Cancel reply">
            <span style={{ width: 14, height: 14, display: 'inline-flex' }}><IcX /></span>
          </button>
        </div>
      )}
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
        <button className="btn btn-ghost btn-icon" title="Attach a file" disabled={busy}
          onClick={() => fileRef.current?.click()}>
          <span style={{ width: 16, height: 16, display: 'inline-flex' }}><IcUpload /></span>
        </button>
        <input type="file" hidden ref={fileRef}
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) submit(f); }} />
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          placeholder={placeholder}
          disabled={busy}
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
        <button className="btn btn-primary btn-icon" onClick={() => submit()} disabled={busy || !text.trim()} aria-label="Send">
          <span style={{ width: 17, height: 17, display: 'inline-flex' }}><IcSend /></span>
        </button>
      </div>
      <div className="text-3" style={{ fontSize: 11.5, marginTop: 5, paddingLeft: 4 }}>
        Enter to send · Shift+Enter new line · @ mention · 📎 or drag & drop to share files
      </div>
    </div>
  );
}

function CreateChannel({ team, onClose, onCreated }) {
  const { profile } = useAuth();
  const toast = useToast();
  const [isGroup, setIsGroup] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [members, setMembers] = useState(new Set());
  const [busy, setBusy] = useState(false);

  function toggle(id) {
    setMembers((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    if (isGroup) {
      const display = name.trim();
      if (!display) { setBusy(false); return toast('Give the group a name.', 'error'); }
      const { data, error } = await supabase.from('channels')
        .insert({
          name: 'grp-' + crypto.randomUUID().slice(0, 12),
          display_name: display, description: desc.trim(),
          is_private: true, created_by: profile.id,
        })
        .select().single();
      if (error) { setBusy(false); return toast(error.message, 'error'); }
      if (members.size) {
        const { error: e2 } = await supabase.from('channel_members')
          .insert([...members].map((uid) => ({ channel_id: data.id, user_id: uid, added_by: profile.id })));
        if (e2) toast('Group created, but adding members failed: ' + e2.message, 'error');
      }
      setBusy(false);
      onCreated(data);
    } else {
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
      if (!slug) { setBusy(false); return toast('Channel name must contain letters or numbers.', 'error'); }
      const { data, error } = await supabase.from('channels')
        .insert({ name: slug, description: desc.trim(), created_by: profile.id })
        .select().single();
      setBusy(false);
      if (error) return toast(error.code === '23505' ? `#${slug} already exists.` : error.message, 'error');
      onCreated(data);
    }
  }

  return (
    <Modal title={isGroup ? 'Create a group chat' : 'Create a channel'} onClose={onClose}>
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button type="button" className={`tab ${!isGroup ? 'active' : ''}`} onClick={() => setIsGroup(false)}>Public channel</button>
        <button type="button" className={`tab ${isGroup ? 'active' : ''}`} onClick={() => setIsGroup(true)}>Private group</button>
      </div>
      <form onSubmit={submit}>
        <div className="field">
          <label>{isGroup ? 'Group name' : 'Channel name'}</label>
          <input className="input" autoFocus required value={name} onChange={(e) => setName(e.target.value)}
            placeholder={isGroup ? 'Launch squad 🚀' : 'launch-week'} maxLength={60} />
        </div>
        <div className="field">
          <label>Description (optional)</label>
          <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="What is this for?" maxLength={140} />
        </div>
        {isGroup && (
          <div className="field">
            <label>Members ({members.size} + you)</label>
            <div className="flex g8 wrap">
              {team.map((p) => (
                <button type="button" key={p.id}
                  className={`folder-chip ${members.has(p.id) ? 'active' : ''}`}
                  style={{ padding: '5px 12px' }} onClick={() => toggle(p.id)}>
                  <Avatar profile={p} size="sm" /> {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
            <div className="text-3 small mt-8">Only members can see this group and its messages — enforced by database rules.</div>
          </div>
        )}
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : isGroup ? 'Create group' : 'Create channel'}</button>
        </div>
      </form>
    </Modal>
  );
}

function GroupMembers({ channel, onClose, onChanged, onLeft }) {
  const { profile, team, teamById } = useAuth();
  const toast = useToast();
  const memberIds = new Set((channel.channel_members || []).map((m) => m.user_id));
  const nonMembers = team.filter((p) => !memberIds.has(p.id));
  const isCreator = channel.created_by === profile.id;

  async function add(uid) {
    const { error } = await supabase.from('channel_members')
      .insert({ channel_id: channel.id, user_id: uid, added_by: profile.id });
    if (error) return toast(error.message, 'error');
    onChanged();
  }

  async function remove(uid) {
    const { error } = await supabase.from('channel_members')
      .delete().eq('channel_id', channel.id).eq('user_id', uid);
    if (error) return toast(error.message, 'error');
    if (uid === profile.id) onLeft();
    else onChanged();
  }

  return (
    <Modal title={`${channel.display_name || channel.name} — members`} onClose={onClose}>
      <div className="mini-list mb-16">
        {[...memberIds].map((uid) => (
          <div key={uid} className="mini-item" style={{ cursor: 'default' }}>
            <Avatar profile={teamById[uid]} size="md" />
            <div className="mi-main">
              <div className="mi-title">{teamById[uid]?.name || 'Unknown'}{uid === channel.created_by && ' · creator'}</div>
              <div className="mi-sub">{teamById[uid]?.title || teamById[uid]?.department}</div>
            </div>
            {(uid === profile.id || isCreator || isAdminRole(profile.role)) && (
              <button className="btn btn-danger btn-sm" onClick={() => remove(uid)}>
                {uid === profile.id ? 'Leave' : 'Remove'}
              </button>
            )}
          </div>
        ))}
      </div>
      {nonMembers.length > 0 && (
        <>
          <div className="card-title">Add people</div>
          <div className="flex g8 wrap">
            {nonMembers.map((p) => (
              <button key={p.id} className="folder-chip" style={{ padding: '5px 12px' }} onClick={() => add(p.id)}>
                <Avatar profile={p} size="sm" /> {p.name.split(' ')[0]} +
              </button>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

function ForwardModal({ channels, team, chanLabel, onClose, onPick }) {
  const [q, setQ] = useState('');
  const targets = [
    ...channels.map((c) => ({ type: 'channel', id: c.id, label: c.is_private ? chanLabel(c) : '#' + c.name })),
    ...team.map((p) => ({ type: 'dm', id: p.id, label: p.name, profile: p })),
  ].filter((t) => !q.trim() || t.label.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Modal title="Forward message to…" onClose={onClose}>
      <input className="input mb-16" autoFocus placeholder="Search channels and people…"
        value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mini-list" style={{ maxHeight: 320, overflowY: 'auto' }}>
        {targets.map((t) => (
          <div key={t.type + t.id} className="mini-item" onClick={() => onPick(t)}>
            {t.profile ? <Avatar profile={t.profile} size="sm" /> :
              <span className="hash" style={{ width: 20, textAlign: 'center', color: 'var(--accent-hi)', fontWeight: 700 }}>#</span>}
            <div className="mi-main"><div className="mi-title">{t.label}</div></div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

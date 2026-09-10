import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Avatar, EmptyState, Modal, RoleBadge, Spinner } from '../components/ui';
import { IcPlus } from '../components/Icons';
import { timeAgo } from '../lib/util';

const EMOJIS = ['👍', '❤️', '🎉', '🚀', '👀'];

export default function Announcements() {
  const { profile, teamById } = useAuth();
  const toast = useToast();
  const [anns, setAnns] = useState(null);
  const [reactions, setReactions] = useState(null);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    const [a, r] = await Promise.all([
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('announcement_reactions').select('*'),
    ]);
    setAnns(a.data || []);
    setReactions(r.data || []);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  useEffect(() => {
    const ch = supabase.channel('anns-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (p) => {
        setAnns((l) => (l && !l.some((x) => x.id === p.new.id)) ? [p.new, ...l] : l);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function toggleReaction(annId, emoji) {
    const mine = reactions.find((r) => r.announcement_id === annId && r.user_id === profile.id && r.emoji === emoji);
    if (mine) {
      setReactions((l) => l.filter((r) => r !== mine));
      const { error } = await supabase.from('announcement_reactions').delete()
        .eq('announcement_id', annId).eq('user_id', profile.id).eq('emoji', emoji);
      if (error) { toast(error.message, 'error'); load(); }
    } else {
      setReactions((l) => [...l, { announcement_id: annId, user_id: profile.id, emoji }]);
      const { error } = await supabase.from('announcement_reactions').insert({
        announcement_id: annId, user_id: profile.id, emoji,
      });
      if (error) { toast(error.message, 'error'); load(); }
    }
  }

  async function remove(a) {
    if (!window.confirm(`Delete “${a.title}”?`)) return;
    const { error } = await supabase.from('announcements').delete().eq('id', a.id);
    if (error) return toast(error.message, 'error');
    setAnns((l) => l.filter((x) => x.id !== a.id));
  }

  if (!anns || !reactions) return <Spinner fill />;

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="page-header">
        <div>
          <h1>Announcements</h1>
          <div className="sub">Company-wide updates — only founders/admins can post.</div>
        </div>
        {profile.role === 'admin' && (
          <div className="actions">
            <button className="btn btn-primary" onClick={() => setShowNew(true)}>
              <span style={{ width: 15, height: 15, display: 'inline-flex' }}><IcPlus /></span> Post announcement
            </button>
          </div>
        )}
      </div>

      {anns.length === 0 && (
        <div className="card"><EmptyState title="Nothing announced yet"
          sub={profile.role === 'admin' ? 'Share the first company update with the team.'
            : 'Founders’ updates will appear here — you’ll get notified.'} /></div>
      )}

      {anns.map((a) => {
        const author = teamById[a.author_id];
        const annReactions = reactions.filter((r) => r.announcement_id === a.id);
        return (
          <div key={a.id} className="card card-glow ann-card">
            <div className="ann-head">
              <Avatar profile={author} size="lg" />
              <div className="grow">
                <div className="ann-title">{a.title}</div>
                <div className="ann-meta">{author?.name || 'Admin'} · {timeAgo(a.created_at)}</div>
              </div>
              {author && <RoleBadge role={author.role} />}
              {profile.role === 'admin' && (
                <button className="btn btn-danger btn-sm" onClick={() => remove(a)}>Delete</button>
              )}
            </div>
            <div className="ann-body">{a.content}</div>
            <div className="react-row">
              {EMOJIS.map((e) => {
                const rs = annReactions.filter((r) => r.emoji === e);
                const mine = rs.some((r) => r.user_id === profile.id);
                return (
                  <button key={e} className={`react-chip ${mine ? 'mine' : ''}`}
                    title={rs.map((r) => teamById[r.user_id]?.name).filter(Boolean).join(', ')}
                    onClick={() => toggleReaction(a.id, e)}>
                    {e} {rs.length > 0 && <span className="rc-n">{rs.length}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {showNew && (
        <NewAnnouncement onClose={() => setShowNew(false)}
          onDone={(a) => { setShowNew(false); setAnns((l) => l.some((x) => x.id === a.id) ? l : [a, ...l]); }} />
      )}
    </div>
  );
}

function NewAnnouncement({ onClose, onDone }) {
  const { profile } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.from('announcements').insert({
      title: title.trim(), content: content.trim(), author_id: profile.id,
    }).select().single();
    setBusy(false);
    if (error) return toast(error.message, 'error');
    onDone(data);
  }

  return (
    <Modal title="Post an announcement" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Title</label>
          <input className="input" autoFocus required value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Launch date confirmed 🎉" maxLength={200} />
        </div>
        <div className="field">
          <label>Message</label>
          <textarea className="textarea" required rows={6} value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Everyone will see this and get a notification." />
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Posting…' : 'Post to everyone'}</button>
        </div>
      </form>
    </Modal>
  );
}

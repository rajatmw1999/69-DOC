import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Avatar, EmptyState, Modal, Spinner } from '../components/ui';
import { IcPlus } from '../components/Icons';
import { isAdminRole, isLeadOrAdmin, weekStartOf, weekRangeLabel, relativeWeekLabel } from '../lib/util';

const CATS = {
  Product:   '#a855f7',
  Design:    '#60a5fa',
  Marketing: '#f472b6',
  Finance:   '#34d399',
  Ops:       '#fbbf24',
  Fundraise: '#c084fc',
  Launch:    '#f87171',
  General:   '#7d739c',
};
const CAT_NAMES = Object.keys(CATS);
const catColor = (c) => CATS[c] || CATS.General;

const STATUS = {
  planned:     { label: 'Planned',     next: 'in_progress', cls: 'st-planned' },
  in_progress: { label: 'In progress', next: 'done',        cls: 'st-progress' },
  done:        { label: 'Done',        next: 'planned',     cls: 'st-done' },
};

export default function ActionPlan() {
  const { profile, teamById } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);   // item or {} for new
  const [catFilter, setCatFilter] = useState('all');
  const weekRefs = useRef({});

  const canManage = isLeadOrAdmin(profile.role);
  const thisWeek = weekStartOf();

  async function load() {
    const { data, error } = await supabase.from('plan_items').select('*')
      .order('week_start').order('position').order('created_at');
    if (error) toast('Couldn’t load — if you just upgraded, run migration 005 in Supabase.', 'error');
    setItems(data || []);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  useEffect(() => {
    const ch = supabase.channel('plan-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_items' }, (p) => {
        if (p.eventType === 'INSERT') setItems((l) => (l && !l.some((x) => x.id === p.new.id)) ? [...l, p.new] : l);
        else if (p.eventType === 'UPDATE') setItems((l) => l?.map((x) => (x.id === p.new.id ? p.new : x)) || l);
        else if (p.eventType === 'DELETE') setItems((l) => l?.filter((x) => x.id !== p.old.id) || l);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Build the ordered list of weeks: every week that has items, plus the
  // current week, filled in contiguously so the timeline has no gaps.
  const weeks = useMemo(() => {
    if (!items) return [];
    const set = new Set(items.map((i) => i.week_start));
    set.add(thisWeek);
    const sorted = [...set].sort();
    if (!sorted.length) return [thisWeek];
    const out = [];
    let cur = new Date(sorted[0] + 'T00:00:00');
    const last = new Date(sorted[sorted.length - 1] + 'T00:00:00');
    while (cur <= last) {
      out.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 7);
    }
    return out;
  }, [items, thisWeek]);

  const filtered = (list) => catFilter === 'all' ? list : list.filter((i) => i.category === catFilter);
  const itemsByWeek = (ws) => filtered((items || []).filter((i) => i.week_start === ws));

  async function cycleStatus(item) {
    const status = STATUS[item.status].next;
    setItems((l) => l.map((x) => (x.id === item.id ? { ...x, status } : x)));
    const { error } = await supabase.from('plan_items').update({ status }).eq('id', item.id);
    if (error) {
      setItems((l) => l.map((x) => (x.id === item.id ? { ...x, status: item.status } : x)));
      toast(/row-level security/i.test(error.message)
        ? 'Only a lead/admin or the assignee can update this item.' : error.message, 'error');
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    setItems((l) => l.filter((x) => x.id !== item.id));
    const { error } = await supabase.from('plan_items').delete().eq('id', item.id);
    if (error) { toast(error.message, 'error'); load(); }
  }

  const canEditItem = (i) => isLeadOrAdmin(profile.role) || i.created_by === profile.id || i.owner_id === profile.id;

  if (!items) return <Spinner fill />;

  const total = filtered(items).length;
  const doneCount = filtered(items).filter((i) => i.status === 'done').length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Action Plan</h1>
          <div className="sub">The week-by-week schedule to launch — what needs doing, when, and by whom.</div>
        </div>
        <div className="actions">
          {canManage && (
            <button className="btn btn-primary" onClick={() => setEditing({ week_start: thisWeek })}>
              <span style={{ width: 15, height: 15, display: 'inline-flex' }}><IcPlus /></span> Add to plan
            </button>
          )}
        </div>
      </div>

      {/* summary + progress */}
      <div className="card card-glow card-pad mb-16">
        <div className="flex aic jcb g12 wrap mb-8">
          <div className="flex aic g12 wrap">
            <div>
              <div className="text-3 small">Overall progress</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{pct}%<span className="text-3" style={{ fontSize: 13, fontWeight: 600 }}> · {doneCount}/{total} done</span></div>
            </div>
          </div>
          <div className="flex g8 wrap">
            <button className={`folder-chip ${catFilter === 'all' ? 'active' : ''}`} onClick={() => setCatFilter('all')}>All</button>
            {CAT_NAMES.filter((c) => items.some((i) => i.category === c)).map((c) => (
              <button key={c} className={`folder-chip ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: catColor(c), display: 'inline-block' }} /> {c}
              </button>
            ))}
          </div>
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        {/* jump chips */}
        <div className="week-strip mt-16">
          {weeks.map((ws) => {
            const wi = itemsByWeek(ws);
            const wd = wi.filter((i) => i.status === 'done').length;
            return (
              <button key={ws}
                className={`week-chip ${ws === thisWeek ? 'now' : ''}`}
                onClick={() => weekRefs.current[ws]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <span className="wc-rel">{relativeWeekLabel(ws)}</span>
                <span className="wc-range">{weekRangeLabel(ws)}</span>
                {wi.length > 0 && <span className="wc-count">{wd}/{wi.length}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* timeline */}
      <div className="timeline">
        {weeks.map((ws) => {
          const wItems = itemsByWeek(ws);
          const wd = wItems.filter((i) => i.status === 'done').length;
          const wpct = wItems.length ? Math.round((wd / wItems.length) * 100) : 0;
          const isNow = ws === thisWeek;
          return (
            <div key={ws} className="tl-week" ref={(el) => { weekRefs.current[ws] = el; }}>
              <span className={`tl-node ${isNow ? 'now' : ''} ${wItems.length && wd === wItems.length ? 'complete' : ''}`} />
              <div className={`tl-week-head ${isNow ? 'now' : ''}`}>
                <div className="flex aic g8 wrap">
                  <span className="tl-rel">{relativeWeekLabel(ws)}</span>
                  <span className="text-3">·</span>
                  <span className="text-2" style={{ fontWeight: 600 }}>{weekRangeLabel(ws)}</span>
                  {isNow && <span className="badge">Now</span>}
                </div>
                {wItems.length > 0 && (
                  <div className="flex aic g8">
                    <div className="progress-track" style={{ width: 90 }}><div className="progress-fill" style={{ width: `${wpct}%` }} /></div>
                    <span className="text-3 small">{wd}/{wItems.length}</span>
                  </div>
                )}
                {canManage && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ week_start: ws })}>+ Add</button>
                )}
              </div>

              {wItems.length === 0 ? (
                <div className="tl-empty">Nothing scheduled{catFilter !== 'all' ? ' in this category' : ''} this week.</div>
              ) : (
                <div className="tl-items">
                  {wItems.map((i) => (
                    <div key={i.id} className={`plan-card ${i.status === 'done' ? 'done' : ''}`}
                      style={{ '--cat': catColor(i.category) }}>
                      <div className="pc-stripe" />
                      <div className="grow" style={{ minWidth: 0 }}>
                        <div className="flex aic g8 wrap">
                          <span className="pc-cat" style={{ color: catColor(i.category) }}>{i.category}</span>
                          <button className={`status-pill ${STATUS[i.status].cls}`}
                            title={canEditItem(i) ? 'Click to change status' : ''}
                            onClick={() => canEditItem(i) && cycleStatus(i)}
                            disabled={!canEditItem(i)}>
                            {STATUS[i.status].label}
                          </button>
                        </div>
                        <div className="pc-title">{i.title}</div>
                        {i.description && <div className="pc-desc">{i.description}</div>}
                      </div>
                      <div className="pc-side">
                        {i.owner_id ? (
                          <div className="flex aic g8" title={teamById[i.owner_id]?.name}>
                            <Avatar profile={teamById[i.owner_id]} size="sm" />
                          </div>
                        ) : <span className="text-3 small">Unassigned</span>}
                        {canEditItem(i) && (
                          <div className="pc-actions">
                            <button title="Edit" onClick={() => setEditing(i)}>✎</button>
                            {(isAdminRole(profile.role) || i.created_by === profile.id) &&
                              <button title="Delete" className="danger" onClick={() => remove(i)}>✕</button>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="card mt-16"><EmptyState title="No plan yet"
          sub={canManage ? 'Add the first milestone to start building the week-by-week plan.'
            : 'Your team leads will lay out the action plan here.'} /></div>
      )}

      {editing && (
        <PlanItemModal item={editing} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function PlanItemModal({ item, onClose, onSaved }) {
  const { profile, team } = useAuth();
  const toast = useToast();
  const editingExisting = Boolean(item.id);
  const [title, setTitle] = useState(item.title || '');
  const [description, setDescription] = useState(item.description || '');
  const [category, setCategory] = useState(item.category || 'Product');
  const [owner, setOwner] = useState(item.owner_id || '');
  const [status, setStatus] = useState(item.status || 'planned');
  const [week, setWeek] = useState(item.week_start || weekStartOf());
  const [busy, setBusy] = useState(false);

  // Let them pick any date; snap to that date's Monday for the week bucket.
  function onWeekChange(v) { setWeek(v ? weekStartOf(new Date(v + 'T00:00:00')) : ''); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      week_start: week, title: title.trim(), description: description.trim(),
      category, owner_id: owner || null, status,
    };
    let error;
    if (editingExisting) {
      ({ error } = await supabase.from('plan_items').update(payload).eq('id', item.id));
    } else {
      ({ error } = await supabase.from('plan_items').insert({ ...payload, created_by: profile.id }));
    }
    setBusy(false);
    if (error) return toast(/row-level security/i.test(error.message)
      ? 'Only team leads, admins or the founder can add to the plan.' : error.message, 'error');
    onSaved();
  }

  return (
    <Modal title={editingExisting ? 'Edit plan item' : 'Add to the action plan'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>What needs to be done?</label>
          <input className="input" autoFocus required value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Finish investor deck v5" maxLength={300} />
        </div>
        <div className="field">
          <label>Details (optional)</label>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Scope, links, definition of done…" />
        </div>
        <div className="flex g12 wrap">
          <div className="field grow">
            <label>Week</label>
            <input className="input" type="date" value={week} onChange={(e) => onWeekChange(e.target.value)} required />
            <span className="text-3 small mt-8">{week && weekRangeLabel(week)}</span>
          </div>
          <div className="field grow">
            <label>Category</label>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CAT_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
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
            <label>Status</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="planned">Planned</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : editingExisting ? 'Save' : 'Add to plan'}</button>
        </div>
      </form>
    </Modal>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Avatar, EmptyState, Modal, Spinner } from '../components/ui';
import { IcPlus } from '../components/Icons';
import { dueState, fmtDate, timeAgo, isAdminRole } from '../lib/util';

const COLS = [
  { id: 'todo', label: 'To Do', dot: 'dot-todo' },
  { id: 'in_progress', label: 'In Progress', dot: 'dot-progress' },
  { id: 'done', label: 'Done', dot: 'dot-done' },
];

export default function Tasks() {
  const { profile, teamById } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [projects, setProjects] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [projFilter, setProjFilter] = useState('all');
  const [mineOnly, setMineOnly] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const dragTask = useRef(null);

  const openTaskId = params.get('task');
  const openTask = openTaskId && tasks ? tasks.find((t) => t.id === openTaskId) : null;

  async function load() {
    const [p, t] = await Promise.all([
      supabase.from('projects').select('*').order('created_at'),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    ]);
    setProjects(p.data || []);
    setTasks(t.data || []);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  useEffect(() => {
    const ch = supabase.channel('tasks-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (p) => {
        if (p.eventType === 'INSERT') {
          setTasks((l) => (l && !l.some((x) => x.id === p.new.id)) ? [p.new, ...l] : l);
        } else if (p.eventType === 'UPDATE') {
          setTasks((l) => l?.map((x) => (x.id === p.new.id ? p.new : x)) || l);
        } else if (p.eventType === 'DELETE') {
          setTasks((l) => l?.filter((x) => x.id !== p.old.id) || l);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const visible = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) =>
      (projFilter === 'all' || t.project_id === projFilter) &&
      (!mineOnly || t.assignee_id === profile.id),
    );
  }, [tasks, projFilter, mineOnly, profile.id]);

  async function moveTask(task, status) {
    if (task.status === status) return;
    setTasks((l) => l.map((t) => (t.id === task.id ? { ...t, status } : t)));
    const { error } = await supabase.from('tasks').update({ status }).eq('id', task.id);
    if (error) {
      setTasks((l) => l.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
      toast(/row-level security/i.test(error.message)
        ? 'Only the assignee, creator, project lead or an admin can move this task.'
        : error.message, 'error');
    }
  }

  const canManageProjects = isAdminRole(profile.role) || profile.role === 'lead';

  if (!projects || !tasks) return <Spinner fill />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <div className="sub">Kanban boards per project — drag cards between columns.</div>
        </div>
        <div className="actions">
          {canManageProjects && (
            <button className="btn btn-ghost" onClick={() => setShowNewProject(true)}>
              <span style={{ width: 15, height: 15, display: 'inline-flex' }}><IcPlus /></span> Project
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowNewTask(true)} disabled={projects.length === 0}
            title={projects.length === 0 ? 'Create a project first' : ''}>
            <span style={{ width: 15, height: 15, display: 'inline-flex' }}><IcPlus /></span> New task
          </button>
        </div>
      </div>

      <div className="folder-row">
        <button className={`folder-chip ${projFilter === 'all' ? 'active' : ''}`} onClick={() => setProjFilter('all')}>
          All projects
        </button>
        {projects.map((p) => (
          <button key={p.id} className={`folder-chip ${projFilter === p.id ? 'active' : ''}`}
            onClick={() => setProjFilter(p.id)} title={p.description}>
            {p.name}
            {p.lead_id && <Avatar profile={teamById[p.lead_id]} size="sm" />}
          </button>
        ))}
        <button className={`folder-chip ${mineOnly ? 'active' : ''}`} onClick={() => setMineOnly((v) => !v)}
          style={{ marginLeft: 'auto' }}>
          Assigned to me
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card">
          <EmptyState title="No projects yet"
            sub={canManageProjects ? 'Create the first project to start organising work.'
              : 'A team lead or admin needs to create the first project.'}>
            {canManageProjects && (
              <button className="btn btn-primary mt-16" onClick={() => setShowNewProject(true)}>Create project</button>
            )}
          </EmptyState>
        </div>
      ) : (
        <div className="kanban">
          {COLS.map((col) => {
            const colTasks = visible.filter((t) => t.status === col.id);
            return (
              <div key={col.id}
                className={`kanban-col ${dragOver === col.id ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
                onDragLeave={() => setDragOver((d) => (d === col.id ? null : d))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  if (dragTask.current) moveTask(dragTask.current, col.id);
                  dragTask.current = null;
                }}>
                <div className="kanban-col-head">
                  <span className={`dot ${col.dot}`} />
                  {col.label}
                  <span className="text-3" style={{ marginLeft: 'auto', fontWeight: 600 }}>{colTasks.length}</span>
                </div>
                {colTasks.length === 0 && (
                  <div className="text-3 small" style={{ textAlign: 'center', padding: '18px 8px' }}>
                    {col.id === 'done' ? 'Nothing shipped yet' : 'Nothing here'}
                  </div>
                )}
                {colTasks.map((t) => {
                  const ds = dueState(t.due_date, t.status);
                  const proj = projects.find((p) => p.id === t.project_id);
                  return (
                    <div key={t.id} className="task-card" draggable
                      onDragStart={() => { dragTask.current = t; }}
                      onClick={() => setParams({ task: t.id })}>
                      <div className="tc-title">{t.title}</div>
                      <div className="tc-meta">
                        {t.assignee_id ? <Avatar profile={teamById[t.assignee_id]} size="sm" /> :
                          <span className="text-3" style={{ fontSize: 11.5 }}>Unassigned</span>}
                        {projFilter === 'all' && proj && <span className="badge">{proj.name}</span>}
                        {t.due_date && (
                          <span className={`tc-due ${ds === 'overdue' ? 'overdue' : ''}`}>
                            {fmtDate(t.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {showNewProject && (
        <ProjectModal onClose={() => setShowNewProject(false)}
          onDone={(p) => { setShowNewProject(false); setProjects((l) => [...l, p]); setProjFilter(p.id); }} />
      )}
      {showNewTask && (
        <TaskModal projects={projects} defaultProject={projFilter !== 'all' ? projFilter : projects[0]?.id}
          onClose={() => setShowNewTask(false)}
          onDone={(t) => { setShowNewTask(false); setTasks((l) => l.some((x) => x.id === t.id) ? l : [t, ...l]); }} />
      )}
      {openTask && (
        <TaskDetail task={openTask} projects={projects}
          onClose={() => setParams({})}
          onChange={(t) => setTasks((l) => l.map((x) => (x.id === t.id ? t : x)))}
          onDelete={(id) => { setTasks((l) => l.filter((x) => x.id !== id)); setParams({}); }} />
      )}
      {openTaskId && tasks && !openTask && (
        <Modal title="Task not found" onClose={() => setParams({})}>
          <p className="text-2">This task may have been deleted.</p>
        </Modal>
      )}
    </div>
  );
}

function ProjectModal({ onClose, onDone }) {
  const { profile, team } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [lead, setLead] = useState(profile.id);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.from('projects').insert({
      name: name.trim(), description: desc.trim(), lead_id: lead || null, created_by: profile.id,
    }).select().single();
    setBusy(false);
    if (error) return toast(error.message, 'error');
    onDone(data);
  }

  return (
    <Modal title="New project" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Name</label>
          <input className="input" autoFocus required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="September launch" maxLength={80} />
        </div>
        <div className="field">
          <label>Description</label>
          <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="What is this project for?" maxLength={200} />
        </div>
        <div className="field">
          <label>Project lead</label>
          <select className="select" value={lead} onChange={(e) => setLead(e.target.value)}>
            {team.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create project'}</button>
        </div>
      </form>
    </Modal>
  );
}

function TaskModal({ projects, defaultProject, onClose, onDone }) {
  const { profile, team } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [projectId, setProjectId] = useState(defaultProject || projects[0]?.id);
  const [assignee, setAssignee] = useState('');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.from('tasks').insert({
      project_id: projectId, title: title.trim(), description: desc.trim(),
      assignee_id: assignee || null, due_date: due || null, created_by: profile.id,
    }).select().single();
    setBusy(false);
    if (error) return toast(error.message, 'error');
    onDone(data);
  }

  return (
    <Modal title="New task" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Title</label>
          <input className="input" autoFocus required value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Ship onboarding flow" maxLength={200} />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="Details, links, acceptance criteria…" />
        </div>
        <div className="flex g12 wrap">
          <div className="field grow">
            <label>Project</label>
            <select className="select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field grow">
            <label>Assignee</label>
            <select className="select" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {team.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field grow">
            <label>Due date</label>
            <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create task'}</button>
        </div>
      </form>
    </Modal>
  );
}

function TaskDetail({ task, projects, onClose, onChange, onDelete }) {
  const { profile, team, teamById } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [busy, setBusy] = useState(false);

  const project = projects.find((p) => p.id === task.project_id);
  const canEdit = isAdminRole(profile.role) || task.assignee_id === profile.id ||
    task.created_by === profile.id || project?.lead_id === profile.id;
  const canDelete = isAdminRole(profile.role) || task.created_by === profile.id ||
    project?.lead_id === profile.id;

  useEffect(() => {
    let alive = true;
    supabase.from('task_comments').select('*').eq('task_id', task.id).order('created_at')
      .then(({ data }) => alive && setComments(data || []));
    const ch = supabase.channel(`task-comments-${task.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'task_comments', filter: `task_id=eq.${task.id}` },
        (p) => setComments((l) => (l && !l.some((x) => x.id === p.new.id)) ? [...l, p.new] : l))
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [task.id]);

  async function patch(fields) {
    const { data, error } = await supabase.from('tasks').update(fields).eq('id', task.id).select().single();
    if (error) return toast(/row-level security/i.test(error.message)
      ? 'You don’t have permission to edit this task.' : error.message, 'error');
    onChange(data);
  }

  async function addComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from('task_comments').insert({
      task_id: task.id, author_id: profile.id, content: newComment.trim(),
    }).select().single();
    setBusy(false);
    if (error) return toast(error.message, 'error');
    setComments((l) => (l && !l.some((x) => x.id === data.id)) ? [...l, data] : l);
    setNewComment('');
  }

  async function remove() {
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) return toast(error.message, 'error');
    onDelete(task.id);
  }

  return (
    <Modal title={task.title} onClose={onClose} wide>
      <div className="flex g12 wrap mb-16">
        <div className="field grow" style={{ marginBottom: 0 }}>
          <label>Status</label>
          <select className="select" value={task.status} disabled={!canEdit}
            onChange={(e) => patch({ status: e.target.value })}>
            {COLS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div className="field grow" style={{ marginBottom: 0 }}>
          <label>Assignee</label>
          <select className="select" value={task.assignee_id || ''} disabled={!canEdit}
            onChange={(e) => patch({ assignee_id: e.target.value || null })}>
            <option value="">Unassigned</option>
            {team.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="field grow" style={{ marginBottom: 0 }}>
          <label>Due date</label>
          <input className="input" type="date" value={task.due_date || ''} disabled={!canEdit}
            onChange={(e) => patch({ due_date: e.target.value || null })} />
        </div>
      </div>

      <div className="text-3 small mb-8">
        {project?.name}{project?.lead_id ? ` · led by ${teamById[project.lead_id]?.name}` : ''} ·
        created by {teamById[task.created_by]?.name || '—'} {timeAgo(task.created_at)}
      </div>

      {task.description && (
        <div className="card card-pad mb-16" style={{ whiteSpace: 'pre-wrap', color: 'var(--text-2)' }}>
          {task.description}
        </div>
      )}

      <div className="card-title">Comments</div>
      {comments === null ? <Spinner /> : (
        <>
          {comments.length === 0 && <div className="text-3 small mb-8">No comments yet.</div>}
          {comments.map((c) => (
            <div key={c.id} className="feed-item">
              <Avatar profile={teamById[c.author_id]} size="sm" />
              <div className="grow">
                <div className="fi-text"><b>{teamById[c.author_id]?.name || 'Unknown'}</b>
                  <span className="fi-time" style={{ marginLeft: 8 }}>{timeAgo(c.created_at)}</span></div>
                <div className="text-2" style={{ whiteSpace: 'pre-wrap' }}>{c.content}</div>
              </div>
            </div>
          ))}
        </>
      )}
      <form onSubmit={addComment} className="flex g8 mt-8">
        <input className="input" placeholder="Write a comment…" value={newComment}
          onChange={(e) => setNewComment(e.target.value)} />
        <button className="btn btn-primary" disabled={busy || !newComment.trim()}>Post</button>
      </form>

      {canDelete && (
        <div className="modal-foot">
          <button className="btn btn-danger" onClick={remove}>Delete task</button>
        </div>
      )}
    </Modal>
  );
}

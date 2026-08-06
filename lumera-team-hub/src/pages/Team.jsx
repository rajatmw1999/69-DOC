import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, EmptyState, RoleBadge } from '../components/ui';
import { isBirthdayToday, birthdayLabel } from '../lib/util';

export default function Team() {
  const { team } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('all');

  const depts = [...new Set(team.map((p) => p.department))].sort();
  const filtered = team.filter((p) =>
    (dept === 'all' || p.department === dept) &&
    (!q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()) ||
      p.email.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Team</h1>
          <div className="sub">{team.length} people building Lumera.</div>
        </div>
      </div>

      <div className="flex g12 wrap mb-16">
        <input className="input" style={{ maxWidth: 300 }} placeholder="Search by name or email…"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" style={{ maxWidth: 200 }} value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="all">All departments</option>
          {depts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="card"><EmptyState title="No matches" sub="Try a different name or department." /></div>
      )}

      <div className="team-grid">
        {filtered.map((p) => (
          <div key={p.id} className="card member-card" onClick={() => nav(`/team/${p.id}`)}>
            <Avatar profile={p} size="xl" />
            <div className="mc-name">{p.name}</div>
            <div className="mc-dept">{p.title ? `${p.title} · ` : ''}{p.department}</div>
            <RoleBadge role={p.role} />
            {isBirthdayToday(p.birthday) && (
              <div className="badge mt-8" style={{ background: 'var(--accent-soft)', color: 'var(--accent-hi)' }}>
                🎂 Birthday today!
              </div>
            )}
            {p.current_focus && (
              <div className="text-3 small mt-8 ellipsis" style={{ maxWidth: '100%' }}>
                🎯 {p.current_focus}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

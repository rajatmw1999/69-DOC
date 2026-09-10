export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

const AVATAR_HUES = [262, 280, 245, 300, 220, 330];
export function avatarGradient(id = '') {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  const hue = AVATAR_HUES[h % AVATAR_HUES.length];
  return `linear-gradient(135deg, hsl(${hue} 70% 42%), hsl(${(hue + 40) % 360} 80% 62%))`;
}

export function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function clockTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function fmtDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  });
}

export function fmtBytes(n) {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

export function dueState(due, status) {
  if (!due || status === 'done') return null;
  const d = new Date(due + 'T23:59:59');
  const now = new Date();
  if (d < now) return 'overdue';
  if ((d - now) / 86400000 <= 2) return 'soon';
  return null;
}

export const ROLE_LABEL = { admin: 'Founder / Admin', lead: 'Team Lead', member: 'Member' };

export const FOLDERS = [
  { id: 'general',   label: 'General',   access: 'everyone' },
  { id: 'product',   label: 'Product',   access: 'everyone' },
  { id: 'marketing', label: 'Marketing', access: 'everyone' },
  { id: 'finance',   label: 'Finance',   access: 'lead' },
  { id: 'legal',     label: 'Legal',     access: 'admin' },
];

export function canAccessFolder(folder, role) {
  const f = FOLDERS.find((x) => x.id === folder);
  if (!f) return false;
  if (f.access === 'admin') return role === 'admin';
  if (f.access === 'lead') return role === 'admin' || role === 'lead';
  return true;
}

export function fileKind(name = '') {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'IMG';
  if (ext === 'pdf') return 'PDF';
  if (['doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) return 'DOC';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'XLS';
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'PPT';
  if (['zip', 'rar', 'tar', 'gz'].includes(ext)) return 'ZIP';
  return ext.slice(0, 3).toUpperCase() || 'FILE';
}

// Find profiles whose @Name appears in the text (longest names matched first
// so "Ana Torres" wins over "Ana").
export function findMentions(text, profiles) {
  const hits = [];
  const sorted = [...profiles].sort((a, b) => b.name.length - a.name.length);
  for (const p of sorted) {
    if (!p.name) continue;
    if (text.toLowerCase().includes('@' + p.name.toLowerCase())) hits.push(p);
  }
  return hits;
}

// Split message text into segments, marking @mentions of known names.
export function mentionSegments(text, profiles) {
  const names = profiles.map((p) => p.name).filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (!names.length) return [{ t: text }];
  const re = new RegExp('@(' + names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
  const out = [];
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index) });
    out.push({ t: m[0], mention: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out;
}

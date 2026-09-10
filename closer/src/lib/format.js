export function fmtDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function fmtHours(sec) {
  const h = sec / 3600
  return h >= 10 ? h.toFixed(0) : h.toFixed(1)
}

export function fmtDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function fmtDateTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function timeAgo(ts) {
  const d = Date.now() - ts
  const mins = Math.floor(d / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return fmtDate(ts)
}

export function scoreClass(v) {
  return v >= 75 ? 'score-good' : v >= 55 ? 'score-mid' : 'score-low'
}

export function scoreLabel(v) {
  if (v >= 90) return 'Elite'
  if (v >= 75) return 'Strong'
  if (v >= 60) return 'Solid'
  if (v >= 45) return 'Developing'
  return 'Needs work'
}

export function initials(name) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

export function dayKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

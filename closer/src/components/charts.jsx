// Chart components. Palette validated on --chart-surface (#14141a):
// series-1 #c98500 gold · series-2 #3987e5 blue · series-3 #199e70 aqua · series-4 #e66767 red.
// Rules applied: one axis, thin marks, recessive grid, hover tooltips,
// legend for ≥2 series with direct labels, text in ink tokens.
import { useMemo, useRef, useState } from 'react'

const SERIES = ['#c98500', '#3987e5', '#199e70', '#e66767']

/* ── TrendChart: line/area with crosshair + tooltip ───────── */
export function TrendChart({
  series,            // [{ name, data: [{x,label,y}] }], 1..2 series
  height = 200, yMax = 100, yMin = 0, unit = '',
}) {
  const ref = useRef(null)
  const [hover, setHover] = useState(null)
  const W = 600
  const H = height
  const PAD = { l: 34, r: 12, t: 14, b: 26 }
  const n = series[0]?.data.length || 0
  const xAt = (i) => PAD.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - PAD.l - PAD.r))
  const yAt = (v) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b)

  const paths = useMemo(() => series.map((s) => {
    const pts = s.data.map((d, i) => `${xAt(i).toFixed(1)},${yAt(d.y).toFixed(1)}`)
    return { line: `M${pts.join('L')}`, area: `M${pts.join('L')}L${xAt(n - 1)},${yAt(yMin)}L${xAt(0)},${yAt(yMin)}Z` }
  }), [series, n]) // eslint-disable-line react-hooks/exhaustive-deps

  function onMove(e) {
    const rect = ref.current.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    let idx = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1))
    idx = Math.max(0, Math.min(n - 1, idx))
    setHover({ idx, left: (xAt(idx) / W) * rect.width, top: (yAt(series[0].data[idx].y) / H) * rect.height })
  }

  const gridYs = [0.25, 0.5, 0.75].map((f) => yMin + f * (yMax - yMin))

  return (
    <div className="viz-root" style={{ position: 'relative' }}>
      {series.length > 1 && (
        <div className="viz-legend">
          {series.map((s, i) => (
            <span key={s.name}><i className="viz-dot" style={{ background: SERIES[i] }} />{s.name}</span>
          ))}
        </div>
      )}
      <svg
        ref={ref} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseMove={onMove} onMouseLeave={() => setHover(null)}
        role="img" aria-label={`Trend chart: ${series.map((s) => s.name).join(', ')}`}
      >
        <defs>
          {series.map((_, i) => (
            <linearGradient key={i} id={`tg${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES[i]} stopOpacity=".22" />
              <stop offset="100%" stopColor={SERIES[i]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {gridYs.map((v) => (
          <line key={v} x1={PAD.l} x2={W - PAD.r} y1={yAt(v)} y2={yAt(v)} stroke="var(--grid-line)" strokeWidth="1" />
        ))}
        <line x1={PAD.l} x2={W - PAD.r} y1={yAt(yMin)} y2={yAt(yMin)} stroke="var(--axis-line)" strokeWidth="1" />
        {gridYs.concat([yMax]).map((v) => (
          <text key={`l${v}`} x={PAD.l - 8} y={yAt(v) + 4} textAnchor="end" fontSize="10" fill="var(--ink-2)" fontFamily="var(--font-mono)">{Math.round(v)}</text>
        ))}
        {series[0].data.map((d, i) => (
          (n <= 8 || i % Math.ceil(n / 8) === 0) && (
            <text key={`x${i}`} x={xAt(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--ink-2)">{d.label}</text>
          )
        ))}
        {series.map((s, i) => (
          <g key={s.name}>
            {i === 0 && <path d={paths[i].area} fill={`url(#tg${i})`} />}
            <path d={paths[i].line} fill="none" stroke={SERIES[i]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ))}
        {hover != null && (
          <g>
            <line x1={xAt(hover.idx)} x2={xAt(hover.idx)} y1={PAD.t} y2={H - PAD.b} stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="3 3" />
            {series.map((s, i) => (
              <circle key={i} cx={xAt(hover.idx)} cy={yAt(s.data[hover.idx].y)} r="4.5" fill={SERIES[i]} stroke="var(--chart-surface)" strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>
      {hover != null && (
        <div className="viz-tip" style={{ left: `${hover.left}px`, top: `${hover.top}px` }}>
          <div style={{ marginBottom: 2, color: 'var(--ink-2)' }}>{series[0].data[hover.idx].label}</div>
          {series.map((s, i) => (
            <div key={i}>
              <i className="viz-dot" style={{ background: SERIES[i] }} />
              <span className="k">{s.name}</span>
              <span className="v">{s.data[hover.idx].y}{unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── RadarChart: single-polygon skill radar ───────────────── */
export function RadarChart({ axes, size = 300 }) {
  // axes: [{ label, value }] 0..100, single series, gold
  const [hover, setHover] = useState(null)
  const cx = size / 2
  const cy = size / 2
  const R = size / 2 - 46
  const n = axes.length
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2
  const pt = (i, v) => [cx + Math.cos(angle(i)) * R * (v / 100), cy + Math.sin(angle(i)) * R * (v / 100)]
  const poly = axes.map((a, i) => pt(i, a.value).join(',')).join(' ')
  const ringVals = [25, 50, 75, 100]
  return (
    <div className="viz-root" style={{ position: 'relative' }}>
      <svg viewBox={`-52 -8 ${size + 104} ${size + 16}`} style={{ width: '100%', height: 'auto', maxWidth: size + 104, margin: '0 auto', display: 'block' }} role="img" aria-label={`Skill radar: ${axes.map((a) => `${a.label} ${a.value}`).join(', ')}`}>
        {ringVals.map((rv) => (
          <polygon
            key={rv}
            points={axes.map((_, i) => pt(i, rv).join(',')).join(' ')}
            fill="none" stroke="var(--grid-line)" strokeWidth="1"
          />
        ))}
        {axes.map((_, i) => (
          <line key={i} x1={cx} y1={cy} x2={pt(i, 100)[0]} y2={pt(i, 100)[1]} stroke="var(--grid-line)" strokeWidth="1" />
        ))}
        <polygon points={poly} fill="rgba(201,133,0,.16)" stroke="#c98500" strokeWidth="2" strokeLinejoin="round" />
        {axes.map((a, i) => {
          const [x, y] = pt(i, a.value)
          return (
            <circle
              key={a.label} cx={x} cy={y} r={hover === i ? 6 : 3.5}
              fill="#c98500" stroke="var(--chart-surface)" strokeWidth="2"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              style={{ transition: 'r .15s', cursor: 'default' }}
            />
          )
        })}
        {axes.map((a, i) => {
          const [x, y] = pt(i, 122)
          const anchor = Math.abs(x - cx) < 12 ? 'middle' : x > cx ? 'start' : 'end'
          return (
            <text key={a.label} x={x} y={y + 3} textAnchor={anchor} fontSize="10.5" fill={hover === i ? 'var(--ink-0)' : 'var(--ink-1)'}>
              {a.label}{hover === i ? ` · ${a.value}` : ''}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

/* ── BarRows: horizontal labeled bars (nominal, one hue) ──── */
export function BarRows({ items, max = 100, unit = '', color = SERIES[0] }) {
  return (
    <div className="bar-rows">
      {items.map((it) => (
        <div key={it.label} className="bar-row" title={`${it.label}: ${it.value}${unit}`}>
          <span className="bar-label">{it.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${Math.min(100, (it.value / max) * 100)}%`, background: it.color || color }} />
          </div>
          <span className="bar-value mono">{it.value}{unit}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Heatmap: activity calendar (sequential gold ramp) ────── */
// Gold opacity ramp over the card surface — reads correctly in both themes
// (empty = a faint surface tint, not a hardcoded dark square).
const HEAT_RAMP = [
  'var(--bg-4)',
  'rgba(201,133,0,.28)',
  'rgba(201,133,0,.46)',
  'rgba(201,133,0,.66)',
  'rgba(201,133,0,.85)',
  'var(--series-1)',
]
export function ActivityHeatmap({ days, weeks = 16 }) {
  // days: Map(dayKey → count)
  const [tip, setTip] = useState(null)
  const cells = []
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - (weeks * 7 - 1) - now.getDay())
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      if (date > now) continue
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const count = days.get(key) || 0
      cells.push({ w, d, key, count, date })
    }
  }
  const level = (c) => (c === 0 ? 0 : c === 1 ? 2 : c === 2 ? 3 : c === 3 ? 4 : 5)
  return (
    <div className="heatmap-wrap" style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${weeks * 15 + 4} ${7 * 15 + 4}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Training activity for the last 16 weeks">
        {cells.map((c) => (
          <rect
            key={c.key} x={c.w * 15 + 2} y={c.d * 15 + 2} width="11" height="11" rx="3"
            fill={HEAT_RAMP[level(c.count)]}
            onMouseEnter={(e) => {
              const host = e.currentTarget.closest('.heatmap-wrap').getBoundingClientRect()
              const r = e.currentTarget.getBoundingClientRect()
              setTip({ left: r.left - host.left + r.width / 2, top: r.top - host.top, text: `${c.count} session${c.count === 1 ? '' : 's'} · ${c.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` })
            }}
            onMouseLeave={() => setTip(null)}
          />
        ))}
      </svg>
      {tip && <div className="viz-tip" style={{ left: tip.left, top: tip.top }}>{tip.text}</div>}
      <div className="heat-legend">
        <span className="muted" style={{ fontSize: 11 }}>Less</span>
        {HEAT_RAMP.map((c) => <i key={c} style={{ background: c }} />)}
        <span className="muted" style={{ fontSize: 11 }}>More</span>
      </div>
    </div>
  )
}

/* ── TalkRatio: two-segment share bar with legend ─────────── */
export function TalkRatio({ ratio }) {
  const you = Math.round(ratio * 100)
  return (
    <div className="talk-ratio viz-root">
      <div className="viz-legend">
        <span><i className="viz-dot" style={{ background: SERIES[0] }} />You · {you}%</span>
        <span><i className="viz-dot" style={{ background: SERIES[1] }} />Prospect · {100 - you}%</span>
      </div>
      <div className="ratio-track" role="img" aria-label={`Talk ratio: you ${you}%, prospect ${100 - you}%`}>
        <div style={{ width: `${you}%`, background: SERIES[0] }} />
        <div style={{ width: `${100 - you}%`, background: SERIES[1] }} />
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        {you > 60 ? 'You dominated the airtime, aim closer to 45%.' : you < 35 ? 'You gave up too much control, steer with questions.' : 'Healthy balance. Elite closers sit near 45%.'}
      </p>
    </div>
  )
}

/* ── Sparkline ────────────────────────────────────────────── */
export function Sparkline({ data, width = 120, height = 36, color = SERIES[0] }) {
  if (!data.length) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - 4 - ((v - min) / span) * (height - 8)}`)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={`M${pts.join('L')}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

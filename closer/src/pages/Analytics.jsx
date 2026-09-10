// Analytics: trends, skill progression, weakness tracker, predictions.
import { useMemo } from 'react'
import { useProfile } from '../components/AppShell.jsx'
import { Card, Stat } from '../components/ui.jsx'
import { TrendChart, BarRows, ActivityHeatmap, RadarChart } from '../components/charts.jsx'
import { fmtDate, dayKey, fmtHours } from '../lib/format.js'
import { getCharacter } from '../data/characters.js'

const SKILLS = [
  ['objectionHandling', 'Objections'], ['closingAbility', 'Closing'], ['questionQuality', 'Questions'],
  ['listening', 'Listening'], ['confidence', 'Confidence'], ['rapport', 'Rapport'],
  ['control', 'Control'], ['tonality', 'Tonality'],
]
// Cycle the validated series palette so the charts aren't one flat gold.
const HUES = ['#c98500', '#3987e5', '#199e70', '#e66767', '#9085e9', '#e87ba4', '#d95926', '#eda100']

export default function Analytics() {
  const profile = useProfile()
  const calls = profile.calls

  const trend = calls.slice(-16).map((c) => ({ label: fmtDate(c.ts), y: c.overall }))
  const fillerTrend = calls.slice(-16).map((c) => ({ label: fmtDate(c.ts), y: c.fillerWords ?? 0 }))

  const skillAvgs = useMemo(() => {
    const early = calls.slice(0, Math.max(1, Math.floor(calls.length / 2)))
    const late = calls.slice(Math.floor(calls.length / 2))
    const avg = (arr, k) => (arr.length ? Math.round(arr.reduce((s, c) => s + (c.scores?.[k] ?? 50), 0) / arr.length) : 0)
    return SKILLS.map(([k, label]) => ({
      label, now: avg(late, k), before: avg(early, k), delta: avg(late, k) - avg(early, k),
    }))
  }, [calls])

  const weakness = [...skillAvgs].sort((a, b) => a.now - b.now)[0]
  const bestGain = [...skillAvgs].sort((a, b) => b.delta - a.delta)[0]
  const avgRecent = calls.slice(-5).reduce((s, c) => s + c.overall, 0) / Math.max(1, calls.slice(-5).length)
  const slope = calls.length >= 6
    ? (calls.slice(-3).reduce((s, c) => s + c.overall, 0) / 3) - (calls.slice(-6, -3).reduce((s, c) => s + c.overall, 0) / 3)
    : 2
  const prediction = Math.min(99, Math.round(avgRecent + slope * 4))

  const dayCounts = new Map()
  for (const c of calls) dayCounts.set(dayKey(c.ts), (dayCounts.get(dayKey(c.ts)) || 0) + 1)

  const byCharacter = useMemo(() => {
    const map = {}
    for (const c of calls) {
      map[c.characterId] = map[c.characterId] || { n: 0, total: 0 }
      map[c.characterId].n += 1
      map[c.characterId].total += c.overall
    }
    return Object.entries(map)
      .map(([id, { n, total }]) => ({ label: `${getCharacter(id).emoji} ${getCharacter(id).name}`, value: Math.round(total / n), n }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map((it, i) => ({ ...it, color: HUES[i % HUES.length] }))
  }, [calls])

  const radar = SKILLS.map(([k, label]) => ({
    label,
    value: Math.round(calls.slice(-6).reduce((s, c) => s + (c.scores?.[k] ?? 50), 0) / Math.max(1, calls.slice(-6).length)),
  }))

  return (
    <div className="page-enter">
      <div className="main-header">
        <h1>Analytics</h1>
        <p>Every rep measured. Every trend visible. No hiding from the tape.</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <Stat label="Calls analyzed" value={calls.length} icon="📼" />
        <Stat label="Hours on the phone" value={fmtHours(calls.reduce((s, c) => s + c.durationSec, 0)) + 'h'} icon="⏱️" />
        <Stat label="Weakest skill" value={weakness?.label ?? 'None yet'} sub={`avg ${weakness?.now ?? 0} · train it this week`} icon="🎯" />
        <Stat label="Projected score" value={prediction} sub="in ~4 more calls at current pace" icon="🔮" accent />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 12 }}>Overall score, last {trend.length} calls</h3>
          <TrendChart series={[{ name: 'Overall score', data: trend }]} height={210} />
        </Card>
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 12 }}>Filler words per call (lower is better)</h3>
          <TrendChart series={[{ name: 'Filler words', data: fillerTrend }]} height={210} yMax={Math.max(20, ...fillerTrend.map((d) => d.y))} />
        </Card>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.3fr 1fr', marginBottom: 16 }}>
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 4 }}>Skill progression</h3>
          <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>Recent average vs your first calls, Δ shows growth</p>
          <div className="col" style={{ gap: 10 }}>
            {skillAvgs.map((s, i) => (
              <div key={s.label} className="bar-row">
                <span className="bar-label">{s.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${s.now}%`, background: HUES[i % HUES.length] }} />
                </div>
                <span className={`bar-value mono ${s.delta >= 0 ? 'score-good' : 'score-low'}`}>
                  {s.delta >= 0 ? `+${s.delta}` : s.delta}
                </span>
              </div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            🚀 Fastest improvement: <b style={{ color: 'var(--ink-0)' }}>{bestGain?.label}</b> ({bestGain?.delta >= 0 ? '+' : ''}{bestGain?.delta} points)
          </p>
        </Card>
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 8 }}>Current skill shape</h3>
          <RadarChart axes={radar} size={300} />
        </Card>
      </div>

      <div className="grid grid-2">
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 12 }}>Training heatmap</h3>
          <ActivityHeatmap days={dayCounts} />
        </Card>
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 4 }}>Average score by opponent</h3>
          <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>Who you handle, and who still owns you</p>
          <BarRows items={byCharacter} />
        </Card>
      </div>
    </div>
  )
}

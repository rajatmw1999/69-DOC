// Daily practice: rotating 5-minute drills.
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { todaysDrills } from '../data/drills.js'
import { Card, Modal } from '../components/ui.jsx'
import { useProfile } from '../components/AppShell.jsx'
import { updateProfile } from '../lib/storage.js'
import { dayKey } from '../lib/format.js'

export default function Daily() {
  const profile = useProfile()
  const nav = useNavigate()
  const drills = todaysDrills()
  const today = dayKey(Date.now())
  const doneToday = profile.dailyDone[today] || []
  const [active, setActive] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [timerId, setTimerId] = useState(null)

  const startDrill = (d) => {
    setActive(d)
    setTimeLeft(d.minutes * 60)
    clearInterval(timerId)
    const id = setInterval(() => setTimeLeft((t) => {
      if (t <= 1) { clearInterval(id); return 0 }
      return t - 1
    }), 1000)
    setTimerId(id)
  }

  const completeDrill = () => {
    clearInterval(timerId)
    updateProfile((p) => {
      const arr = p.dailyDone[today] || (p.dailyDone[today] = [])
      if (!arr.includes(active.id)) arr.push(active.id)
      p.xp += 25
    })
    setActive(null)
  }

  const allDone = doneToday.length >= drills.length

  return (
    <div className="page-enter" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="main-header row between wrap">
        <div>
          <h1>Daily Practice ⚡</h1>
          <p>Short spoken warm-ups — no full call needed. They keep your streak alive and sharpen one skill at a time.</p>
        </div>
        <span className="chip gold">🔥 {profile.streak.current}-day streak · {doneToday.length}/{drills.length} today</span>
      </div>

      {/* Plain explainer so it's obvious what this page is for */}
      <Card className="pad" style={{ marginBottom: 16, background: 'linear-gradient(110deg, var(--gold-soft), transparent 60%), var(--bg-3)' }}>
        <div className="row between wrap" style={{ gap: 12, marginBottom: 12 }}>
          <b style={{ fontSize: 14.5 }}>What is Daily Practice?</b>
          <span className="chip">🔄 New drills every day</span>
        </div>
        <p className="muted" style={{ fontSize: 13, marginBottom: 14, maxWidth: 640 }}>
          Athletes drill before they play. Each day you get {drills.length} bite-sized reps you say out loud — an opener,
          an objection comeback, a one-line close. They take a minute or two each, bank XP, and protect your streak
          even on days you don't have time for a full simulator call.
        </p>
        <div className="daily-how">
          <div><span>1</span><div><b>Read the prompt</b><small>A real situation you'll face on calls</small></div></div>
          <div><span>2</span><div><b>Say your answer out loud</b><small>The timer keeps you sharp — no typing</small></div></div>
          <div><span>3</span><div><b>Bank it</b><small>+25 XP each, streak stays alive</small></div></div>
        </div>
      </Card>

      {allDone && (
        <Card className="pad anim-scale" style={{ marginBottom: 16, borderColor: 'rgba(12,163,12,.4)' }}>
          <div className="row" style={{ gap: 14 }}>
            <span style={{ fontSize: 32 }}>🏆</span>
            <div>
              <b>All drills complete.</b>
              <p className="muted" style={{ fontSize: 13 }}>Cap the day with a real call, the simulator remembers everything you practiced.</p>
            </div>
            <span className="spacer" />
            <button className="btn btn-gold btn-sm" onClick={() => nav('/app/simulator')}>📞 Take a call</button>
          </div>
        </Card>
      )}

      <div className="grid grid-2">
        {drills.map((d, i) => {
          const done = doneToday.includes(d.id)
          return (
            <Card key={d.id} className={`pad card-hover anim-up d${(i % 3) + 1}`} style={done ? { opacity: 0.65 } : undefined}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>{d.emoji}</span>
                {done ? <span className="chip good">✓ done</span> : <span className="chip">{d.minutes} min</span>}
              </div>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>{d.name}</h3>
              <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>{d.desc}</p>
              <div style={{ fontSize: 13.5, padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 10, marginBottom: 14, color: 'var(--ink-1)' }}>
                {d.prompt}
              </div>
              <button className={`btn btn-sm ${done ? 'btn-dark' : 'btn-gold'}`} onClick={() => startDrill(d)}>
                {done ? '↻ Repeat drill' : '▶ Start drill'}
              </button>
            </Card>
          )
        })}
      </div>

      <Modal open={!!active} onClose={() => { clearInterval(timerId); setActive(null) }}>
        {active && (
          <div className="col" style={{ alignItems: 'center', textAlign: 'center', gap: 14 }}>
            <span style={{ fontSize: 36 }}>{active.emoji}</span>
            <h2 className="display" style={{ fontSize: 22 }}>{active.name}</h2>
            <p style={{ fontSize: 15, padding: '12px 16px', background: 'var(--bg-2)', borderRadius: 12 }}>{active.prompt}</p>
            <div className="mono" style={{ fontSize: 40, fontWeight: 700, color: timeLeft < 20 ? 'var(--serious)' : 'var(--gold-bright)' }}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
            <p className="muted" style={{ fontSize: 12.5 }}>Say it out loud. Nobody's listening, that's the point of practice.</p>
            <button className="btn btn-gold btn-block" onClick={completeDrill}>✓ Done, bank +25 XP</button>
          </div>
        )}
      </Modal>
    </div>
  )
}

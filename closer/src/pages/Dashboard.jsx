// Dashboard: the first thing people see — a deep, alive command center.
// New users get a clear "run your first session" call to action; returning
// users get momentum, a recommended next rep, and their progress at a glance.
import { Link } from 'react-router-dom'
import { useProfile } from '../components/AppShell.jsx'
import { Card, Ring, Meter } from '../components/ui.jsx'
import { TrendChart, RadarChart } from '../components/charts.jsx'
import { levelFromXp, rankForLevel, nextRank } from '../lib/xp.js'
import { fmtHours, fmtDuration, fmtDate, dayKey } from '../lib/format.js'
import { getCharacter, CHARACTERS } from '../data/characters.js'
import { updateProfile } from '../lib/storage.js'

const SKILL_AXES = [
  ['confidence', 'Confidence'], ['tonality', 'Tonality'], ['listening', 'Listening'],
  ['questionQuality', 'Questions'], ['objectionHandling', 'Objections'],
  ['closingAbility', 'Closing'], ['rapport', 'Rapport'], ['control', 'Control'],
]

function MiniStat({ label, value, sub, tone }) {
  return (
    <div className="mini-stat">
      <span className="mini-label">{label}</span>
      <span className={`mini-value ${tone || ''}`}>{value}</span>
      {sub && <span className="mini-sub">{sub}</span>}
    </div>
  )
}

/* Shown until a user runs their own first session (seed history excluded). */
function FirstSessionHero({ name }) {
  return (
    <Card className="pad onboard-hero anim-up">
      <div className="onboard-hero-main">
        <span className="chip gold" style={{ marginBottom: 12 }}>👋 Welcome, {name}</span>
        <h2 className="headline" style={{ fontSize: 'clamp(24px,3vw,34px)', marginBottom: 8 }}>
          Ready for your first live rep?
        </h2>
        <p className="sub" style={{ maxWidth: 470, marginBottom: 18, fontSize: 14.5 }}>
          The charts below are <b>sample data</b> so you can see what you'll unlock. Take one real call and it
          all becomes yours — real scores, your own skill radar, streaks and rank, graded on 15 dimensions in
          under three minutes.
        </p>
        <div className="row wrap" style={{ gap: 10 }}>
          <Link to="/app/simulator" className="btn btn-gold btn-lg">📞 Take your first call</Link>
          <Link to="/app/academy" className="btn btn-ghost btn-lg">🎓 Or start with a lesson</Link>
        </div>
      </div>
      <ol className="onboard-steps">
        <li><span>1</span><div><b>Pick a prospect</b><small>21 AI opponents, from warm-ups to brutal</small></div></li>
        <li><span>2</span><div><b>Have the conversation</b><small>Speak out loud — they push back like the real thing</small></div></li>
        <li><span>3</span><div><b>Get the tape back</b><small>Scores, filler words, and exactly what to fix next</small></div></li>
      </ol>
    </Card>
  )
}

export default function Dashboard() {
  const profile = useProfile()
  const calls = profile.calls
  const ownCalls = calls.filter((c) => !c.seeded)
  const isNew = ownCalls.length === 0
  const { level, into, next } = levelFromXp(profile.xp)
  const rank = rankForLevel(level)
  const nRank = nextRank(level)

  const totalSec = calls.reduce((s, c) => s + c.durationSec, 0)
  const avgScore = calls.length ? Math.round(calls.reduce((s, c) => s + c.overall, 0) / calls.length) : 0
  const last7 = calls.filter((c) => Date.now() - c.ts < 7 * 86400000)
  const prev7 = calls.filter((c) => Date.now() - c.ts >= 7 * 86400000 && Date.now() - c.ts < 14 * 86400000)
  const wAvg = (arr) => (arr.length ? arr.reduce((s, c) => s + c.overall, 0) / arr.length : 0)
  const weeklyDelta = Math.round(wAvg(last7) - wAvg(prev7))

  const trendData = calls.slice(-14).map((c) => ({ label: fmtDate(c.ts), y: c.overall }))
  const radarAxes = SKILL_AXES.map(([key, label]) => {
    const recent = calls.slice(-6)
    const v = recent.length ? Math.round(recent.reduce((s, c) => s + (c.scores?.[key] ?? 50), 0) / recent.length) : 50
    return { label, value: v }
  })

  // Deeper insight: weakest skill → a recommended opponent to drill it against.
  const skillNow = SKILL_AXES.map(([key, label]) => ({
    key, label,
    v: calls.slice(-8).length ? Math.round(calls.slice(-8).reduce((s, c) => s + (c.scores?.[key] ?? 50), 0) / calls.slice(-8).length) : 50,
  }))
  const weakest = [...skillNow].sort((a, b) => a.v - b.v)[0]
  const strongest = [...skillNow].sort((a, b) => b.v - a.v)[0]
  const RECO_BY_SKILL = {
    objectionHandling: 'skeptical-customer', closingAbility: 'busy-ceo', questionQuality: 'startup-founder',
    listening: 'angry-prospect', confidence: 'shark-investor', tonality: 'luxury-client',
    rapport: 'gym-owner', control: 'cold-cfo',
  }
  const recoChar = getCharacter(RECO_BY_SKILL[weakest?.key] || 'skeptical-customer')

  const lastCall = calls[calls.length - 1]
  const trainedToday = profile.streak.lastDay === dayKey(Date.now())
  const goalsDone = profile.goals.filter((g) => g.done).length
  const closes = calls.filter((c) => c.outcome === 'closed').length
  const winRate = calls.length ? Math.round((closes / calls.length) * 100) : 0

  return (
    <div className="page-enter dash">
      <div className="dash-head">
        <div>
          <h1>Welcome back, {profile.user.name.split(' ')[0]}.</h1>
          <p>{isNew
            ? 'Let\'s log your first rep and bring this dashboard to life.'
            : trainedToday ? 'Session logged today. Keep the streak alive tomorrow.' : 'Your streak is on the line. One call keeps it alive.'}</p>
        </div>
        <Link to="/app/simulator" className="btn btn-gold">📞 Start a Call</Link>
      </div>

      {isNew && <div style={{ marginBottom: 18 }}><FirstSessionHero name={profile.user.name.split(' ')[0]} /></div>}

      {/* One dense stat strip */}
      <div className="stat-strip">
        <MiniStat label="Streak" value={<span>🔥 {profile.streak.current}</span>} sub={`best ${profile.streak.best}`} />
        <MiniStat label="Hours" value={fmtHours(totalSec) + 'h'} sub={`${calls.length} calls`} />
        <MiniStat label="Avg score" value={avgScore} sub={weeklyDelta >= 0 ? `↑ +${weeklyDelta} wk` : `↓ ${weeklyDelta} wk`} tone="gold-text" />
        <MiniStat label="Win rate" value={`${winRate}%`} sub={`${closes} closed`} />
        <MiniStat label="This week" value={last7.length} sub="calls" />
        <MiniStat label="Goals" value={`${goalsDone}/${profile.goals.length}`} sub="done" />
      </div>

      {/* Recommended next rep — makes the dashboard feel like it's coaching you */}
      {!isNew && (
        <Card className="pad focus-card" style={{ marginBottom: 16 }}>
          <div className="focus-left">
            <span className="eyebrow">Today's focus</span>
            <h3 style={{ fontSize: 17, margin: '8px 0 4px' }} className="display">
              Sharpen your <span className="gold-text">{weakest.label.toLowerCase()}</span>
            </h3>
            <p className="muted" style={{ fontSize: 13, maxWidth: 440 }}>
              It's your lowest skill right now (avg {weakest.v}). {recoChar.name} is built to attack exactly that —
              take one focused call and watch it move.
            </p>
          </div>
          <div className="focus-reco">
            <span className="char-emoji" style={{ width: 52, height: 52, fontSize: 26 }}>{recoChar.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: 14 }}>{recoChar.name}</b>
              <div className="muted" style={{ fontSize: 12 }}>{recoChar.title}</div>
            </div>
            <Link to="/app/simulator" state={{ characterId: recoChar.id }} className="btn btn-gold btn-sm">Call →</Link>
          </div>
        </Card>
      )}

      <div className="dash-grid">
        {/* Left: trend + radar */}
        <div className="dash-col">
          <Card className="pad">
            <div className="row between" style={{ marginBottom: 10 }}>
              <h3 className="card-title">Score trend</h3>
              <Link to="/app/analytics" className="btn btn-ghost btn-sm">Analytics →</Link>
            </div>
            <TrendChart series={[{ name: 'Overall score', data: trendData }]} height={188} />
          </Card>
          <Card className="pad">
            <div className="row between" style={{ marginBottom: 8 }}>
              <h3 className="card-title">Skills radar</h3>
              <div className="row" style={{ gap: 8 }}>
                <span className="chip good" style={{ fontSize: 10.5 }}>▲ {strongest.label}</span>
                <span className="chip" style={{ fontSize: 10.5 }}>▼ {weakest.label}</span>
              </div>
            </div>
            <div className="radar-stage">
              <RadarChart axes={radarAxes} size={420} />
            </div>
          </Card>
        </div>

        {/* Right rail */}
        <div className="dash-col">
          <Card className="pad rank-card">
            <div className="row" style={{ gap: 16 }}>
              <Ring value={(into / next) * 100} label={`Lv ${level}`} sublabel={rank.name} size={104} labelClassName="ring-level" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14 }}>{rank.icon} <b>{rank.name}</b></div>
                <div className="muted" style={{ fontSize: 12, margin: '2px 0 8px' }}>
                  {into.toLocaleString()} / {next.toLocaleString()} XP
                </div>
                {nRank && <div className="muted" style={{ fontSize: 11.5 }}>Next: {nRank.icon} {nRank.name} · Lv {nRank.minLevel}</div>}
                <div style={{ marginTop: 8 }}><Meter value={(into / next) * 100} thin /></div>
              </div>
            </div>
          </Card>

          {lastCall && (
            <Card className="pad">
              <h3 className="card-title" style={{ marginBottom: 10 }}>Last call</h3>
              <div className="row" style={{ gap: 12, marginBottom: 10 }}>
                <span className="char-emoji" style={{ width: 44, height: 44, fontSize: 22 }}>{getCharacter(lastCall.characterId).emoji}</span>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14 }}>{getCharacter(lastCall.characterId).name}</b>
                  <div className="muted" style={{ fontSize: 12 }}>{fmtDate(lastCall.ts)} · {fmtDuration(lastCall.durationSec)}</div>
                </div>
                <Ring value={lastCall.overall} size={52} stroke={5} />
              </div>
              <div className="row" style={{ gap: 8 }}>
                <Link to={`/app/review/${lastCall.id}`} className="btn btn-dark btn-sm" style={{ flex: 1 }}>Review</Link>
                <Link to="/app/simulator" state={{ characterId: lastCall.characterId }} className="btn btn-gold btn-sm" style={{ flex: 1 }}>Rematch</Link>
              </div>
            </Card>
          )}

          <Card className="pad">
            <div className="row between" style={{ marginBottom: 10 }}>
              <h3 className="card-title">Weekly goals</h3>
              <span className="chip gold" style={{ fontSize: 11 }}>{goalsDone}/{profile.goals.length}</span>
            </div>
            {profile.goals.map((g) => (
              <button
                key={g.id} className="goal-row" style={{ width: '100%', textAlign: 'left', padding: '7px 0' }}
                onClick={() => updateProfile((p) => { const goal = p.goals.find((x) => x.id === g.id); if (goal) goal.done = !goal.done })}
              >
                <span className={`goal-check ${g.done ? 'done' : ''}`}>✓</span>
                <span className={g.done ? 'done-text' : ''} style={{ fontSize: 13 }}>{g.text}</span>
              </button>
            ))}
          </Card>

          <div className="quick-actions">
            <Link to="/app/daily" className="quick-action"><span>⚡</span>Daily drills</Link>
            <Link to="/app/arena" className="quick-action"><span>🎥</span>Live Arena</Link>
            <Link to="/app/coach" className="quick-action"><span>🧠</span>Ask coach</Link>
            <Link to="/app/academy" className="quick-action"><span>🎓</span>Academy</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

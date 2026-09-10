// Community: leaderboards, weekly challenge, tournaments, rooms, achievements.
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../components/AppShell.jsx'
import { Card } from '../components/ui.jsx'
import { LEADERBOARD, WEEKLY_CHALLENGE, TOURNAMENT, PRACTICE_ROOMS, FRIEND_FEED } from '../data/community.js'
import { ACHIEVEMENTS, TIER_COLORS } from '../data/achievements.js'
import { levelFromXp, rankForLevel } from '../lib/xp.js'
import { getCharacter } from '../data/characters.js'
import { LIVE_PEERS } from '../data/arena.js'

export default function Community() {
  const profile = useProfile()
  const nav = useNavigate()
  const { level } = levelFromXp(profile.xp)
  const rank = rankForLevel(level)
  const wcChar = getCharacter(WEEKLY_CHALLENGE.characterId)

  const myRow = { name: profile.user.name, avatar: profile.user.avatar, level, xp: profile.xp, streak: profile.streak.current, badge: rank.name }
  const position = LEADERBOARD.filter((r) => r.xp > profile.xp).length + 1
  const liveTotal = PRACTICE_ROOMS.reduce((s, r) => s + r.live, 0)

  return (
    <div className="page-enter">
      <div className="main-header">
        <h1>Community</h1>
        <p>Iron sharpens iron. See where you stand, then climb.</p>
      </div>

      {/* Live right now */}
      <Card className="pad" style={{ marginBottom: 16, background: 'linear-gradient(120deg, var(--gold-soft), transparent 65%), var(--bg-3)' }}>
        <div className="row between wrap" style={{ marginBottom: 12 }}>
          <div className="row" style={{ gap: 9 }}>
            <span className="live-dot" />
            <h3 style={{ fontSize: 15.5 }}>Live right now</h3>
            <span className="chip good" style={{ fontSize: 11 }}>{liveTotal} in rooms · {LIVE_PEERS.length} open to pitch</span>
          </div>
          <button className="btn btn-gold btn-sm" onClick={() => nav('/app/arena')}>Enter the Arena →</button>
        </div>
        <div className="live-strip">
          {LIVE_PEERS.slice(0, 6).map((p) => (
            <button key={p.id} className="live-chip" onClick={() => nav('/app/arena')} title={p.wants}>
              <span className="live-chip-av">{p.avatar}<i /></span>
              <span><b>{p.name}</b><small>{p.role}</small></span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <Card className="pad card-hover" style={{ borderColor: 'rgba(211,169,78,.35)' }}>
          <div className="row between wrap" style={{ marginBottom: 8 }}>
            <span className="chip gold">⚔️ Weekly challenge · ends in {WEEKLY_CHALLENGE.endsInDays} days</span>
            <span className="muted" style={{ fontSize: 12 }}>{WEEKLY_CHALLENGE.entrants.toLocaleString()} entrants</span>
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 6 }} className="display">{WEEKLY_CHALLENGE.name}</h3>
          <p className="sub" style={{ fontSize: 13.5, marginBottom: 14 }}>{WEEKLY_CHALLENGE.desc}</p>
          <div className="row between wrap">
            <span className="muted" style={{ fontSize: 12.5 }}>Top score: <b className="gold-text">{WEEKLY_CHALLENGE.topScore}</b></span>
            <button className="btn btn-gold btn-sm" onClick={() => nav('/app/simulator', { state: { characterId: wcChar.id, challengeId: 'cold-call' } })}>
              Enter challenge →
            </button>
          </div>
        </Card>
        <Card className="pad card-hover">
          <div className="row between wrap" style={{ marginBottom: 8 }}>
            <span className="chip blue">🏆 Tournament · {TOURNAMENT.daysLeft} days left</span>
            <span className="muted" style={{ fontSize: 12 }}>{TOURNAMENT.entrants.toLocaleString()} competing</span>
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 6 }} className="display">{TOURNAMENT.name}</h3>
          <p className="sub" style={{ fontSize: 13.5, marginBottom: 10 }}>{TOURNAMENT.desc}</p>
          <div className="row wrap" style={{ gap: 6 }}>
            {TOURNAMENT.prizePool.map((p) => <span key={p} className="chip">{p}</span>)}
          </div>
        </Card>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', marginBottom: 16 }}>
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 14 }}>Global leaderboard</h3>
          <div className="col" style={{ gap: 2 }}>
            {LEADERBOARD.slice(0, Math.min(position - 1, 10)).map((r) => (
              <div key={r.rank} className="lb-row">
                <span className={`lb-rank ${r.rank <= 3 ? 'top' : ''}`}>{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</span>
                <span className="lb-avatar">{r.avatar}</span>
                <div><b>{r.name}</b><small>{r.badge} · Lv {r.level}</small></div>
                <span className="chip hide-sm">🔥 {r.streak}</span>
                <span className="lb-xp mono">{r.xp.toLocaleString()}</span>
              </div>
            ))}
            <div className="lb-row me">
              <span className="lb-rank top">{position}</span>
              <span className="lb-avatar">{myRow.avatar}</span>
              <div><b>{myRow.name} (you)</b><small>{myRow.badge} · Lv {myRow.level}</small></div>
              <span className="chip hide-sm">🔥 {myRow.streak}</span>
              <span className="lb-xp mono">{myRow.xp.toLocaleString()}</span>
            </div>
            {LEADERBOARD.slice(Math.min(position - 1, 10)).map((r) => (
              <div key={r.rank} className="lb-row">
                <span className="lb-rank">{r.rank + 1}</span>
                <span className="lb-avatar">{r.avatar}</span>
                <div><b>{r.name}</b><small>{r.badge} · Lv {r.level}</small></div>
                <span className="chip hide-sm">🔥 {r.streak}</span>
                <span className="lb-xp mono">{r.xp.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="col">
          <Card className="pad">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>👥 Friend activity</h3>
            <div className="col" style={{ gap: 12 }}>
              {FRIEND_FEED.map((f, i) => (
                <div key={i} className="row" style={{ gap: 10, fontSize: 13 }}>
                  <span className="lb-avatar" style={{ width: 34, height: 34, fontSize: 16 }}>{f.avatar}</span>
                  <div style={{ flex: 1 }}>
                    <span><b>{f.name}</b> {f.action}</span>
                    <div className="muted" style={{ fontSize: 11 }}>{f.ago}</div>
                  </div>
                  {f.action.includes('challenged') && (
                    <button className="btn btn-gold btn-sm" onClick={() => nav('/app/simulator', { state: { characterId: 'cold-cfo' } })}>Accept</button>
                  )}
                </div>
              ))}
            </div>
          </Card>
          <Card className="pad">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>🚪 Practice rooms</h3>
            <div className="col" style={{ gap: 10 }}>
              {PRACTICE_ROOMS.map((r) => (
                <div key={r.id} className="row between" style={{ fontSize: 13 }}>
                  <div>
                    <b>{r.name}</b>
                    <div className="muted" style={{ fontSize: 11.5 }}>{r.focus} · {r.level}</div>
                  </div>
                  <span className="chip good">● {r.live} live</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="pad">
        <div className="row between" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 15.5 }}>Achievements</h3>
          <span className="chip gold">{profile.achievements.length}/{ACHIEVEMENTS.length} unlocked</span>
        </div>
        <div className="grid grid-4">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = profile.achievements.includes(a.id)
            return (
              <div key={a.id} className="card pad" style={{ background: 'var(--bg-2)', boxShadow: 'none', opacity: unlocked ? 1 : 0.45, borderColor: unlocked ? `${TIER_COLORS[a.tier]}55` : undefined }}>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 22, filter: unlocked ? 'none' : 'grayscale(1)' }}>{a.emoji}</span>
                  <span className="chip" style={{ color: TIER_COLORS[a.tier], borderColor: `${TIER_COLORS[a.tier]}66`, fontSize: 10 }}>{a.tier}</span>
                </div>
                <b style={{ fontSize: 13 }}>{a.name}</b>
                <p className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{a.desc}</p>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

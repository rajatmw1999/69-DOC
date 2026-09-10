// Challenge modes — compact, visual, minimal text.
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { CHALLENGES } from '../data/challenges.js'
import { getCharacter } from '../data/characters.js'
import { Difficulty } from '../components/ui.jsx'
import { useProfile } from '../components/AppShell.jsx'

const CATS = ['All', 'Fundamentals', 'Core Skills', 'Advanced', 'Industry']

export default function Challenges() {
  const nav = useNavigate()
  const [cat, setCat] = useState('All')
  const profile = useProfile()
  const list = CHALLENGES.filter((c) => cat === 'All' || c.category === cat)

  const bestFor = (id) => {
    const attempts = profile.calls.filter((c) => c.challengeId === id)
    return attempts.length ? Math.max(...attempts.map((c) => c.overall)) : null
  }

  return (
    <div className="page-enter">
      <div className="main-header">
        <h1>Challenges</h1>
        <p>Pick a mission. Beat the objective. Bank the XP.</p>
      </div>

      <div className="row wrap" style={{ marginBottom: 18 }}>
        {CATS.map((c) => (
          <button key={c} className={`chip ${cat === c ? 'gold' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="chal-grid">
        {list.map((c) => {
          const opp = getCharacter(c.characterId)
          const best = bestFor(c.id)
          return (
            <button
              key={c.id} className="chal-card card card-hover"
              onClick={() => nav('/app/simulator', { state: { characterId: c.characterId, challengeId: c.id } })}
              title={c.objective}
            >
              <span className="chal-emoji">{c.emoji}</span>
              <div className="chal-body">
                <div className="row between">
                  <b className="chal-name">{c.name}</b>
                  {best != null && <span className="chip good" style={{ fontSize: 10.5 }}>{best}</span>}
                </div>
                <div className="chal-meta">
                  <Difficulty level={c.difficulty} />
                  <span>·</span><span>{c.minutes}m</span>
                  <span>·</span><span>{opp.emoji}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

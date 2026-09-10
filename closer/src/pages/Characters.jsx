// Character roster as a flip-through card deck. Flip a card to read the
// prospect's dossier; master one (score 90+) and it joins your collection.
import { useNavigate } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { CHARACTERS } from '../data/characters.js'
import { Difficulty, Modal } from '../components/ui.jsx'
import { useProfile } from '../components/AppShell.jsx'

const FILTERS = ['All', 'Legends', 'Brutal', 'Hard', 'Medium', 'Easy']
const LEGENDS = ['jordan-belfort', 'grant-cardone', 'steve-jobs', 'elon-musk', 'warren-buffett', 'mark-cuban', 'barbara-corcoran']
const MASTERY = 90

export default function Characters() {
  const nav = useNavigate()
  const profile = useProfile()
  const [filter, setFilter] = useState('All')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [custom, setCustom] = useState({ name: '', industry: 'SaaS', difficulty: 3, style: 'skeptical' })

  // Best score per character → who you've mastered.
  const bestByChar = useMemo(() => {
    const m = {}
    for (const c of profile.calls) m[c.characterId] = Math.max(m[c.characterId] ?? 0, c.overall)
    return m
  }, [profile.calls])
  const mastered = CHARACTERS.filter((c) => (bestByChar[c.id] ?? 0) >= MASTERY)

  const list = CHARACTERS.filter((c) => {
    if (filter === 'All') return true
    if (filter === 'Legends') return LEGENDS.includes(c.id)
    return { Brutal: 5, Hard: 4, Medium: 3, Easy: 2 }[filter] === c.difficulty
  })

  // Keep the index in range when the filter changes.
  useEffect(() => { setIndex(0); setFlipped(false) }, [filter])
  const safeIndex = Math.min(index, Math.max(0, list.length - 1))
  const card = list[safeIndex]

  const go = (dir) => {
    setFlipped(false)
    setIndex((i) => (list.length ? (i + dir + list.length) % list.length : 0))
  }
  useEffect(() => {
    const onKey = (e) => {
      if (builderOpen) return
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  const startCustom = () => {
    const archetype = { skeptical: 'skeptical-customer', aggressive: 'angry-prospect', analytical: 'cold-cfo', warm: 'budget-buyer' }[custom.style]
    setBuilderOpen(false)
    nav('/app/simulator', { state: { characterId: archetype, scenario: {
      title: `Custom: ${custom.name || 'Unnamed prospect'}`,
      topic: `selling to a ${custom.style} ${custom.industry} buyer`,
      openingContext: `You built this prospect: ${custom.name || 'Unnamed'}, a ${custom.style} buyer in ${custom.industry}, difficulty ${custom.difficulty}/5.`,
    } } })
  }

  const best = card ? bestByChar[card.id] : undefined
  const isMastered = card && (best ?? 0) >= MASTERY

  return (
    <div className="page-enter">
      <div className="main-header row between wrap">
        <div>
          <h1>Characters</h1>
          <p>{CHARACTERS.length} AI opponents. Flip a card to scout them, then call. Score {MASTERY}+ to collect one.</p>
        </div>
        <button className="btn btn-gold" onClick={() => setBuilderOpen(true)}>＋ Build your own</button>
      </div>

      <div className="roster-layout">
        {/* Left: mastered collection */}
        <aside className="collection">
          <div className="row between" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 14.5 }}>🏅 My collection</h3>
            <span className="chip gold" style={{ fontSize: 11 }}>{mastered.length}/{CHARACTERS.length}</span>
          </div>
          {mastered.length === 0 && (
            <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              No cards yet. Beat any character with a score of <b className="gold-text">{MASTERY}+</b> and they'll
              be minted here as a trophy.
            </p>
          )}
          <div className="collection-grid">
            {mastered.map((c) => (
              <button
                key={c.id} className="collection-card" title={`${c.name} · best ${bestByChar[c.id]}`}
                onClick={() => { const i = list.findIndex((x) => x.id === c.id); if (i >= 0) { setIndex(i); setFlipped(false) } else { setFilter('All') } }}
              >
                <span className="collection-emoji">{c.emoji}</span>
                <b>{c.name.split(' ')[0]}</b>
                <span className="chip gold" style={{ fontSize: 9.5, padding: '2px 7px' }}>★ {bestByChar[c.id]}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Right: the deck */}
        <div className="deck-area">
          <div className="row wrap" style={{ marginBottom: 16, justifyContent: 'center' }}>
            {FILTERS.map((f) => (
              <button key={f} className={`chip ${filter === f ? 'gold' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>

          {card ? (
            <>
              <div className="deck-stage">
                <button className="deck-nav" onClick={() => go(-1)} aria-label="Previous character">‹</button>

                <div className={`deck-card ${flipped ? 'flip' : ''}`} onClick={() => setFlipped((f) => !f)} role="button" tabIndex={0} aria-label={`${card.name}, tap to flip`}>
                  <div className="deck-card-inner">
                    {/* Front */}
                    <div className="deck-face deck-front">
                      {isMastered && <span className="deck-master">🏅 Mastered</span>}
                      <span className="deck-emoji">{card.emoji}</span>
                      <h2 className="display" style={{ fontSize: 24 }}>{card.name}</h2>
                      <span className="deck-title">{card.title}</span>
                      <Difficulty level={card.difficulty} showLabel />
                      <div className="row wrap" style={{ gap: 6, justifyContent: 'center', marginTop: 4 }}>
                        <span className="chip">{card.industry}</span>
                        {card.salesStyle && <span className="chip">{card.salesStyle}</span>}
                      </div>
                      {best != null && (
                        <div className="deck-best">Your best: <b className={best >= MASTERY ? 'gold-text' : ''}>{best}</b>{best < MASTERY && <span className="muted"> · {MASTERY - best} to master</span>}</div>
                      )}
                      <span className="deck-hint">tap to flip ⟲</span>
                    </div>
                    {/* Back — the dossier */}
                    <div className="deck-face deck-back">
                      <h3 className="display" style={{ fontSize: 17, marginBottom: 10 }}>{card.emoji} Dossier</h3>
                      <dl className="dossier">
                        <div><dt>Temperament</dt><dd>{card.personality}</dd></div>
                        <div><dt>Objection style</dt><dd>{card.objectionStyle}</dd></div>
                        {card.salesStyle && <div><dt>Plays</dt><dd>{card.salesStyle}</dd></div>}
                        <div><dt>Industry</dt><dd>{card.industry}</dd></div>
                      </dl>
                      <button className="btn btn-gold btn-block" style={{ marginTop: 'auto' }} onClick={(e) => { e.stopPropagation(); nav('/app/simulator', { state: { characterId: card.id } }) }}>
                        📞 Call {card.name.split(' ')[0]}
                      </button>
                    </div>
                  </div>
                </div>

                <button className="deck-nav" onClick={() => go(1)} aria-label="Next character">›</button>
              </div>

              <div className="deck-foot">
                <span className="muted" style={{ fontSize: 12 }}>{safeIndex + 1} / {list.length}</span>
                <div className="deck-dots">
                  {list.map((c, i) => (
                    <button key={c.id} className={`deck-dot ${i === safeIndex ? 'on' : ''} ${(bestByChar[c.id] ?? 0) >= MASTERY ? 'mastered' : ''}`} onClick={() => { setIndex(i); setFlipped(false) }} aria-label={c.name} />
                  ))}
                </div>
                <button className="btn btn-gold btn-sm" onClick={() => nav('/app/simulator', { state: { characterId: card.id } })}>Call now →</button>
              </div>
            </>
          ) : (
            <p className="muted" style={{ textAlign: 'center', padding: 40 }}>No characters match that filter.</p>
          )}
        </div>
      </div>

      <Modal open={builderOpen} onClose={() => setBuilderOpen(false)}>
        <h2 style={{ fontSize: 20, marginBottom: 4 }} className="display">Build a character</h2>
        <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>Design the exact prospect you keep losing to.</p>
        <div className="col" style={{ gap: 14 }}>
          <div className="field">
            <label>Name</label>
            <input className="input" placeholder="e.g. Dr. Patel, skeptical dentist" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Industry</label>
            <select className="select" value={custom.industry} onChange={(e) => setCustom({ ...custom, industry: e.target.value })}>
              {['SaaS', 'Real Estate', 'Healthcare', 'Finance', 'Retail', 'Hospitality', 'Fitness', 'Automotive', 'Insurance'].map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Temperament</label>
            <select className="select" value={custom.style} onChange={(e) => setCustom({ ...custom, style: e.target.value })}>
              <option value="skeptical">Skeptical — demands proof</option>
              <option value="aggressive">Aggressive — hostile from hello</option>
              <option value="analytical">Analytical — only numbers matter</option>
              <option value="warm">Warm — friendly but price-sensitive</option>
            </select>
          </div>
          <div className="field">
            <label>Difficulty · {custom.difficulty}/5</label>
            <input type="range" min="1" max="5" value={custom.difficulty} onChange={(e) => setCustom({ ...custom, difficulty: Number(e.target.value) })} />
          </div>
          <button className="btn btn-gold btn-block" onClick={startCustom}>Create & call now →</button>
        </div>
      </Modal>
    </div>
  )
}

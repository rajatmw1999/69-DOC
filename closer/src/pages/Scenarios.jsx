// Scenario Lab: free-text prompt → playable scenario.
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { generateScenario, SCENARIO_EXAMPLES } from '../data/scenarios.js'
import { getCharacter } from '../data/characters.js'
import { Card, Difficulty, Skeleton } from '../components/ui.jsx'

export default function Scenarios() {
  const nav = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [scenario, setScenario] = useState(null)

  const generate = (text) => {
    const p = (text ?? prompt).trim()
    if (!p) return
    setPrompt(p)
    setGenerating(true)
    setScenario(null)
    setTimeout(() => {
      setScenario(generateScenario(p))
      setGenerating(false)
    }, 900)
  }

  const character = scenario ? getCharacter(scenario.characterId) : null

  return (
    <div className="page-enter" style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="main-header" style={{ textAlign: 'center' }}>
        <h1>Scenario Lab 🧪</h1>
        <p>Describe any sale in plain language. The lab builds the prospect, the stakes, and the objectives.</p>
      </div>

      <Card className="pad" style={{ marginBottom: 18 }}>
        <form onSubmit={(e) => { e.preventDefault(); generate() }} className="col" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="scenario-input">What do you need to sell, and to whom?</label>
            <textarea
              id="scenario-input" className="textarea"
              placeholder='e.g. "I need to sell accounting software to a dentist."'
              value={prompt} onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <div className="row between wrap">
            <div className="row wrap" style={{ gap: 6 }}>
              {SCENARIO_EXAMPLES.slice(0, 3).map((ex) => (
                <button key={ex} type="button" className="chip" style={{ cursor: 'pointer' }} onClick={() => generate(ex)}>{ex}</button>
              ))}
            </div>
            <button type="submit" className="btn btn-gold" disabled={!prompt.trim() || generating}>
              {generating ? '⟳ Generating…' : '⚡ Generate scenario'}
            </button>
          </div>
        </form>
      </Card>

      {generating && (
        <Card className="pad">
          <div className="col" style={{ gap: 12 }}>
            <Skeleton w="40%" h={22} />
            <Skeleton w="90%" h={14} />
            <Skeleton w="75%" h={14} />
            <div className="row" style={{ gap: 8 }}>
              <Skeleton w={90} h={26} r={999} /><Skeleton w={110} h={26} r={999} /><Skeleton w={80} h={26} r={999} />
            </div>
            <Skeleton w="100%" h={44} r={999} />
          </div>
        </Card>
      )}

      {scenario && !generating && (
        <Card className="pad anim-scale" style={{ borderColor: 'rgba(211,169,78,.4)' }}>
          <span className="chip gold" style={{ marginBottom: 12 }}>🧪 Generated scenario</span>
          <h2 style={{ fontSize: 21, marginBottom: 8 }} className="display">{scenario.title}</h2>
          <p className="sub" style={{ fontSize: 14, marginBottom: 16 }}>{scenario.openingContext}</p>

          <div className="grid grid-2" style={{ marginBottom: 16 }}>
            <div className="row" style={{ gap: 12 }}>
              <span className="char-emoji">{character.emoji}</span>
              <div>
                <b style={{ fontSize: 14.5 }}>{character.name}</b>
                <div className="muted" style={{ fontSize: 12 }}>{scenario.persona}</div>
              </div>
            </div>
            <div className="col" style={{ gap: 6 }}>
              <span className="chip">{scenario.industry}</span>
              <Difficulty level={scenario.difficulty} showLabel />
            </div>
          </div>

          <h4 style={{ fontSize: 13, marginBottom: 8, color: 'var(--ink-1)' }}>Objectives</h4>
          <ul style={{ listStyle: 'none', marginBottom: 20 }}>
            {scenario.objectives.map((o) => (
              <li key={o} style={{ fontSize: 13.5, padding: '5px 0', color: 'var(--ink-1)' }}>🎯 {o}</li>
            ))}
          </ul>

          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-gold" onClick={() => nav('/app/simulator', { state: { characterId: scenario.characterId, scenario } })}>
              📞 Start this call
            </button>
            <button className="btn btn-ghost" onClick={() => generate()}>↻ Regenerate</button>
          </div>
        </Card>
      )}

      {!scenario && !generating && (
        <div>
          <h4 style={{ fontSize: 13, margin: '8px 0 10px', color: 'var(--ink-2)', textAlign: 'center' }}>More ideas</h4>
          <div className="row wrap" style={{ gap: 8, justifyContent: 'center' }}>
            {SCENARIO_EXAMPLES.slice(3).map((ex) => (
              <button key={ex} className="chip" style={{ cursor: 'pointer' }} onClick={() => generate(ex)}>{ex}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

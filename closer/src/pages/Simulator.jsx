// Phone simulator page: the phone, centered, with a slim setup rail.
import { useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import PhoneSim from '../components/phone/PhoneSim.jsx'
import { Card, Difficulty } from '../components/ui.jsx'
import { CHARACTERS, getCharacter } from '../data/characters.js'
import { CHALLENGES, getChallenge } from '../data/challenges.js'
import { recordCall, getProfile, updateProfile } from '../lib/storage.js'
import { xpForCall } from '../lib/xp.js'
import { premiumVoiceAvailable } from '../lib/speech.js'

export default function Simulator() {
  const location = useLocation()
  const nav = useNavigate()
  const preset = location.state || {}

  const [characterId, setCharacterId] = useState(preset.characterId || '')
  const [challengeId, setChallengeId] = useState(preset.challengeId || '')
  const [incoming, setIncoming] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const scenario = preset.scenario || null

  const character = characterId ? getCharacter(characterId) : null
  const challenge = challengeId ? getChallenge(challengeId) : null
  const premium = premiumVoiceAvailable(getProfile().settings)

  const startTarget = useMemo(
    () => (character ? { ...character } : null),
    [characterId, sessionKey], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const handleComplete = ({ report, transcript, durationSec, character: c }) => {
    const xp = xpForCall({ overall: report.overall, durationSec, difficulty: c.difficulty })
    const call = {
      id: `call-${Date.now()}`, ts: Date.now(), characterId: c.id,
      challengeId: challenge?.id || (scenario ? 'scenario' : 'freestyle'),
      scenarioTitle: scenario?.title, durationSec, overall: report.overall,
      scores: report.scores, talkRatio: report.talkRatio, fillerWords: report.fillerWords,
      interruptions: report.interruptions, outcome: report.outcome, transcript, report, xpEarned: xp,
    }
    recordCall(call)
    updateProfile((p) => {
      if (report.overall >= 80 && !p.achievements.includes('score-80')) p.achievements.push('score-80')
      if (report.overall >= 90 && !p.achievements.includes('score-90')) p.achievements.push('score-90')
      if (report.fillerWords === 0 && !p.achievements.includes('no-filler')) p.achievements.push('no-filler')
      if (durationSec > 600 && !p.achievements.includes('marathon')) p.achievements.push('marathon')
      if (report.outcome === 'closed' && c.id === 'jordan-belfort' && !p.achievements.includes('beat-wolf')) p.achievements.push('beat-wolf')
      if (report.outcome === 'closed' && c.difficulty === 5 && !p.achievements.includes('beat-brutal')) p.achievements.push('beat-brutal')
    })
    nav(`/app/review/${call.id}`)
  }

  return (
    <div className="page-enter">
      <div className="main-header">
        <h1>Phone Simulator</h1>
        <p>Pick who you're calling, then take the call.</p>
      </div>

      <div className="sim-layout">
        <div className="sim-phone-wrap">
          <PhoneSim
            key={sessionKey}
            startCharacter={startTarget}
            challenge={challenge}
            scenario={scenario}
            incoming={incoming}
            onCallComplete={handleComplete}
          />
        </div>

        <div className="sim-brief">
          <Card className="pad">
            <h3 style={{ fontSize: 14.5, marginBottom: 12 }}>Who are you calling?</h3>
            <div className="field" style={{ marginBottom: 10 }}>
              <label htmlFor="sim-char">Opponent</label>
              <select id="sim-char" className="select" value={characterId} onChange={(e) => { setCharacterId(e.target.value); setSessionKey((k) => k + 1) }}>
                <option value="">Pick a contact…</option>
                {CHARACTERS.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name} · {['', 'Warm-up', 'Easy', 'Medium', 'Hard', 'Brutal'][c.difficulty]}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label htmlFor="sim-chal">Challenge (optional)</label>
              <select id="sim-chal" className="select" value={challengeId} onChange={(e) => setChallengeId(e.target.value)}>
                <option value="">Freestyle call</option>
                {CHALLENGES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <label className="row" style={{ fontSize: 13, gap: 9, cursor: 'pointer' }}>
              <input type="checkbox" checked={incoming} onChange={(e) => setIncoming(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              They call you
            </label>
          </Card>

          {character && (
            <Card className="pad">
              <div className="row" style={{ gap: 12, marginBottom: 10 }}>
                <span className="char-emoji">{character.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 15 }}>{character.name}</h3>
                  <span className="char-title">{character.title}</span>
                </div>
                <Difficulty level={character.difficulty} />
              </div>
              <div className="row wrap" style={{ gap: 6 }}>
                <span className="chip">{character.industry}</span>
                <span className="chip">{character.objectionStyle}</span>
              </div>
            </Card>
          )}

          {challenge && (
            <Card className="pad" style={{ borderColor: 'rgba(203,162,78,.35)' }}>
              <div className="row between" style={{ marginBottom: 4 }}>
                <b style={{ fontSize: 13.5 }}>{challenge.emoji} {challenge.name}</b>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--gold-bright)' }}>🎯 {challenge.objective}</div>
            </Card>
          )}

          <div className="sim-note">
            {premium
              ? '🎙️ Studio voices are on — the AI speaks in real human voices.'
              : getProfile().settings.muteVoice
                ? '💬 Voice is muted — the AI replies in captions. Turn Character voices back on in Settings to hear them.'
                : '🔊 The AI speaks out loud in your browser voice, with captions. Add a studio key in Settings for genuinely human voices.'}
          </div>
        </div>
      </div>
    </div>
  )
}

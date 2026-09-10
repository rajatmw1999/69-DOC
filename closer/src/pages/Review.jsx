// Call review: full post-call report + replay mode.
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useProfile } from '../components/AppShell.jsx'
import { Card, Ring, Modal, EmptyState } from '../components/ui.jsx'
import { BarRows, TrendChart, TalkRatio } from '../components/charts.jsx'
import { voiceProfile } from '../lib/scoring.js'
import { getCharacter } from '../data/characters.js'
import { getChallenge } from '../data/challenges.js'
import { fmtDuration, fmtDateTime, scoreLabel, scoreClass } from '../lib/format.js'
import { speak, stopSpeaking, speakAs } from '../lib/speech.js'

const SKILL_LABELS = {
  confidence: 'Confidence', tonality: 'Tonality', pacing: 'Pacing', energy: 'Energy',
  empathy: 'Empathy', listening: 'Listening', questionQuality: 'Question Quality',
  objectionHandling: 'Objection Handling', closingAbility: 'Closing Ability',
  productKnowledge: 'Product Knowledge', rapport: 'Rapport', control: 'Conversation Control',
  persuasiveness: 'Persuasiveness', authority: 'Authority', professionalism: 'Professionalism',
}

const BETTER_LINES = [
  'Try: "Totally fair, most of my best clients said exactly that on the first call. Can I ask what you\'re using today?"',
  'Try: "Before we talk price, if this solved [their pain], what would that be worth to you per month?"',
  'Try: "It sounds like timing is the real issue, not the product. What would need to be true for this to be a priority?"',
  'Try: "Let me ask you one question, and if it doesn\'t land, I\'ll let you go: what\'s your plan for [problem] this quarter?"',
]

export default function Review() {
  const { callId } = useParams()
  const profile = useProfile()
  const nav = useNavigate()

  const calls = profile.calls
  const call = callId ? calls.find((c) => c.id === callId) : calls[calls.length - 1]

  const [replayIdx, setReplayIdx] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [askLine, setAskLine] = useState(null)
  const replayTimer = useRef(null)
  const transcriptRef = useRef(null)

  useEffect(() => () => { clearTimeout(replayTimer.current); stopSpeaking() }, [])

  const character = call ? getCharacter(call.characterId) : null
  const report = call?.report
  const transcript = call?.transcript || []

  const emotionArc = useMemo(() => {
    if (!report?.confidenceTrend?.length) return []
    return report.confidenceTrend.map((v, i) => ({ label: `T${i + 1}`, y: v }))
  }, [report])

  if (!call) {
    return (
      <div className="page-enter">
        <div className="main-header"><h1>Call Review</h1></div>
        <EmptyState icon="🎧" title="No calls yet" sub="Complete a call in the simulator and the full breakdown lands here." action={<Link className="btn btn-gold" to="/app/simulator">Start a call</Link>} />
      </div>
    )
  }

  const startReplay = () => {
    stopReplay()
    setPlaying(true)
    playLine(0)
  }
  const playLine = (i) => {
    if (i >= transcript.length) { setPlaying(false); setReplayIdx(-1); return }
    setReplayIdx(i)
    const line = transcript[i]
    const el = transcriptRef.current?.children[i]
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const isAi = line.speaker === 'ai'
    const handle = isAi
      ? speakAs(line.text, character, profile.settings)
      : speak(line.text, { rate: 1, pitch: 1 })
    handle.promise.then(() => {
      replayTimer.current = setTimeout(() => playLine(i + 1), 350)
    })
  }
  const stopReplay = () => {
    clearTimeout(replayTimer.current)
    stopSpeaking()
    setPlaying(false)
    setReplayIdx(-1)
  }

  const exportReport = () => {
    const blob = new Blob([JSON.stringify({ ...call, character: character.name }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `closer-report-${call.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const skillItems = Object.entries(call.scores).map(([k, v]) => ({ label: SKILL_LABELS[k] || k, value: v }))
  const outcomeChip = call.outcome === 'closed'
    ? <span className="chip good">🏆 Deal closed</span>
    : call.outcome === 'hangup'
      ? <span className="chip crit">📵 They hung up</span>
      : <span className="chip">✅ Call completed</span>

  const otherCalls = [...calls].reverse().slice(0, 8)

  return (
    <div className="page-enter">
      <div className="main-header row between wrap">
        <div>
          <h1>Call Review</h1>
          <p>{fmtDateTime(call.ts)} · {fmtDuration(call.durationSec)} · vs {character.name}{call.challengeId && call.challengeId !== 'freestyle' && call.challengeId !== 'scenario' ? ` · ${getChallenge(call.challengeId).name}` : ''}</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <select
            className="select" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
            value={call.id}
            onChange={(e) => nav(`/app/review/${e.target.value}`)}
            aria-label="Pick a call to review"
          >
            {otherCalls.map((c) => (
              <option key={c.id} value={c.id}>{getCharacter(c.characterId).name}, {c.overall} ({fmtDateTime(c.ts)})</option>
            ))}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={exportReport}>⬇ Export</button>
        </div>
      </div>

      <Card className="pad" style={{ marginBottom: 16 }}>
        <div className="review-hero">
          <Ring value={call.overall} size={150} stroke={11} sublabel={scoreLabel(call.overall)} />
          <div>
            <div className="row wrap" style={{ gap: 8, marginBottom: 10 }}>
              {outcomeChip}
              <span className="chip gold">+{call.xpEarned || Math.round(40 + call.overall * 0.9)} XP</span>
              <span className="chip">{character.emoji} {character.name}</span>
            </div>
            <h2 style={{ fontSize: 20, marginBottom: 6 }} className="display">
              {report?.insufficient ? 'The mic never heard you, so there\'s nothing to grade.'
                : call.overall >= 80 ? 'Elite work. That was a professional call.'
                : call.overall >= 60 ? 'Solid foundation, a few fixable leaks.'
                : call.outcome === 'hangup' ? 'They hung up. Let\'s find the exact moment it died.'
                : 'Rough one. The tape below shows exactly why.'}
            </h2>
            <p className="sub" style={{ fontSize: 13.5, maxWidth: 560 }}>
              {report
                ? <>{report.goods.length ? `${report.goods.length} strong moves` : 'No standout moves logged'} · {report.mistakes.length} mistakes · {call.fillerWords} filler words · {report.questions} questions asked · {report.objections.survived}/{report.objections.raised} objections survived</>
                : <>{call.fillerWords} filler words · talk ratio {Math.round((call.talkRatio ?? 0.5) * 100)}% · transcript not stored for this archived call</>}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', marginBottom: 16 }}>
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 14 }}>Skill scores</h3>
          <BarRows items={skillItems} />
        </Card>
        <div className="col">
          <Card className="pad">
            <h3 style={{ fontSize: 15.5, marginBottom: 12 }}>Talk-to-listen ratio</h3>
            <TalkRatio ratio={call.talkRatio ?? 0.5} />
          </Card>
          {emotionArc.length > 1 && (
            <Card className="pad">
              <h3 style={{ fontSize: 15.5, marginBottom: 4 }}>Confidence trend</h3>
              <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Turn by turn through the call</p>
              <TrendChart series={[{ name: 'Confidence', data: emotionArc }]} height={150} />
            </Card>
          )}
          <Card className="pad">
            <h3 style={{ fontSize: 15.5, marginBottom: 10 }}>Verbal habits</h3>
            <div className="col" style={{ gap: 8, fontSize: 13 }}>
              <div className="row between"><span className="muted">Filler words</span><b className={call.fillerWords > 8 ? 'score-low' : 'score-good'}>{call.fillerWords}</b></div>
              {report?.fillerBreakdown?.slice(0, 3).map(([w, n]) => (
                <div key={w} className="row between" style={{ paddingLeft: 12 }}><span className="muted">“{w}”</span><span className="mono">×{n}</span></div>
              ))}
              <div className="row between"><span className="muted">Monologues</span><b>{call.interruptions ?? 0}</b></div>
              {report?.wpm ? <div className="row between"><span className="muted">Speaking speed</span><b>{report.wpm} wpm</b></div> : null}
              {report?.repeatedWords?.length ? (
                <div>
                  <span className="muted">Most repeated:</span>{' '}
                  {report.repeatedWords.slice(0, 4).map(([w, n]) => <span key={w} className="chip" style={{ marginRight: 4, marginTop: 4 }}>{w} ×{n}</span>)}
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      {(report?.goods?.length || report?.mistakes?.length) ? (
        <div className="grid grid-2" style={{ marginBottom: 16 }}>
          <Card className="pad">
            <h3 style={{ fontSize: 15.5, marginBottom: 16 }}>✨ Great moments</h3>
            {report.goods.length ? (
              <div className="timeline">
                {report.goods.map((g, i) => (
                  <div key={i} className="timeline-item good"><b>Turn {g.turn}:</b> {g.text}</div>
                ))}
              </div>
            ) : <p className="muted" style={{ fontSize: 13 }}>Nothing landed this call, the drills below will fix that.</p>}
          </Card>
          <Card className="pad">
            <h3 style={{ fontSize: 15.5, marginBottom: 16 }}>⚠️ Mistakes & missed opportunities</h3>
            {report.mistakes.length ? (
              <div className="timeline">
                {report.mistakes.map((m, i) => (
                  <div key={i} className="timeline-item bad">
                    <b>Turn {m.turn}:</b> {m.text}
                    <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--gold-bright)' }}>{BETTER_LINES[i % BETTER_LINES.length]}</div>
                  </div>
                ))}
              </div>
            ) : <p className="muted" style={{ fontSize: 13 }}>Clean call, no logged mistakes.</p>}
          </Card>
        </div>
      ) : null}

      {transcript.length > 0 && (
        <Card className="pad" style={{ marginBottom: 16 }}>
          <div className="row between wrap" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 15.5 }}>🎬 Replay · Transcript</h3>
            <div className="row" style={{ gap: 8 }}>
              {playing
                ? <button className="btn btn-danger btn-sm" onClick={stopReplay}>■ Stop replay</button>
                : <button className="btn btn-gold btn-sm" onClick={startReplay}>▶ Replay call</button>}
            </div>
          </div>
          <div ref={transcriptRef} style={{ maxHeight: 380, overflowY: 'auto' }}>
            {transcript.map((line, i) => (
              <div key={i} className={`transcript-line ${replayIdx === i ? 'hl' : ''}`}>
                <span className={`who ${line.speaker}`}>{line.speaker === 'ai' ? character.name.split(' ')[0] : 'You'}</span>
                <span style={{ flex: 1 }}>
                  {line.text}
                  {line.speaker === 'user' && (
                    <button
                      className="chip" style={{ cursor: 'pointer', marginLeft: 8, fontSize: 10.5 }}
                      onClick={() => setAskLine(line)}
                    >💡 What should I have said?</button>
                  )}
                </span>
                <span className="t mono">{fmtDuration(line.t || 0)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="pad" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15.5, marginBottom: 4 }}>🎙️ Voice analysis</h3>
        <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>Derived from your delivery patterns this call</p>
        <div className="grid grid-4">
          {voiceProfile(report || { scores: call.scores, fillerWords: call.fillerWords, wpm: 0 }).map((v) => (
            <div key={v.k} className="card pad" style={{ background: 'var(--bg-2)', boxShadow: 'none' }}>
              <div className="row between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{v.k}</span>
                <b className={`mono ${scoreClass(v.invert ? 100 - v.v : v.v)}`} style={{ fontSize: 14 }}>{v.v}</b>
              </div>
              <p className="muted" style={{ fontSize: 11.5, lineHeight: 1.5 }}>{v.tip}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="row wrap" style={{ gap: 10 }}>
        <button className="btn btn-gold" onClick={() => nav('/app/simulator', { state: { characterId: call.characterId, challengeId: call.challengeId !== 'freestyle' && call.challengeId !== 'scenario' ? call.challengeId : undefined } })}>
          ↻ Rematch {character.name}
        </button>
        <Link to="/app/coach" className="btn btn-ghost">🧠 Ask the coach about this call</Link>
        <Link to="/app" className="btn btn-dark">Back to dashboard</Link>
      </div>

      <Modal open={!!askLine} onClose={() => { setAskLine(null); stopSpeaking() }}>
        {askLine && (
          <>
            <span className="chip gold" style={{ marginBottom: 12 }}>💡 Coach demonstration</span>
            <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>You said:</p>
            <p style={{ fontSize: 14.5, marginBottom: 16, padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 12 }}>"{askLine.text}"</p>
            <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>A stronger line here:</p>
            {(() => {
              const better = BETTER_LINES[(askLine.text.length + (askLine.t | 0)) % BETTER_LINES.length].replace('Try: ', '')
              return (
                <>
                  <p style={{ fontSize: 15, marginBottom: 18, padding: '12px 14px', background: 'rgba(211,169,78,.1)', border: '1px solid rgba(211,169,78,.3)', borderRadius: 12, color: 'var(--gold-bright)' }}>{better}</p>
                  <div className="row" style={{ gap: 10 }}>
                    <button className="btn btn-gold btn-sm" onClick={() => speak(better.replace(/"/g, ''), { rate: 1 })}>🔊 Hear it delivered</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setAskLine(null); stopSpeaking() }}>Close</button>
                  </div>
                </>
              )
            })()}
          </>
        )}
      </Modal>
    </div>
  )
}

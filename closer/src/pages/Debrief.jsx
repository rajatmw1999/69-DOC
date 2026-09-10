// Meeting Debrief: a Read.ai-style notetaker. Record a real call in the
// browser, or paste/upload a transcript from any notetaker (Notion, Fathom,
// Otter, Fireflies, Zoom), then get the same 15-metric breakdown the simulator
// gives — because the scoring engine works on a transcript, not a character.
import { useMemo, useRef, useState, useEffect } from 'react'
import { useProfile } from '../components/AppShell.jsx'
import { Card, Ring, EmptyState } from '../components/ui.jsx'
import { BarRows, TalkRatio } from '../components/charts.jsx'
import { parseTranscript, guessSeller, debriefReport } from '../lib/meeting.js'
import { saveDebrief, deleteDebrief } from '../lib/storage.js'
import { speechSupport, listenOnce } from '../lib/speech.js'
import { fmtDuration, timeAgo } from '../lib/format.js'

const SKILL_LABELS = {
  confidence: 'Confidence', tonality: 'Tonality', pacing: 'Pacing', energy: 'Energy',
  empathy: 'Empathy', listening: 'Listening', questionQuality: 'Question Quality',
  objectionHandling: 'Objection Handling', closingAbility: 'Closing Ability',
  productKnowledge: 'Product Knowledge', rapport: 'Rapport', control: 'Conversation Control',
  persuasiveness: 'Persuasiveness', authority: 'Authority', professionalism: 'Professionalism',
}
const HUES = ['#c98500', '#3987e5', '#199e70', '#e66767', '#9085e9', '#e87ba4', '#d95926', '#eda100']

const SAMPLE = `Rep: Hi, is this Jordan? This is Alex from Northwind — thanks for grabbing five minutes. I know I caught you cold, so I'll be quick. Can I ask, how are you handling onboarding for new reps right now?
Jordan: Honestly it's a mess. We throw them a slide deck and hope. Why?
Rep: That's exactly what I hear from most VPs I talk to. We help teams like yours cut ramp time about 40% by turning that deck into live practice reps. What would getting new reps productive a month faster be worth to you?
Jordan: I mean, a lot. But we already use a competitor for coaching, and honestly it's expensive.
Rep: Totally fair. A lot of my best clients said the same before we showed them the ramp-time numbers. Out of curiosity, what's the one thing your current tool doesn't do that you wish it did?
Jordan: It doesn't actually let them practice talking. It's all quizzes.
Rep: Right — that's the gap. Ours is live spoken practice with instant scoring. If I could show you that in fifteen minutes, would Thursday or Friday work better?
Jordan: Thursday could work. Send me the invite and I'll take a look.
Rep: Done. I'll send it over now. Appreciate the time, Jordan.`

function uniqueBy(arr, key) {
  const seen = new Set()
  const out = []
  for (const x of arr) { const v = x[key]; if (!seen.has(v)) { seen.add(v); out.push(x) } }
  return out
}

function DebriefResult({ result, title }) {
  const { report, transcript, meta } = result
  const items = Object.entries(SKILL_LABELS).map(([k, label], i) => ({ label, value: report.scores[k], color: HUES[i % HUES.length] }))
  const goods = uniqueBy(report.goods, 'text')
  const mistakes = uniqueBy(report.mistakes, 'text')
  const outcomeChip = report.outcome === 'closed'
    ? <span className="chip good">🏆 Moved to next step</span>
    : report.outcome === 'hangup' ? <span className="chip crit">📵 Ended cold</span>
      : <span className="chip">✅ Wrapped up</span>

  return (
    <div className="col" style={{ gap: 16 }}>
      {meta.singleSpeaker && (
        <div className="arena-banner" style={{ marginBottom: 0 }}>
          <span>ℹ️</span>
          <div><b>Single-track transcript.</b> Only one speaker was detected, so this scores your delivery (clarity,
            pace, questions, confidence). Add the other person's lines with a <code>Name:</code> label to unlock
            listening, talk-ratio and objection-handling scores.</div>
        </div>
      )}
      <div className="grid" style={{ gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>
        <Card className="pad" style={{ textAlign: 'center' }}>
          <Ring value={report.overall} size={132} label={`${report.overall}`} sublabel="overall" />
          <div style={{ marginTop: 12 }}>{outcomeChip}</div>
          <div className="row" style={{ justifyContent: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <span className="chip">⏱ {fmtDuration(meta.durationSec)}</span>
            <span className="chip">🗣 {report.questions} questions</span>
            {report.wpm > 0 && <span className="chip">{report.wpm} wpm</span>}
            <span className="chip">🙊 {report.fillerWords} fillers</span>
          </div>
          {!meta.singleSpeaker && (
            <div style={{ marginTop: 16 }}>
              <div className="muted" style={{ fontSize: 11.5, marginBottom: 6, textAlign: 'left' }}>Talk ratio (you vs them)</div>
              <TalkRatio ratio={report.talkRatio} />
            </div>
          )}
        </Card>
        <Card className="pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 12 }}>The 15 dimensions</h3>
          <BarRows items={items} />
        </Card>
      </div>

      <div className="grid grid-2">
        <Card className="pad">
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>✅ What worked</h3>
          {goods.length ? (
            <div className="col" style={{ gap: 8 }}>
              {goods.slice(0, 6).map((g, i) => (
                <div key={i} className="row" style={{ gap: 8, fontSize: 13 }}><span>▸</span><span>{g.text}</span></div>
              ))}
            </div>
          ) : <p className="muted" style={{ fontSize: 13 }}>No standout wins flagged — aim for one open question and one clear value statement next time.</p>}
        </Card>
        <Card className="pad">
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>🎯 What to fix</h3>
          {mistakes.length ? (
            <div className="col" style={{ gap: 8 }}>
              {mistakes.slice(0, 6).map((m, i) => (
                <div key={i} className="row" style={{ gap: 8, fontSize: 13 }}><span>▸</span><span>{m.text}</span></div>
              ))}
            </div>
          ) : <p className="muted" style={{ fontSize: 13 }}>Clean run — no recurring mistakes detected in the transcript.</p>}
        </Card>
      </div>

      {meta.objectionsRaised > 0 && (
        <Card className="pad">
          <div className="row between">
            <h3 style={{ fontSize: 15 }}>🛡 Objection handling</h3>
            <span className="chip gold">{report.objections.survived}/{report.objections.raised} handled</span>
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
            The other side pushed back {report.objections.raised} time{report.objections.raised > 1 ? 's' : ''}; you
            answered {report.objections.survived} with value, a question, or empathy.
          </p>
        </Card>
      )}

      <Card className="pad">
        <h3 style={{ fontSize: 15, marginBottom: 10 }}>📄 Transcript</h3>
        <div className="debrief-transcript">
          {transcript.map((t, i) => (
            <div key={i} className={`dt-line ${t.speaker === 'user' ? 'me' : ''}`}>
              <span className="dt-who">{t.speaker === 'user' ? 'You' : 'Them'}</span>
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function Debrief() {
  const profile = useProfile()
  const [stage, setStage] = useState('capture')   // capture | result
  const [tab, setTab] = useState('upload')         // upload | record
  const [text, setText] = useState('')
  const [meLabel, setMeLabel] = useState(null)
  const [result, setResult] = useState(null)
  const [title, setTitle] = useState('')
  const [saved, setSaved] = useState(false)

  // recording
  const [recording, setRecording] = useState(false)
  const [recSeconds, setRecSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const mrRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const listenRef = useRef(null)
  const recTextRef = useRef('')
  const recActiveRef = useRef(false)
  const timerRef = useRef(null)

  const parsed = useMemo(() => parseTranscript(text), [text])
  useEffect(() => {
    if (parsed.speakers.length && (!meLabel || !parsed.speakers.includes(meLabel))) {
      setMeLabel(guessSeller(parsed.turns, parsed.speakers))
    }
    if (!parsed.speakers.length) setMeLabel(null)
  }, [parsed]) // eslint-disable-line react-hooks/exhaustive-deps

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const ready = wordCount >= 8 && (parsed.speakers.length <= 1 || meLabel)

  useEffect(() => () => stopEverything(), []) // cleanup on unmount
  const stopEverything = () => {
    recActiveRef.current = false
    clearInterval(timerRef.current)
    listenRef.current?.stop()
    try { mrRef.current?.state === 'recording' && mrRef.current.stop() } catch { /* noop */ }
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }

  const listenLoop = async () => {
    while (recActiveRef.current) {
      try {
        listenRef.current = listenOnce({ onInterim: (t) => setText((recTextRef.current + ' ' + t).trim()) })
        const res = await listenRef.current.promise
        if (res.text) { recTextRef.current = (recTextRef.current + ' ' + res.text).trim(); setText(recTextRef.current) }
      } catch (e) {
        if (!recActiveRef.current) break
        if (/not-allowed|service-not-allowed|audio-capture/.test(e?.message || '')) break
        await new Promise((r) => setTimeout(r, 250))
      }
    }
  }

  const startRecording = async () => {
    setAudioUrl(null); recTextRef.current = text.trim(); chunksRef.current = []
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      alert('Microphone access is needed to record. You can also paste a transcript instead.')
      return
    }
    streamRef.current = stream
    try {
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        if (chunksRef.current.length) {
          const blob = new Blob(chunksRef.current, { type: chunksRef.current[0].type || 'audio/webm' })
          setAudioUrl(URL.createObjectURL(blob))
        }
      }
      mr.start()
      mrRef.current = mr
    } catch { /* MediaRecorder unsupported — transcript still works */ }
    recActiveRef.current = true
    setRecording(true); setRecSeconds(0)
    timerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000)
    if (speechSupport.recognition) listenLoop()
  }

  const stopRecording = () => {
    recActiveRef.current = false
    setRecording(false)
    clearInterval(timerRef.current)
    listenRef.current?.stop()
    try { mrRef.current?.state === 'recording' && mrRef.current.stop() } catch { /* noop */ }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setText(recTextRef.current)
  }

  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setText(String(reader.result || '')); setTitle(file.name.replace(/\.[^.]+$/, '')); setTab('upload') }
    reader.readAsText(file)
  }

  const analyze = () => {
    const r = debriefReport({
      turns: parsed.turns, meLabel,
      durationSec: (tab === 'record' && recSeconds) ? recSeconds : undefined,
    })
    setResult(r); setSaved(false); setStage('result')
  }

  const save = () => {
    const d = {
      id: `debrief-${Date.now()}`, ts: Date.now(),
      title: title.trim() || `Meeting debrief · ${new Date().toLocaleDateString()}`,
      source: result.meta.singleSpeaker ? 'recording' : tab,
      report: result.report, transcript: result.transcript, meta: result.meta,
    }
    saveDebrief(d); setSaved(true)
  }

  const reset = () => { stopEverything(); setStage('capture'); setResult(null); setText(''); setTitle(''); setAudioUrl(null); setRecSeconds(0); setSaved(false) }

  const openSaved = (d) => { setResult({ report: d.report, transcript: d.transcript, meta: d.meta }); setTitle(d.title); setStage('result') }

  const debriefs = profile.debriefs || []

  /* ── Result view ───────────────────────────────────────── */
  if (stage === 'result' && result) {
    return (
      <div className="page-enter" style={{ maxWidth: 980, margin: '0 auto' }}>
        <div className="main-header row between wrap">
          <div>
            <h1>Debrief</h1>
            <p>Your real meeting, graded on the same 15 dimensions as a simulator call.</p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={reset}>＋ New debrief</button>
            <button className="btn btn-gold btn-sm" onClick={save} disabled={saved}>{saved ? '✓ Saved' : '💾 Save debrief'}</button>
          </div>
        </div>
        <input
          className="input" style={{ marginBottom: 16, maxWidth: 420 }} value={title}
          onChange={(e) => setTitle(e.target.value)} placeholder="Name this meeting (e.g. Acme discovery call)"
          aria-label="Debrief title"
        />
        <DebriefResult result={result} title={title} />
      </div>
    )
  }

  /* ── Capture view ──────────────────────────────────────── */
  return (
    <div className="page-enter" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="main-header">
        <h1>Meeting Debrief 📝</h1>
        <p>Record a real call, or drop in a transcript from your notetaker — get the full breakdown of how you did.</p>
      </div>

      <div className="arena-banner">
        <span>🔒</span>
        <div><b>Everything stays in your browser.</b> Recording and analysis happen on-device — no audio is uploaded.
          Always tell the other person before you record a call; two-party-consent laws apply.</div>
      </div>

      <Card className="pad" style={{ marginBottom: 16 }}>
        <div className="debrief-tabs">
          <button className={`debrief-tab ${tab === 'upload' ? 'on' : ''}`} onClick={() => setTab('upload')}>📄 Paste / upload transcript</button>
          <button className={`debrief-tab ${tab === 'record' ? 'on' : ''}`} onClick={() => setTab('record')}>🔴 Record live</button>
        </div>

        {tab === 'upload' ? (
          <div className="col" style={{ gap: 12 }}>
            <p className="muted" style={{ fontSize: 12.5 }}>
              Works with exports from Notion, Fathom, Otter, Fireflies, Zoom (.vtt/.srt) or any
              <code> Name: text </code> transcript. Label at least two speakers to score both sides.
            </p>
            <textarea
              className="textarea" style={{ minHeight: 200, fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
              placeholder={'Paste your transcript here…\n\nRep: Hi Jordan, thanks for the time…\nJordan: Sure, what\'s this about?'}
              value={text} onChange={(e) => setText(e.target.value)}
            />
            <div className="row wrap" style={{ gap: 8 }}>
              <label className="btn btn-dark btn-sm" style={{ cursor: 'pointer' }}>
                📎 Upload file
                <input type="file" accept=".txt,.vtt,.srt,.md,.csv" onChange={onFile} style={{ display: 'none' }} />
              </label>
              <button className="btn btn-ghost btn-sm" onClick={() => { setText(SAMPLE); setTitle('Sample discovery call') }}>Load a sample</button>
              {text && <button className="btn btn-ghost btn-sm" onClick={() => setText('')}>Clear</button>}
            </div>
          </div>
        ) : (
          <div className="col" style={{ gap: 12 }}>
            <div className="debrief-recorder">
              <div className={`rec-orb ${recording ? 'on' : ''}`}>{recording ? '●' : '🎙️'}</div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 14.5 }}>{recording ? 'Recording…' : 'Record this call'}</b>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  {recording ? `${fmtDuration(recSeconds)} · live transcript building below`
                    : speechSupport.recognition ? 'Captures audio + a live transcript from your mic. Put the call on speaker so it hears both sides.'
                      : 'Your browser can\'t transcribe live — paste a transcript instead.'}
                </div>
              </div>
              {!recording
                ? <button className="btn btn-gold" onClick={startRecording} disabled={!speechSupport.recognition && !navigator.mediaDevices}>● Start recording</button>
                : <button className="btn btn-danger" onClick={stopRecording}>■ Stop</button>}
            </div>
            {(text || recording) && (
              <textarea
                className="textarea" style={{ minHeight: 150, fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
                placeholder="Live transcript will appear here… you can edit it and add speaker labels before analyzing."
                value={text} onChange={(e) => setText(e.target.value)}
              />
            )}
            {audioUrl && (
              <div className="row" style={{ gap: 10 }}>
                <audio src={audioUrl} controls style={{ height: 34 }} />
                <a className="btn btn-dark btn-sm" href={audioUrl} download={`${(title || 'meeting').replace(/\s+/g, '-')}.webm`}>⬇ Save audio</a>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Speaker assignment */}
      {parsed.speakers.length > 1 && (
        <Card className="pad" style={{ marginBottom: 16 }}>
          <div className="row between wrap" style={{ marginBottom: 8 }}>
            <h3 style={{ fontSize: 14.5 }}>Which speaker are you?</h3>
            <span className="muted" style={{ fontSize: 12 }}>{parsed.turns.length} turns · {parsed.speakers.length} speakers detected</span>
          </div>
          <div className="row wrap" style={{ gap: 8 }}>
            {parsed.speakers.map((s) => (
              <button key={s} className={`chip ${meLabel === s ? 'gold' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setMeLabel(s)}>
                {meLabel === s ? '✓ ' : ''}{s}
              </button>
            ))}
          </div>
        </Card>
      )}

      <button className="btn btn-gold btn-lg btn-block" onClick={analyze} disabled={!ready}>
        {ready ? '📊 Analyze my performance' : wordCount < 8 ? 'Add a transcript to analyze' : 'Pick which speaker is you'}
      </button>

      {/* Past debriefs */}
      {debriefs.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Past debriefs</h3>
          <div className="col" style={{ gap: 10 }}>
            {debriefs.map((d) => (
              <Card key={d.id} className="pad card-hover" style={{ cursor: 'pointer' }}>
                <div className="row between" onClick={() => openSaved(d)}>
                  <div className="row" style={{ gap: 12 }}>
                    <Ring value={d.report.overall} size={44} stroke={4} />
                    <div>
                      <b style={{ fontSize: 14 }}>{d.title}</b>
                      <div className="muted" style={{ fontSize: 12 }}>{d.source === 'recording' ? '🎙 Recorded' : '📄 Transcript'} · {timeAgo(d.ts)} · {fmtDuration(d.meta?.durationSec || 0)}</div>
                    </div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="chip">{d.report.questions} Q · {d.report.fillerWords} fillers</span>
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); deleteDebrief(d.id) }}>Delete</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {debriefs.length === 0 && (
        <div style={{ marginTop: 24 }}>
          <EmptyState icon="📝" title="No debriefs yet" sub="Analyze your first real meeting above — it lands here so you can track real calls next to your simulator reps." />
        </div>
      )}
    </div>
  )
}

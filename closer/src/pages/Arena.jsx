// Live Arena: an actual face-to-face video call on the platform. Your real
// camera goes live in one tile, the peer in the other; you pitch out loud and
// they rate you. (Peers are simulated so it runs offline — swap in a WebRTC
// presence server to match real strangers; the call UI stays identical.)
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '../components/ui.jsx'
import { LIVE_PEERS, PEER_REVIEWS } from '../data/arena.js'
import { analyzeUtterance } from '../lib/conversation.js'
import { updateProfile } from '../lib/storage.js'
import { speechSupport, listenOnce } from '../lib/speech.js'

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// Rate a pitch from its content — the same signals the call scorer uses.
function ratePitch(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const a = analyzeUtterance(text || '')
  let score = 42
  if (a.openQuestion) score += 14
  else if (a.isQuestion) score += 8
  if (a.intents.has('valueProp')) score += 12
  if (a.intents.has('social')) score += 8
  if (a.intents.has('empathy')) score += 8
  if (a.intents.has('close')) score += 12
  if (a.echo && /\d/.test(a.echo)) score += 6
  if (a.fillers >= 3) score -= 12
  else if (a.fillers >= 1) score -= 5
  if (words < 12) score -= 14
  if (words > 90) score -= 10
  if (words >= 25 && words <= 70) score += 6
  score = Math.max(8, Math.min(98, score))
  const tier = score >= 82 ? 'great' : score >= 65 ? 'good' : score >= 45 ? 'mid' : 'weak'
  return { score, stars: Math.max(1, Math.round(score / 20)), review: pick(PEER_REVIEWS[tier]), tier, words }
}

function fmt(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

export default function Arena() {
  const [peer, setPeer] = useState(null)
  const [stage, setStage] = useState('lobby')   // lobby | connecting | live | rated
  const [seconds, setSeconds] = useState(0)
  const [camOn, setCamOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [camError, setCamError] = useState(false)
  const [caption, setCaption] = useState('')
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState(null)
  const [peerSpeaking, setPeerSpeaking] = useState(true)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const listenRef = useRef(null)
  const transcriptRef = useRef('')
  const endedRef = useRef(false)

  const onlineCount = useMemo(() => 40 + Math.floor(Math.random() * 60), [])

  // Timer while live
  useEffect(() => {
    if (stage !== 'live') return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [stage])

  // The peer alternates between "speaking" and "listening" so the tile feels alive.
  useEffect(() => {
    if (stage !== 'live') return
    const t = setInterval(() => setPeerSpeaking((p) => !p), 2600)
    return () => clearInterval(t)
  }, [stage])

  const cleanup = () => {
    endedRef.current = true
    listenRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }
  useEffect(() => () => cleanup(), [])

  // Continuously capture what you say and accumulate the transcript.
  const listenLoop = async () => {
    while (!endedRef.current && stage !== 'rated') {
      try {
        listenRef.current = listenOnce({ onInterim: (t) => setCaption(t) })
        const res = await listenRef.current.promise
        if (res.text) { transcriptRef.current += ' ' + res.text; setCaption('') }
      } catch (e) {
        if (endedRef.current) break
        if (/not-allowed|service-not-allowed|audio-capture/.test(e?.message || '')) break
        await new Promise((r) => setTimeout(r, 300))
      }
    }
  }

  const joinCall = async (p) => {
    setPeer(p); setResult(null); setStage('connecting')
    setSeconds(0); setCamOn(true); setMicOn(true); setCamError(false)
    setCaption(''); setTyped(''); transcriptRef.current = ''; endedRef.current = false
    let stream = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    } catch {
      // Try audio-only, then fall back to no media (typed pitch).
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); setCamError(true) }
      catch { setCamError(true) }
    }
    streamRef.current = stream
    // brief "connecting" beat for realism
    setTimeout(() => {
      if (endedRef.current) return
      setStage('live')
      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play?.().catch(() => {})
      }
      if (speechSupport.recognition) listenLoop()
    }, 1300)
  }

  const toggleCam = () => {
    const track = streamRef.current?.getVideoTracks?.()[0]
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled) }
  }
  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks?.()[0]
    if (track) track.enabled = !track.enabled
    setMicOn((m) => !m)
  }

  const endCall = () => {
    cleanup()
    const text = (transcriptRef.current + ' ' + typed).trim()
    const r = ratePitch(text)
    setResult(r)
    setStage('rated')
    updateProfile((prof) => {
      prof.xp += 30 + r.score
      prof.arena = prof.arena || { pitches: 0, best: 0 }
      prof.arena.pitches += 1
      prof.arena.best = Math.max(prof.arena.best, r.score)
    })
  }

  const backToLobby = () => { cleanup(); setPeer(null); setResult(null); setStage('lobby'); if (videoRef.current) videoRef.current.srcObject = null }

  /* ── Lobby ─────────────────────────────────────────────── */
  if (stage === 'lobby') {
    return (
      <div className="page-enter">
        <div className="main-header row between wrap">
          <div>
            <h1>Live Arena 🎥</h1>
            <p>Jump on a face-to-face video call with someone on the platform, pitch them live, get rated.</p>
          </div>
          <span className="chip good">● {onlineCount} online now</span>
        </div>

        <div className="arena-banner">
          <span>🎥</span>
          <div>
            <b>Real camera. Real reps.</b> Your webcam goes live and you pitch face-to-face, just like a real
            video sales call. <span className="muted">(Peers are simulated in this build so it runs instantly and offline — connect a WebRTC presence server to match real people; the call screen is identical.)</span>
          </div>
        </div>

        <h3 className="arena-h">Who's online</h3>
        <div className="arena-grid">
          {LIVE_PEERS.map((p) => (
            <Card key={p.id} className="pad arena-peer card-hover">
              <div className="row" style={{ gap: 12 }}>
                <span className="arena-avatar">{p.avatar}<i className="arena-live" /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 14.5 }}>{p.name}</b>
                  <div className="muted" style={{ fontSize: 12 }}>{p.role}</div>
                </div>
                <span className="chip">★ {p.rating}</span>
              </div>
              <div className="arena-wants">“{p.wants}”</div>
              <div className="row between">
                <span className="chip gold" style={{ fontSize: 11 }}>{p.mood}</span>
                <button className="btn btn-gold btn-sm" onClick={() => joinCall(p)}>📹 Join call →</button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  /* ── In-call (connecting / live / rated) ───────────────── */
  return (
    <div className="page-enter">
      <div className="vc-stage">
        {/* Peer tile (big) */}
        <div className={`vc-peer ${peerSpeaking && stage === 'live' ? 'speaking' : ''}`}>
          <div className="vc-peer-avatar">{peer?.avatar}</div>
          <div className="vc-nameplate">
            <span className="vc-livedot" /> {peer?.name}
            <span className="vc-role">{peer?.role}</span>
          </div>
          {stage === 'connecting' && <div className="vc-connecting"><div className="arena-radar"><span /><span /><span /></div>Connecting…</div>}
          {stage === 'live' && <div className="vc-ask">🎯 {peer?.wants}</div>}
          <span className="vc-tag">AI peer · simulated</span>

          {/* Your self-view (picture-in-picture) */}
          <div className="vc-self">
            {!camError && <video ref={videoRef} muted playsInline autoPlay className={camOn ? '' : 'off'} />}
            {(camError || !camOn) && (
              <div className="vc-self-off"><span>{camError ? '📷🚫' : '📷'}</span><small>{camError ? 'No camera' : 'Camera off'}</small></div>
            )}
            <span className="vc-self-label">You</span>
          </div>

          {stage === 'live' && (caption || (!speechSupport.recognition)) && (
            <div className="vc-caption">
              {caption ? <><span className="speaker">You</span>{caption}</> : <span className="muted">Speak your pitch out loud — or type it below.</span>}
            </div>
          )}

          {stage === 'live' && <div className="vc-timer">{fmt(seconds)}</div>}
        </div>

        {/* Rated overlay */}
        {stage === 'rated' && result && (
          <div className="vc-result anim-scale">
            <span className="arena-avatar lg">{peer?.avatar}</span>
            <div style={{ fontSize: 26, letterSpacing: 3 }}>
              {'★'.repeat(result.stars)}<span style={{ opacity: .25 }}>{'★'.repeat(5 - result.stars)}</span>
            </div>
            <div className="display" style={{ fontSize: 34 }}>{result.score}<span className="muted" style={{ fontSize: 15 }}> / 100</span></div>
            <div className="arena-review">“{result.review}”<div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>— {peer?.name} · {fmt(seconds)} on the call</div></div>
            {result.words < 12 && <p className="muted" style={{ fontSize: 12 }}>Barely heard you — next time speak up or type your pitch so they can judge it.</p>}
            <div className="chip gold">+{30 + result.score} XP</div>
            <div className="row" style={{ gap: 8, marginTop: 4 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => joinCall(peer)}>🔁 Call again</button>
              <button className="btn btn-gold btn-sm" onClick={backToLobby}>← Back to lobby</button>
            </div>
          </div>
        )}

        {/* Controls */}
        {stage !== 'rated' && (
          <div className="vc-controls">
            <button className={`vc-ctl ${!micOn ? 'off' : ''}`} onClick={toggleMic} disabled={stage !== 'live'} aria-label="Mute">
              {micOn ? '🎙️' : '🔇'}<span>{micOn ? 'Mute' : 'Unmute'}</span>
            </button>
            <button className={`vc-ctl ${!camOn ? 'off' : ''}`} onClick={toggleCam} disabled={stage !== 'live' || camError} aria-label="Camera">
              {camOn ? '📹' : '📷'}<span>{camOn ? 'Camera' : 'Off'}</span>
            </button>
            <button className="vc-ctl end" onClick={stage === 'live' ? endCall : backToLobby} aria-label="End call">
              📞<span>{stage === 'live' ? 'End & rate' : 'Leave'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Typed fallback when no speech recognition */}
      {stage === 'live' && !speechSupport.recognition && (
        <div style={{ maxWidth: 720, margin: '14px auto 0' }}>
          <textarea className="textarea" placeholder="Type your pitch here, then hit End & rate…" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </div>
      )}
    </div>
  )
}

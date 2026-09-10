// Settings: voice, coach, notifications, mic calibration, account.
import { useState } from 'react'
import { useProfile } from '../components/AppShell.jsx'
import { Card, Toggle } from '../components/ui.jsx'
import { updateProfile, resetProfile } from '../lib/storage.js'
import { speechSupport, speak, pickVoice, speakAs } from '../lib/speech.js'
import { useTheme } from '../lib/theme.js'

export default function Settings() {
  const profile = useProfile()
  const s = profile.settings
  const { theme, setTheme } = useTheme()
  const [testing, setTesting] = useState(false)
  const [micLevel, setMicLevel] = useState(null)

  const set = (key, value) => updateProfile((p) => { p.settings[key] = value })

  const testVoice = () => {
    setTesting(true)
    const v = pickVoice({ accent: s.accent })
    speak('This is your training voice. Clear, confident, and ready to push back.', { rate: s.voiceRate, voice: v })
      .promise.then(() => setTesting(false))
  }

  const calibrateMic = async () => {
    setMicLevel('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      src.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      let peak = 0
      const t0 = Date.now()
      const tick = () => {
        analyser.getByteFrequencyData(data)
        peak = Math.max(peak, data.reduce((a, b) => a + b, 0) / data.length)
        if (Date.now() - t0 < 2500) requestAnimationFrame(tick)
        else {
          stream.getTracks().forEach((t) => t.stop())
          ctx.close()
          setMicLevel(peak > 18 ? 'good' : peak > 6 ? 'low' : 'silent')
        }
      }
      tick()
    } catch {
      setMicLevel('denied')
    }
  }

  return (
    <div className="page-enter" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="main-header">
        <h1>Settings</h1>
        <p>Tune the training experience to your voice and rhythm.</p>
      </div>

      <Card className="pad" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15.5, marginBottom: 4 }}>🎙️ Voice & audio</h3>
        <div className="settings-row">
          <div><b>AI voice accent</b><small>Applied to characters without a fixed accent</small></div>
          <select className="select" style={{ width: 180 }} value={s.accent} onChange={(e) => set('accent', e.target.value)}>
            <option value="us">🇺🇸 US English</option>
            <option value="uk">🇬🇧 UK English</option>
            <option value="au">🇦🇺 Australian</option>
            <option value="in">🇮🇳 Indian English</option>
            <option value="neutral">🌍 Neutral international</option>
          </select>
        </div>
        <div className="settings-row">
          <div><b>Voice speed · {s.voiceRate.toFixed(1)}×</b><small>How fast AI characters speak</small></div>
          <div style={{ width: 180 }}>
            <input type="range" min="0.7" max="1.4" step="0.1" value={s.voiceRate} onChange={(e) => set('voiceRate', Number(e.target.value))} />
          </div>
        </div>
        <div className="settings-row">
          <div><b>Test voice output</b><small>{speechSupport.synthesis ? 'Browser speech synthesis available' : 'Speech synthesis not supported in this browser'}</small></div>
          <button className="btn btn-ghost btn-sm" onClick={testVoice} disabled={testing}>{testing ? '🔊 Playing…' : '▶ Test voice'}</button>
        </div>
        <div className="settings-row" style={{ borderBottom: 'none' }}>
          <div>
            <b>Microphone calibration</b>
            <small>
              {micLevel === 'requesting' ? 'Speak normally for 2 seconds…'
                : micLevel === 'good' ? '✓ Strong signal, you\'re call-ready'
                : micLevel === 'low' ? '⚠ Weak signal, move closer to the mic'
                : micLevel === 'silent' ? '⚠ No signal detected, check input device'
                : micLevel === 'denied' ? '✕ Mic access denied, allow it in browser settings'
                : speechSupport.recognition ? 'Speech recognition available' : 'Speech recognition unsupported, type-to-talk will be used'}
            </small>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={calibrateMic} disabled={micLevel === 'requesting'}>🎚 Calibrate</button>
        </div>
        <div className="settings-row">
          <div><b>Speech sensitivity · {Math.round(s.speechSensitivity * 100)}%</b><small>How eagerly the AI treats a pause as end-of-turn</small></div>
          <div style={{ width: 180 }}>
            <input type="range" min="0.1" max="1" step="0.1" value={s.speechSensitivity} onChange={(e) => set('speechSensitivity', Number(e.target.value))} />
          </div>
        </div>
        <div className="settings-row">
          <div style={{ maxWidth: 360 }}>
            <b>Character voices</b>
            <small>On by default — characters speak out loud using your browser's best voice, with captions alongside. For genuinely human voices add a studio key below. Turn this off to train silently on captions only.</small>
          </div>
          <Toggle checked={!s.muteVoice} onChange={(v) => set('muteVoice', !v)} label="Character voices" />
        </div>
        <div className="settings-row" style={{ borderBottom: 'none', alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 340 }}>
            <b>Premium AI voices {s.elevenLabsKey ? <span className="chip good" style={{ marginLeft: 6 }}>active</span> : <span className="chip" style={{ marginLeft: 6 }}>optional</span>}</b>
            <small>
              Paste an <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>ElevenLabs</a> API
              key and every character speaks with a distinct, human-sounding studio voice tuned to their persona.
              The key is stored only in this browser. Without it, Closer uses your browser's built-in voices.
            </small>
          </div>
          <div className="col" style={{ gap: 8, width: 220 }}>
            <input
              type="password" className="input" placeholder="xi-api-key…"
              value={s.elevenLabsKey || ''} onChange={(e) => set('elevenLabsKey', e.target.value.trim())}
              aria-label="ElevenLabs API key"
            />
            <button
              className="btn btn-ghost btn-sm"
              disabled={!s.elevenLabsKey || testing}
              onClick={() => {
                setTesting(true)
                speakAs(
                  'Listen, this is what your training calls sound like from now on. You following me?',
                  { id: 'jordan-belfort', speakingSpeed: 1.1, voice: { eleven: 'pNInz6obpgDQGcFmaJgB', gender: 'male', accent: 'us', pitch: 1.05 } },
                  s,
                ).promise.finally(() => setTesting(false))
              }}
            >{testing ? '🔊 Playing…' : '▶ Test premium voice'}</button>
          </div>
        </div>
      </Card>

      <Card className="pad" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15.5, marginBottom: 4 }}>🧠 Live AI conversations {s.llmKey ? <span className="chip good" style={{ marginLeft: 6 }}>on</span> : <span className="chip" style={{ marginLeft: 6 }}>optional</span>}</h3>
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 6 }}>
          Add an OpenAI-compatible key and characters reply with a live model that actually adapts to what you
          say (instead of the built-in script). Scoring still runs locally. The key stays in this browser.
        </p>
        <div className="settings-row">
          <div><b>API key</b><small>OpenAI or any compatible endpoint</small></div>
          <input type="password" className="input" style={{ width: 220 }} placeholder="sk-…" value={s.llmKey || ''} onChange={(e) => set('llmKey', e.target.value.trim())} aria-label="LLM API key" />
        </div>
        <div className="settings-row">
          <div><b>Model</b></div>
          <input className="input" style={{ width: 220 }} value={s.llmModel || ''} onChange={(e) => set('llmModel', e.target.value.trim())} placeholder="gpt-4o-mini" />
        </div>
        <div className="settings-row" style={{ borderBottom: 'none' }}>
          <div><b>API base URL</b><small>Change for Azure, OpenRouter, local models, etc.</small></div>
          <input className="input" style={{ width: 220 }} value={s.llmBase || ''} onChange={(e) => set('llmBase', e.target.value.trim())} placeholder="https://api.openai.com/v1" />
        </div>
      </Card>

      <Card className="pad" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15.5, marginBottom: 4 }}>🎧 Coaching</h3>
        <div className="settings-row">
          <div><b>Whisper coach</b><small>Live suggestions during calls, quietly, in the pauses</small></div>
          <Toggle checked={s.whisperCoach} onChange={(v) => set('whisperCoach', v)} label="Whisper coach" />
        </div>
        <div className="settings-row" style={{ borderBottom: 'none' }}>
          <div><b>Daily reminder</b><small>A nudge to keep the streak alive</small></div>
          <div className="row" style={{ gap: 10 }}>
            <input type="time" className="input" style={{ width: 110 }} value={s.dailyReminder} onChange={(e) => set('dailyReminder', e.target.value)} />
            <Toggle checked={s.notifications} onChange={(v) => set('notifications', v)} label="Notifications" />
          </div>
        </div>
      </Card>

      <Card className="pad" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15.5, marginBottom: 4 }}>🌐 Preferences</h3>
        <div className="settings-row">
          <div><b>Language</b><small>Interface & recognition language</small></div>
          <select className="select" style={{ width: 180 }} value={s.language} onChange={(e) => set('language', e.target.value)}>
            <option value="en">English</option>
            <option value="es">Español (soon)</option>
            <option value="de">Deutsch (soon)</option>
            <option value="hi">हिन्दी (soon)</option>
          </select>
        </div>
        <div className="settings-row" style={{ borderBottom: 'none' }}>
          <div><b>Theme</b><small>Deep warm brown, or a light gold-on-cream mode</small></div>
          <div className="row" style={{ gap: 8 }}>
            <button className={`btn btn-sm ${theme === 'dark' ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setTheme('dark')}>🌙 Dark</button>
            <button className={`btn btn-sm ${theme === 'light' ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setTheme('light')}>☀️ Light</button>
          </div>
        </div>
      </Card>

      <Card className="pad">
        <h3 style={{ fontSize: 15.5, marginBottom: 4 }}>👤 Account</h3>
        <div className="settings-row">
          <div><b>Display name</b></div>
          <input className="input" style={{ width: 220 }} value={profile.user.name} onChange={(e) => updateProfile((p) => { p.user.name = e.target.value })} />
        </div>
        <div className="settings-row">
          <div><b>Plan</b><small>Premium, unlimited calls & full analytics</small></div>
          <span className="chip gold">★ Premium</span>
        </div>
        <div className="settings-row" style={{ borderBottom: 'none' }}>
          <div><b>Reset training data</b><small>Wipes calls, XP, streaks and academy progress on this device</small></div>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => { if (window.confirm('Reset all local training data? This cannot be undone.')) resetProfile() }}
          >Reset</button>
        </div>
      </Card>
    </div>
  )
}

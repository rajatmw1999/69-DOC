// Web Speech wrappers: browser TTS + speech recognition with graceful fallback,
// plus an optional ElevenLabs path for studio-quality character voices.
import { personaVoiceTuning } from './personas.js'

const SR = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null

export const speechSupport = {
  recognition: Boolean(SR),
  synthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
}

let voicesCache = []
function loadVoices() {
  if (!speechSupport.synthesis) return []
  voicesCache = window.speechSynthesis.getVoices()
  return voicesCache
}
if (speechSupport.synthesis) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

/** Voices load asynchronously in Chrome, wait (briefly) before the first line
 *  so the opener doesn't play on the default voice and then switch mid-call. */
export function voicesReady(timeoutMs = 1500) {
  if (!speechSupport.synthesis) return Promise.resolve([])
  if (voicesCache.length) return Promise.resolve(voicesCache)
  return new Promise((resolve) => {
    const t0 = Date.now()
    const poll = () => {
      loadVoices()
      if (voicesCache.length || Date.now() - t0 > timeoutMs) resolve(voicesCache)
      else setTimeout(poll, 100)
    }
    poll()
  })
}

const ACCENT_LANGS = {
  us: ['en-US'], uk: ['en-GB'], au: ['en-AU'], in: ['en-IN'], neutral: ['en-US', 'en-GB', 'en'],
}

const FEMALE_RX = /female|samantha|victoria|karen|moira|tessa|fiona|zira|susan|hazel|veena|serena|kate|allison|ava|joanna|salli|aria|jenny|michelle|sonia|libby|natasha|neerja|catherine|emma|amy/i
const MALE_RX = /(?<!fe)male|daniel|alex\b|fred|tom\b|oliver|david|mark|james|rishi|lee\b|gordon|guy|ryan|brandon|eric|christopher|matthew|prabhat|william|liam|george/i

// macOS ships dozens of novelty/compact voices (Fred, Zarvox, Bubbles…) that
// sound absurd or broken on a business call. Never pick them.
const NOVELTY_RX = /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|jester|hysterical|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|grandma|grandpa|rocko|shelle|eddy|flo\b|reed|sandy/i

/** Rank voices by quality + fit. Higher is better. */
function scoreVoice(v, { gender, accent }) {
  let s = 0
  const langs = ACCENT_LANGS[accent] || ACCENT_LANGS.us
  // Accent is a hard preference: a US character must not get an en-IN or
  // en-GB voice just because it's male. Wrong-region English is a big penalty
  // (still usable as last resort when the browser has nothing matching).
  if (langs.some((l) => v.lang === l || v.lang.startsWith(l))) s += 10
  else if (v.lang.startsWith('en')) s -= 6
  else return -100
  if (NOVELTY_RX.test(v.name)) s -= 25
  // Quality tiers: cloud/neural voices sound far less robotic
  if (/natural|neural/i.test(v.name)) s += 6
  if (/google/i.test(v.name)) s += 5
  if (/online/i.test(v.name)) s += 2
  if (/microsoft/i.test(v.name)) s += 1
  if (/espeak|robosoft|festival/i.test(v.name)) s -= 8 // classic robot voices
  if (gender === 'female') {
    if (FEMALE_RX.test(v.name)) s += 8
    else if (MALE_RX.test(v.name)) s -= 6
  } else if (gender === 'male') {
    if (MALE_RX.test(v.name)) s += 8
    else if (FEMALE_RX.test(v.name)) s -= 6
  }
  if (v.localService) s += 0.5 // tie-break: no network hiccups
  return s
}

export function pickVoice({ gender = 'any', accent = 'us' } = {}) {
  const voices = voicesCache.length ? voicesCache : loadVoices()
  if (!voices.length) return null
  let best = null
  let bestScore = -Infinity
  for (const v of voices) {
    const s = scoreVoice(v, { gender, accent })
    if (s > bestScore) { bestScore = s; best = v }
  }
  return best
}

// One pinned voice per character for the whole session, prevents the
// "Barbara starts female then switches to a man" glitch when the voice list
// finishes loading mid-call. Characters are SPREAD across the top-ranked
// voices (not all given the single best one) so Belfort ≠ Cuban ≠ the CEO
// even with stock browser voices.
const characterVoices = new Map()

function hashStr(s) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

export function resolveCharacterVoice(character) {
  if (!character) return null
  const key = character.id
  if (characterVoices.has(key)) return characterVoices.get(key)
  const voices = voicesCache.length ? voicesCache : loadVoices()
  if (!voices.length) return null
  const opts = { gender: character.voice?.gender || 'any', accent: character.voice?.accent || 'us' }
  const ranked = voices
    .map((v) => ({ v, s: scoreVoice(v, opts) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
  if (!ranked.length) {
    const fallback = pickVoice(opts)
    if (fallback) characterVoices.set(key, fallback)
    return fallback
  }
  // Spread characters only across voices that are truly comparable to the
  // best pick (same tier, right accent). A loose band here is how a US
  // character ends up with an Indian-English or novelty voice on macOS.
  const best = ranked[0].s
  const pool = ranked.filter((x) => x.s >= best - 2).map((x) => x.v)
  const v = pool[hashStr(key) % pool.length]
  characterVoices.set(key, v)
  return v
}

/* ── Premium voices (optional ElevenLabs integration) ─────────
   With an API key in Settings, each character speaks with a distinct
   human-sounding voice from ElevenLabs' premade voice library (matched
   to the character's vibe, NOT clones of the real people). Any failure
   falls back silently to the browser voice. */
let elevenActive = null // cancel handle for the currently playing clip

async function playAudioResponse(res) {
  const url = URL.createObjectURL(await res.blob())
  const audio = new Audio(url)
  const promise = new Promise((resolve) => {
    audio.onended = resolve
    audio.onerror = resolve
  }).finally(() => URL.revokeObjectURL(url))
  const cancel = () => { try { audio.pause() } catch { /* already stopped */ } }
  elevenActive = cancel
  await audio.play()
  return { promise, cancel }
}

/* Site-wide studio voices: when the app is deployed with an
   ELEVENLABS_API_KEY env var, /api/tts serves premium audio to EVERY
   visitor on any browser, no per-user setup. Probed once, cached. */
let proxyConfigured = null // null = unknown, then boolean
let proxyProbe = null
export function probeTtsProxy() {
  if (proxyProbe) return proxyProbe
  proxyProbe = fetch('/api/tts', { method: 'GET' })
    .then((r) => (r.ok ? r.json() : { configured: false }))
    .then((j) => { proxyConfigured = Boolean(j.configured); return proxyConfigured })
    .catch(() => { proxyConfigured = false; return false })
  return proxyProbe
}

async function proxySpeak(text, character, settings) {
  if (proxyConfigured === null) await probeTtsProxy()
  if (!proxyConfigured) throw new Error('no-proxy')
  const tuning = personaVoiceTuning(character.id).eleven || {}
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      voiceId: character.voice?.eleven || 'pNInz6obpgDQGcFmaJgB',
      voiceSettings: {
        stability: tuning.stability ?? 0.45,
        style: tuning.style ?? 0.3,
        similarity_boost: 0.85,
        speed: Math.max(0.8, Math.min(1.2, (tuning.speed ?? character.speakingSpeed ?? 1) * (settings.voiceRate || 1))),
      },
    }),
  })
  if (!res.ok) throw new Error(`proxy-${res.status}`)
  return playAudioResponse(res)
}

async function elevenSpeak(text, character, settings) {
  const voiceId = character.voice?.eleven || 'pNInz6obpgDQGcFmaJgB'
  const tuning = personaVoiceTuning(character.id).eleven || {}
  const speed = Math.max(0.8, Math.min(1.2,
    (tuning.speed ?? character.speakingSpeed ?? 1) * (settings.voiceRate || 1)))
  const body = {
    text,
    model_id: 'eleven_turbo_v2_5',
    voice_settings: {
      stability: tuning.stability ?? 0.45,
      similarity_boost: 0.85,
      style: tuning.style ?? 0.3,
      speed,
    },
  }
  let res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`, {
    method: 'POST',
    headers: { 'xi-api-key': settings.elevenLabsKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 422) {
    // Older accounts/models reject speed/style, retry with the basics.
    delete body.voice_settings.speed
    delete body.voice_settings.style
    res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`, {
      method: 'POST',
      headers: { 'xi-api-key': settings.elevenLabsKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }
  if (!res.ok) throw new Error(`elevenlabs-${res.status}`)
  return playAudioResponse(res)
}

/** True when a genuinely human voice can play (user key or site proxy). */
export function premiumVoiceAvailable(settings = {}) {
  return Boolean(settings.elevenLabsKey) || proxyConfigured === true
}

/** Roughly how long a spoken line would take, so caption-only mode paces
 *  turns like a real conversation. ~13 chars/sec at a natural rate. */
function estimateDuration(text, settings = {}) {
  return Math.max(1100, Math.min(9000, (text.length / 13) * 1000 / (settings.voiceRate || 1)))
}

/**
 * Speak a line AS a character.
 * - Premium voice (user key or site proxy) → real human audio.
 * - Otherwise the best available browser voice speaks (persona-tuned, with the
 *   accent/novelty filtering in resolveCharacterVoice), so there is always
 *   audible speech to hear. Captions render alongside regardless. Users who
 *   truly want silence can set settings.muteVoice.
 */
export function speakAs(text, character, settings = {}) {
  let cancelled = false
  let inner = null
  let timer = null
  const promise = (async () => {
    if (settings.elevenLabsKey) {
      try {
        inner = await elevenSpeak(text, character, settings)
        if (cancelled) { inner.cancel(); return }
        await inner.promise
        return
      } catch { /* fall through */ }
    }
    if (!cancelled && proxyConfigured !== false) {
      try {
        inner = await proxySpeak(text, character, settings)
        if (cancelled) { inner.cancel(); return }
        await inner.promise
        return
      } catch { /* fall through */ }
    }
    if (cancelled) return
    // Default: speak with the best available browser voice so there is always
    // audio. Only stay silent (caption-only, paced) if the user muted voices.
    if (!settings.muteVoice && speechSupport.synthesis) {
      const browserTuning = personaVoiceTuning(character.id).browser || {}
      const rate = Math.max(0.85, Math.min(1.18, browserTuning.rate ?? character.speakingSpeed ?? 1)) * (settings.voiceRate || 1)
      const pitch = Math.max(0.9, Math.min(1.12, browserTuning.pitch ?? character.voice?.pitch ?? 1))
      inner = speak(text, { rate, pitch, voice: resolveCharacterVoice(character) })
      await inner.promise
      return
    }
    // Muted (or no synthesis): pace the turn naturally on the caption alone.
    await new Promise((res) => { timer = setTimeout(res, estimateDuration(text, settings)) })
  })()
  return { promise, cancel: () => { cancelled = true; clearTimeout(timer); inner?.cancel?.() } }
}

/** Text prep for the synthesizer: strip what engines mangle (emoji, em-dashes
 *  read as "dash", stacked punctuation) while keeping the caption untouched. */
function sanitizeForSpeech(text) {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s*, \s*/g, ', ')
    .replace(/…/g, '... ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Split into sentence-sized chunks. Two reasons: Chrome's remote voices cut
 *  out mid-utterance after ~15s (the classic "broken TTS" bug), and short
 *  utterances get natural inter-sentence breaths. */
function splitSentences(text) {
  const parts = text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [text]
  const out = []
  for (const raw of parts.map((s) => s.trim()).filter(Boolean)) {
    if (out.length && (out[out.length - 1].length < 30 || raw.length < 30)) out[out.length - 1] += ' ' + raw
    else out.push(raw)
  }
  return out.length ? out : [text]
}

/**
 * Speak a line. Returns a handle: { promise, cancel }.
 * Long lines are spoken sentence-by-sentence with a natural beat between,
 * consistent rate/pitch throughout (per-line jitter sounded broken, removed).
 */
export function speak(text, { rate = 1, pitch = 1, voice = null } = {}) {
  if (!speechSupport.synthesis) {
    // Fallback: resolve on an estimated reading time so the flow still works.
    let t
    const promise = new Promise((res) => { t = setTimeout(res, Math.max(900, text.length * 55)) })
    return { promise, cancel: () => clearTimeout(t) }
  }
  const chunks = splitSentences(sanitizeForSpeech(text))
  let cancelled = false
  window.speechSynthesis.cancel()
  // Chrome pauses long/remote synthesis; nudging resume keeps it alive.
  const keepAlive = setInterval(() => {
    try { if (window.speechSynthesis.paused) window.speechSynthesis.resume() } catch { /* noop */ }
  }, 4000)
  // Chrome clips the first words when speak() follows cancel() immediately,
  // give the engine a beat to reset so sentences start from word one.
  const settleDelay = new Promise((r) => setTimeout(r, 150))

  const speakChunk = (chunk) => new Promise((res) => {
    if (cancelled) return res()
    const u = new SpeechSynthesisUtterance(chunk)
    u.rate = Math.max(0.6, Math.min(1.6, rate))
    u.pitch = Math.max(0.5, Math.min(1.8, pitch))
    if (voice) { u.voice = voice; u.lang = voice.lang }
    u.onend = () => res()
    u.onerror = () => res()
    setTimeout(() => res(), Math.max(2500, chunk.length * 120)) // dropped-onend safety net
    window.speechSynthesis.speak(u)
  })

  const promise = (async () => {
    await settleDelay
    for (const chunk of chunks) {
      if (cancelled) break
      await speakChunk(chunk)
      if (!cancelled && chunks.length > 1) await new Promise((r) => setTimeout(r, 130))
    }
  })().finally(() => clearInterval(keepAlive))

  return {
    promise,
    cancel: () => { cancelled = true; clearInterval(keepAlive); window.speechSynthesis.cancel() },
  }
}

/** What quality of voice will actually play right now, drives in-app guidance.
 *  Call probeTtsProxy() first so the site-wide tier is known. */
export function voiceTier(settings, character = null) {
  if (settings?.elevenLabsKey) return { tier: 'premium', label: 'ElevenLabs studio voices' }
  if (proxyConfigured) return { tier: 'premium', label: 'Studio voices (site-wide)' }
  if (!speechSupport.synthesis) return { tier: 'none', label: 'No speech synthesis in this browser' }
  const v = character ? resolveCharacterVoice(character) : pickVoice({})
  if (!v) return { tier: 'basic', label: 'Default system voice' }
  if (/natural|neural/i.test(v.name)) return { tier: 'neural', label: v.name }
  if (/google/i.test(v.name)) return { tier: 'good', label: v.name }
  return { tier: 'basic', label: v.name }
}

export function stopSpeaking() {
  if (speechSupport.synthesis) window.speechSynthesis.cancel()
  if (elevenActive) { elevenActive(); elevenActive = null }
}

/**
 * Listen for one user utterance. Returns { promise, stop }.
 * promise resolves { text, interim:false } or rejects on unavailability.
 */
export function listenOnce({ lang = 'en-US', onInterim } = {}) {
  if (!SR) return { promise: Promise.reject(new Error('no-recognition')), stop: () => {} }
  const rec = new SR()
  rec.lang = lang
  rec.interimResults = true
  rec.continuous = false
  rec.maxAlternatives = 1
  let finalText = ''
  let settled = false
  const promise = new Promise((resolve, reject) => {
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += t
        else interim += t
      }
      if (interim && onInterim) onInterim(finalText + interim)
    }
    rec.onerror = (e) => {
      if (settled) return
      settled = true
      if (finalText.trim()) resolve({ text: finalText.trim() })
      else reject(new Error(e.error || 'recognition-error'))
    }
    rec.onend = () => {
      if (settled) return
      settled = true
      if (finalText.trim()) resolve({ text: finalText.trim() })
      else reject(new Error('no-speech'))
    }
    try { rec.start() } catch (err) { if (!settled) { settled = true; reject(err) } }
  })
  return { promise, stop: () => { try { rec.stop() } catch { /* already stopped */ } } }
}

// Local persistence layer. All user state lives in localStorage under one key,
// with a seeded demo history so dashboards are alive on first launch.
import { dayKey } from './format.js'

const KEY = 'closer.profile.v1'
let cache = null
const listeners = new Set()

function seedHistory() {
  // ~3 weeks of past training with an upward score trend.
  const now = Date.now()
  const day = 86400000
  const calls = []
  const spec = [
    [21, 'angry-prospect', 'cold-call', 48, 262], [20, 'gym-owner', 'discovery', 52, 301],
    [18, 'skeptical-customer', 'objections', 55, 344], [17, 'restaurant-owner', 'appointment', 51, 288],
    [15, 'budget-buyer', 'cold-call', 58, 366], [14, 'real-estate-seller', 'listing', 61, 412],
    [12, 'busy-ceo', 'cold-call', 57, 240], [11, 'recruiter-prospect', 'recruitment', 64, 388],
    [9,  'cold-cfo', 'b2b-saas', 60, 355], [8, 'luxury-client', 'luxury', 67, 431],
    [6,  'startup-founder', 'discovery', 69, 445], [5, 'shark-investor', 'investor-pitch', 63, 372],
    [4,  'mark-cuban', 'negotiation', 71, 468], [2, 'barbara-corcoran', 'listing', 74, 502],
    [1,  'grant-cardone', 'closing', 72, 455],
  ]
  for (const [daysAgo, characterId, challengeId, overall, dur] of spec) {
    const ts = now - daysAgo * day - Math.floor(Math.random() * 6) * 3600000
    const jitter = (range) => Math.max(20, Math.min(96, overall + Math.round((Math.random() - 0.5) * range)))
    calls.push({
      id: `seed-${daysAgo}-${characterId}`,
      ts, characterId, challengeId,
      durationSec: dur,
      overall,
      seeded: true,
      scores: {
        confidence: jitter(16), tonality: jitter(14), pacing: jitter(18), energy: jitter(16),
        empathy: jitter(20), listening: jitter(18), questionQuality: jitter(20),
        objectionHandling: jitter(22), closingAbility: jitter(24), productKnowledge: jitter(14),
        rapport: jitter(16), control: jitter(18), persuasiveness: jitter(18), authority: jitter(16),
        professionalism: jitter(10),
      },
      talkRatio: 0.5 + (Math.random() - 0.5) * 0.24,
      fillerWords: Math.max(2, Math.round(18 - overall / 8 + Math.random() * 6)),
      interruptions: Math.floor(Math.random() * 4),
      transcript: [],
    })
  }
  return calls.sort((a, b) => a.ts - b.ts)
}

function defaults() {
  const calls = seedHistory()
  return {
    createdAt: Date.now(),
    user: { name: 'Alex Rivera', email: '', plan: 'premium', avatar: '🦁' },
    // Call XP + prior drill/academy XP so the demo profile sits at Closer rank.
    xp: 6200 + calls.reduce((s, c) => s + Math.round(40 + c.overall * 0.9), 0),
    calls,
    streak: { current: 6, best: 11, lastDay: dayKey(Date.now() - 86400000) },
    academy: {},          // moduleId -> { lessonsDone: [], quizBest: n, drillsDone: [] }
    certificates: {},     // moduleId -> { earnedAt, score, name, course, level }
    achievements: ['first-call', 'streak-3', 'ten-calls', 'objection-slayer'],
    unlockedCharacters: [],
    goals: [
      { id: 'g1', text: 'Book 3 mock demos this week', done: false },
      { id: 'g2', text: 'Score 80+ against a Hard character', done: false },
      { id: 'g3', text: 'Finish the Objection Handling module', done: true },
    ],
    habits: { 'daily-call': [1, 1, 0, 1, 1, 1, 0], 'drill-5min': [1, 0, 1, 1, 0, 1, 1] },
    notebook: [
      { id: 'n1', ts: Date.now() - 3 * 86400000, text: 'Mirroring the prospect\'s last 3 words consistently re-opens the conversation. Use it after every objection.' },
      { id: 'n2', ts: Date.now() - 86400000, text: 'Stop discounting early. Anchor on value for at least 2 exchanges before touching price.' },
    ],
    settings: {
      voice: 'auto', voiceRate: 1, accent: 'us',
      whisperCoach: true, notifications: true, dailyReminder: '08:30',
      micSensitivity: 0.6, speechSensitivity: 0.5, language: 'en',
      muteVoice: false, elevenLabsKey: '',
      llmKey: '', llmModel: 'gpt-4o-mini', llmBase: 'https://api.openai.com/v1',
    },
    dailyDone: {},        // dayKey -> [drillIds]
    debriefs: [],         // real-meeting debriefs: { id, ts, title, source, report, transcript, meta }
  }
}

export function getProfile() {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      cache = JSON.parse(raw)
      return cache
    }
  } catch { /* corrupted → reseed */ }
  cache = defaults()
  persist()
  return cache
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)) } catch { /* quota */ }
}

export function updateProfile(mutator) {
  const p = getProfile()
  mutator(p)
  persist()
  listeners.forEach((fn) => fn(p))
  return p
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function resetProfile() {
  cache = defaults()
  persist()
  listeners.forEach((fn) => fn(cache))
}

export function recordCall(call) {
  return updateProfile((p) => {
    p.calls.push(call)
    p.xp += call.xpEarned || 0
    const today = dayKey(Date.now())
    if (p.streak.lastDay !== today) {
      const yesterday = dayKey(Date.now() - 86400000)
      p.streak.current = p.streak.lastDay === yesterday ? p.streak.current + 1 : 1
      p.streak.best = Math.max(p.streak.best, p.streak.current)
      p.streak.lastDay = today
    }
  })
}

export function awardCertificate(moduleId, data) {
  return updateProfile((p) => {
    if (!p.certificates) p.certificates = {}
    if (!p.certificates[moduleId]) {
      p.certificates[moduleId] = { earnedAt: Date.now(), ...data }
      p.xp += 150 // certificate bonus
      if (!p.achievements.includes('first-certificate')) p.achievements.push('first-certificate')
    }
  })
}

export function saveDebrief(debrief) {
  return updateProfile((p) => {
    if (!p.debriefs) p.debriefs = []
    p.debriefs.unshift(debrief)
    p.xp += 40 // small reward for reviewing a real meeting
  })
}

export function deleteDebrief(id) {
  return updateProfile((p) => { p.debriefs = (p.debriefs || []).filter((d) => d.id !== id) })
}

export function saveNote(text) {
  return updateProfile((p) => {
    p.notebook.unshift({ id: `n${Date.now()}`, ts: Date.now(), text })
  })
}

// Post-call scoring: turns a transcript + engine log into the full report.
import { analyzeUtterance } from './conversation.js'
import { clamp } from './format.js'

const FILLER_RX = /\b(um+|uh+|like|you know|basically|actually|literally|honestly|kind of|sort of|i mean)\b/gi

export function scoreCall({ transcript, engineState, durationSec, character, challenge }) {
  const userTurns = transcript.filter((t) => t.speaker === 'user')
  const aiTurns = transcript.filter((t) => t.speaker === 'ai')
  const userWords = userTurns.reduce((s, t) => s + t.text.split(/\s+/).filter(Boolean).length, 0)
  const aiWords = aiTurns.reduce((s, t) => s + t.text.split(/\s+/).filter(Boolean).length, 0)
  const allUserText = userTurns.map((t) => t.text).join(' ')

  // No meaningful speech = no meaningful score. Anything else is lying.
  if (userTurns.length === 0 || userWords < 5) {
    const zeroScores = {}
    for (const k of ['confidence', 'tonality', 'pacing', 'energy', 'empathy', 'listening', 'questionQuality', 'objectionHandling', 'closingAbility', 'productKnowledge', 'rapport', 'control', 'persuasiveness', 'authority', 'professionalism']) {
      zeroScores[k] = 5
    }
    return {
      overall: 5,
      insufficient: true,
      scores: zeroScores,
      talkRatio: 0,
      fillerWords: 0,
      fillerBreakdown: [],
      interruptions: 0,
      questions: 0,
      openQuestions: 0,
      repeatedWords: [],
      confidenceTrend: [],
      goods: [],
      mistakes: [{ turn: 1, text: 'No speech detected, the prospect was talking to dead air. Check your mic (or use the keypad) and take the call again.' }],
      outcome: engineState.outcome || 'ended',
      objections: { raised: engineState.objectionsRaised, survived: 0 },
      wpm: 0,
    }
  }

  const fillerMatches = allUserText.match(FILLER_RX) || []
  const fillerWords = fillerMatches.length
  const questions = userTurns.filter((t) => analyzeUtterance(t.text).isQuestion).length
  const openQuestions = userTurns.filter((t) => analyzeUtterance(t.text).openQuestion).length
  const talkRatio = userWords + aiWords > 0 ? userWords / (userWords + aiWords) : 0.5
  const avgTurnLen = userTurns.length ? userWords / userTurns.length : 0

  const goods = engineState.log.filter((l) => l.good)
  const mistakes = engineState.log.filter((l) => l.mistake)
  const posMoves = engineState.log.filter((l) => l.delta > 0).length
  const moveRatio = engineState.log.length ? posMoves / engineState.log.length : 0.5

  const won = engineState.outcome === 'closed'
  const hangup = engineState.outcome === 'hangup'
  const difficulty = character?.difficulty ?? 3

  const base = (v) => clamp(Math.round(v), 5, 98)
  const scores = {
    confidence: base(46 + moveRatio * 34 - fillerWords * 1.6 + (won ? 10 : 0)),
    tonality: base(50 + moveRatio * 26 - (hangup ? 12 : 0)),
    pacing: base(62 - Math.abs(avgTurnLen - 26) * 1.1),
    energy: base(48 + moveRatio * 30 + (userTurns.length > 5 ? 6 : 0)),
    empathy: base(34 + goods.filter((g) => /acknowledg|mirror/i.test(g.good)).length * 14 + moveRatio * 18),
    listening: base(38 + (1 - Math.abs(talkRatio - 0.45) * 2.2) * 40 + openQuestions * 4),
    questionQuality: base(28 + openQuestions * 12 + questions * 5),
    objectionHandling: base(30 + (engineState.objectionsSurvived / Math.max(1, engineState.objectionsRaised)) * 52 + (won ? 8 : 0)),
    closingAbility: base(won ? 82 + Math.random() * 10 : hangup ? 22 : 44 + engineState.interest * 0.3),
    productKnowledge: base(50 + goods.filter((g) => /value/i.test(g.good)).length * 10 + moveRatio * 18),
    rapport: base(36 + goods.filter((g) => /mirror|rapport|acknowledg/i.test(g.good)).length * 13 + engineState.interest * 0.22),
    control: base(40 + questions * 6 - mistakes.filter((m) => /passive|surrender/i.test(m.mistake)).length * 10),
    persuasiveness: base(34 + engineState.interest * 0.42 + (won ? 12 : 0)),
    authority: base(48 + moveRatio * 28 - fillerWords * 1.8),
    professionalism: base(70 - fillerWords * 1.4 - (hangup ? 10 : 0) + moveRatio * 12),
  }

  const weights = {
    confidence: 1.2, tonality: 0.8, pacing: 0.7, energy: 0.7, empathy: 1,
    listening: 1.1, questionQuality: 1.2, objectionHandling: 1.4, closingAbility: 1.5,
    productKnowledge: 0.7, rapport: 1, control: 1, persuasiveness: 1.2,
    authority: 0.9, professionalism: 0.6,
  }
  let overall = 0
  let wSum = 0
  for (const k of Object.keys(scores)) { overall += scores[k] * weights[k]; wSum += weights[k] }
  overall = clamp(Math.round(overall / wSum + (won ? 6 : 0) - (hangup ? 8 : 0) + (difficulty - 3) * 1.5), 5, 99)

  // Repeated words (vocabulary analysis)
  const freq = {}
  const STOP = new Set(['the','a','an','and','or','but','to','of','in','on','for','with','that','this','is','are','was','it','you','i','we','they','your','my','our','me','so','at','be','have','has','do','can','will','would','just'])
  for (const w of allUserText.toLowerCase().match(/\b[a-z']+\b/g) || []) {
    if (!STOP.has(w) && w.length > 2) freq[w] = (freq[w] || 0) + 1
  }
  const repeatedWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .filter(([, n]) => n >= 2)

  // Confidence trend across turns (delta-driven walk)
  let conf = 50
  const confidenceTrend = engineState.log.map((l) => {
    conf = clamp(conf + l.delta * 0.9, 10, 95)
    return Math.round(conf)
  })

  return {
    overall,
    scores,
    talkRatio,
    fillerWords,
    fillerBreakdown: countBy(fillerMatches.map((f) => f.toLowerCase())),
    interruptions: engineState.log.filter((l) => l.mistake && /monolog/i.test(l.mistake)).length,
    questions,
    openQuestions,
    repeatedWords,
    confidenceTrend,
    goods: goods.map((g) => ({ turn: g.turn, text: g.good })),
    mistakes: mistakes.map((m) => ({ turn: m.turn, text: m.mistake })),
    outcome: engineState.outcome,
    objections: { raised: engineState.objectionsRaised, survived: engineState.objectionsSurvived },
    // Words per minute of user talk time (~half the call); only meaningful on
    // real-time voice calls, so clamp hard and skip degenerate short sessions.
    wpm: durationSec > 45 ? clamp(Math.round(userWords / (durationSec / 60 / 2)), 60, 240) : 0,
  }
}

function countBy(arr) {
  const out = {}
  for (const x of arr) out[x] = (out[x] || 0) + 1
  return Object.entries(out).sort((a, b) => b[1] - a[1])
}

// Voice analysis (simulated from transcript dynamics, no raw audio processing)
export function voiceProfile(report) {
  const s = report.scores
  if (report.insufficient) {
    return [
      { k: 'Pitch variety', v: 5 }, { k: 'Tone', v: 5 }, { k: 'Energy', v: 5 },
      { k: 'Monotony risk', v: 5 }, { k: 'Clarity', v: 5 }, { k: 'Speaking speed', v: 5 },
      { k: 'Confidence', v: 5 }, { k: 'Cadence', v: 5 },
    ].map((x) => ({ ...x, tip: 'Nothing to analyze, no speech was captured this call.' }))
  }
  return [
    { k: 'Pitch variety', v: s.tonality, tip: 'End statements low, questions high. Record one line 3 ways.' },
    { k: 'Tone', v: Math.round((s.tonality + s.empathy) / 2), tip: 'Smile on the opener, it is audible.' },
    { k: 'Energy', v: s.energy, tip: 'Stand up for calls. Energy transfers before words do.' },
    { k: 'Monotony risk', v: 100 - s.tonality, tip: 'Vary pace every 2–3 sentences.', invert: true },
    { k: 'Clarity', v: Math.max(20, 95 - report.fillerWords * 4), tip: 'Replace fillers with silence.' },
    { k: 'Speaking speed', v: report.wpm ? clamp(Math.round(100 - Math.abs(report.wpm - 150) * 0.6), 15, 98) : 60, tip: 'Target 140–160 wpm on calls.' },
    { k: 'Confidence', v: s.confidence, tip: 'Drop "just", "maybe", "kind of" from your pitch.' },
    { k: 'Cadence', v: s.pacing, tip: 'Pause a full second after key numbers.' },
  ]
}

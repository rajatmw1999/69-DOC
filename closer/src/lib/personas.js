// Persona tuning: what makes each legend SOUND like themselves.
// - tics: signature verbal mannerisms woven into every line (they also shape
//   TTS prosody, synthesis pauses on ellipses and hits caps harder)
// - eleven: per-character ElevenLabs voice_settings (expressiveness/pace)
// - browser: pitch/rate shaping for the built-in browser voices
// For maximum fidelity, a properly licensed cloned voice ID can be placed in
// the character's voice.eleven field in data/characters.js, the pipeline
// uses it automatically.

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Never play the same tic twice in a row, repetition is what reads as "bot".
const lastTic = new Map()
function pickFresh(arr, key) {
  const avoid = lastTic.get(key)
  const pool = arr.length > 1 ? arr.filter((x) => x !== avoid) : arr
  const chosen = pick(pool)
  lastTic.set(key, chosen)
  return chosen
}

export const PERSONAS = {
  'jordan-belfort': {
    tics: {
      openers: ['Listen,', 'Look, kid,', 'Let me tell you something,'], openerChance: 0.35,
      closers: ['You following me?', 'Okay?'], closerChance: 0.3,
      pause: 0.3,
    },
    eleven: { stability: 0.3, style: 0.65, speed: 1.12 },
    browser: { pitch: 1.04, rate: 1.12 },
  },
  'grant-cardone': {
    tics: {
      openers: ['Look,', 'LISTEN,'], openerChance: 0.3,
      closers: ['Get it?', 'COME ON!'], closerChance: 0.3,
      emphasis: /\b(massive|money|great|now|obsessed|bigger|energy|scale|10x)\b/gi,
    },
    eleven: { stability: 0.22, style: 0.7, speed: 1.15 },
    browser: { pitch: 0.93, rate: 1.15 },
  },
  'steve-jobs': {
    tics: {
      openers: ['Look.', 'Here’s the thing.', 'See…'], openerChance: 0.35,
      closers: ['It’s that simple.', '…Right?'], closerChance: 0.3,
      pause: 0.7,
    },
    eleven: { stability: 0.6, style: 0.35, speed: 0.95 },
    browser: { pitch: 0.97, rate: 0.93 },
  },
  'elon-musk': {
    tics: {
      openers: ['Um…', 'I mean…', 'Yeah, so…'], openerChance: 0.5,
      closers: ['…yeah.', 'Anyway.'], closerChance: 0.3,
      pause: 0.75,
    },
    eleven: { stability: 0.55, style: 0.2, speed: 0.9 },
    browser: { pitch: 1.04, rate: 0.9 },
  },
  'warren-buffett': {
    tics: {
      openers: ['Well…', 'You know…'], openerChance: 0.45,
      closers: ['Heh.', 'That’s just how it works, friend.'], closerChance: 0.35,
      pause: 0.5,
    },
    eleven: { stability: 0.75, style: 0.2, speed: 0.82 },
    browser: { pitch: 0.92, rate: 0.88 },
  },
  'mark-cuban': {
    tics: {
      openers: ['Look,', 'Here’s the deal,'], openerChance: 0.35,
      closers: ['Period.', 'That simple.'], closerChance: 0.3,
    },
    eleven: { stability: 0.35, style: 0.55, speed: 1.1 },
    browser: { pitch: 0.95, rate: 1.12 },
  },
  'barbara-corcoran': {
    tics: {
      openers: ['Oh, honey,', 'Listen, sweetheart,'], openerChance: 0.25,
      closers: ['Trust me on that one.', 'I’ve seen it a thousand times.'], closerChance: 0.3,
    },
    eleven: { stability: 0.45, style: 0.5, speed: 1.05 },
    browser: { pitch: 1.08, rate: 1.05 },
  },
  // Archetypes get lighter seasoning
  'angry-prospect': {
    tics: { closers: ['Unbelievable.', 'I can’t believe this.'], closerChance: 0.25 },
    eleven: { stability: 0.25, style: 0.6, speed: 1.1 },
  },
  'cold-cfo': {
    tics: { pause: 0.4 },
    eleven: { stability: 0.85, style: 0.05, speed: 0.9 },
  },
  'luxury-client': {
    tics: { pause: 0.5, closers: ['Do go on.', 'Hm.'], closerChance: 0.2 },
    eleven: { stability: 0.65, style: 0.4, speed: 0.88 },
  },
  'busy-ceo': {
    eleven: { stability: 0.4, style: 0.4, speed: 1.18 },
  },
  'restaurant-owner': {
    tics: { openers: ['Ey,', 'Listen, friend,'], openerChance: 0.25 },
    eleven: { stability: 0.35, style: 0.5, speed: 1.1 },
  },
}

/** Weave a character's verbal tics into a line (max two touches so the
 *  writing never turns into parody). Applied to every engine line, so the
 *  transcript and the spoken audio share the same rhythm. */
export function mannerize(text, characterId) {
  const tics = PERSONAS[characterId]?.tics
  if (!tics) return text
  let out = text
  let touches = 0
  if (tics.openers && Math.random() < (tics.openerChance ?? 0.3)) {
    const op = pickFresh(tics.openers, characterId + ':open')
    const opWord = op.replace(/[^a-zA-Z’' ]/g, '').trim().split(' ')[0]?.toLowerCase()
    // Don't stack "Look, Look," or prefix a line that already opens with the tic
    if (opWord && !out.slice(0, 26).toLowerCase().includes(opWord)) {
      out = `${op} ${out}`
      touches += 1
    }
  }
  if (tics.pause && touches < 2 && Math.random() < tics.pause) {
    const replaced = out.replace(/, /, '… ')
    if (replaced !== out) { out = replaced; touches += 1 }
  }
  if (tics.emphasis && touches < 2) {
    const replaced = out.replace(tics.emphasis, (s) => s.toUpperCase())
    if (replaced !== out) { out = replaced; touches += 1 }
  }
  if (tics.closers && touches < 2 && out.length < 150 && Math.random() < (tics.closerChance ?? 0.25)) {
    out = `${out} ${pickFresh(tics.closers, characterId + ':close')}`
  }
  return out
}

export function personaVoiceTuning(characterId) {
  return PERSONAS[characterId] || {}
}

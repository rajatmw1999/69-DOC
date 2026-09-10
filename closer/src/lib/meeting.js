// Meeting Debrief: turn a REAL meeting/call transcript into the same 15-metric
// report the simulator produces. Two inputs feed this:
//   1. A transcript pasted or uploaded from a notetaker (Notion, Fathom, Otter,
//      Fireflies, Zoom .vtt/.srt, or any "Name: text" export).
//   2. A live in-browser recording, transcribed by the Web Speech API.
// The analysis half is the existing scoreCall engine — we just synthesize a
// plausible engine state from the transcript so real conversations score fairly.
import { analyzeUtterance } from './conversation.js'
import { scoreCall } from './scoring.js'
import { clamp } from './format.js'

const TS_LINE = /^\s*(\[?\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\]?)\s*(?:-->|→)?\s*/
const VTT_TIME = /-->/
const SPEAKER_LINE = /^\s*(?:\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*)?([A-Za-z][\w .'&\/-]{0,38}?)\s*[:：]\s*(.+)$/
const VTT_VOICE = /<v\s+([^>]+)>(.*?)(?:<\/v>|$)/i

function cleanLabel(s) {
  return s.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40)
}

/** Parse many transcript formats into ordered speaker turns.
 *  Returns { turns:[{speaker,text}], speakers:[label], format }. */
export function parseTranscript(raw) {
  const text = (raw || '').replace(/\r/g, '').trim()
  if (!text) return { turns: [], speakers: [], format: 'empty' }

  let format = 'plain'
  let turns = []

  const isVtt = /^WEBVTT/.test(text)
  const looksSrt = /\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->/.test(text) && /^\d+\s*$/m.test(text)

  if (isVtt || looksSrt) {
    format = isVtt ? 'vtt' : 'srt'
    const blocks = text.replace(/^WEBVTT.*$/m, '').split(/\n\s*\n/)
    for (const block of blocks) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
      const body = lines.filter((l) => !VTT_TIME.test(l) && !/^\d+$/.test(l) && !/^NOTE\b/.test(l))
      if (!body.length) continue
      let speaker = null
      const parts = []
      for (let line of body) {
        const v = line.match(VTT_VOICE)
        if (v) { speaker = cleanLabel(v[1]); parts.push(v[2].replace(/<[^>]+>/g, '').trim()); continue }
        const sp = line.match(SPEAKER_LINE)
        if (sp && !speaker) { speaker = cleanLabel(sp[1]); parts.push(sp[2].trim()); continue }
        parts.push(line.replace(/<[^>]+>/g, '').trim())
      }
      const t = parts.join(' ').trim()
      if (t) turns.push({ speaker: speaker || 'Speaker', text: t })
    }
  } else {
    // Plain text. Prefer "Name: text" lines; else split into paragraphs.
    const lines = text.split('\n')
    let matchedAny = false
    let current = null
    for (let line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const m = trimmed.match(SPEAKER_LINE)
      if (m) {
        matchedAny = true
        const speaker = cleanLabel(m[1])
        current = { speaker, text: m[2].trim() }
        turns.push(current)
      } else if (current) {
        current.text += ' ' + trimmed.replace(TS_LINE, '')
      } else {
        current = { speaker: 'Speaker', text: trimmed.replace(TS_LINE, '') }
        turns.push(current)
      }
    }
    if (!matchedAny) {
      // No speaker labels at all (typical of a raw live recording): one block.
      format = 'unlabeled'
      turns = [{ speaker: 'Speaker', text: text.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim() }]
    }
  }

  // Merge consecutive same-speaker turns.
  const merged = []
  for (const t of turns) {
    if (!t.text) continue
    const last = merged[merged.length - 1]
    if (last && last.speaker === t.speaker) last.text += ' ' + t.text
    else merged.push({ ...t })
  }

  const speakers = [...new Set(merged.map((t) => t.speaker))]
  return { turns: merged, speakers, format }
}

/** Guess which speaker is the salesperson (most sales-oriented language). */
export function guessSeller(turns, speakers) {
  if (speakers.length <= 1) return speakers[0]
  const score = {}
  for (const s of speakers) score[s] = 0
  for (const t of turns) {
    const a = analyzeUtterance(t.text)
    let s = 0
    if (a.intents.has('valueProp')) s += 2
    if (a.intents.has('close')) s += 3
    if (a.intents.has('social')) s += 2
    if (a.intents.has('question')) s += 1
    score[t.speaker] = (score[t.speaker] || 0) + s
  }
  return speakers.sort((x, y) => (score[y] || 0) - (score[x] || 0))[0]
}

/** Map parsed turns to the app's transcript shape, with estimated timestamps. */
export function toAppTranscript(turns, meLabel) {
  let t = 0
  return turns.map((turn) => {
    const words = turn.text.split(/\s+/).filter(Boolean).length
    const entry = { speaker: turn.speaker === meLabel ? 'user' : 'ai', text: turn.text, t: Math.round(t) }
    t += Math.max(2, words / 2.6) // ~2.6 words/sec speaking
    return entry
  })
}

const OBJECTION_RX = /\b(too expensive|expensive|pric(e|ing)|cost|budget|can'?t afford|no time|too busy|not interested|already (have|use|using|got)|competitor|current (vendor|provider|tool)|send me (an )?email|call me (back|later)|think about it|not (a )?(good|right) (time|fit)|not sure|hesitant|concern|not convinced)\b/i
const CLOSE_RX = /\b(send (me )?(the|an|over) (invite|details|contract|proposal|agreement)|schedule|book (a|the|another)|calendar|next steps|let'?s (do|go|move|proceed|talk|schedule)|sign|sounds good|i'?m in|set up a (call|meeting|demo)|move forward|we'?ll take it|let'?s get started)\b/i
const HANGUP_RX = /\b(goodbye|hang(ing)? up|take me off|don'?t call|not interested at all|lose my number|we'?re done|stop calling)\b/i
const POSITIVE_RX = /\b(interesting|makes sense|good point|i like|tell me more|go on|helpful|fair enough|great|love it|impressive|exactly|that'?s right|absolutely)\b/i
const NEGATIVE_RX = /\b(not really|i don'?t think|waste|annoyed|not for us|pass|disagree|no thanks|too much|skeptical)\b/i

/** Build a plausible engine state from a real transcript so scoreCall is fair. */
export function deriveEngineState(app) {
  const log = []
  let interest = 42
  let objectionsRaised = 0
  let objectionsSurvived = 0
  let turn = 0
  for (let i = 0; i < app.length; i++) {
    const e = app[i]
    if (e.speaker === 'ai') {
      if (OBJECTION_RX.test(e.text)) {
        objectionsRaised++
        const next = app.slice(i + 1).find((x) => x.speaker === 'user')
        if (next) {
          const a = analyzeUtterance(next.text)
          if (a.intents.has('valueProp') || a.intents.has('empathy') || a.isQuestion || a.intents.has('close') || a.intents.has('social')) objectionsSurvived++
        }
      }
      if (POSITIVE_RX.test(e.text)) interest = clamp(interest + 9, 0, 100)
      if (NEGATIVE_RX.test(e.text)) interest = clamp(interest - 8, 0, 100)
      continue
    }
    turn++
    const a = analyzeUtterance(e.text)
    let delta = 0
    let good = null
    let mistake = null
    if (a.openQuestion) { delta += 6; good = 'Asked an open, discovery-style question' }
    else if (a.isQuestion) { delta += 3 }
    if (a.intents.has('valueProp')) { delta += 5; good = good || 'Framed clear value' }
    if (a.intents.has('empathy')) { delta += 4; good = good || 'Acknowledged / mirrored the other side' }
    if (a.intents.has('social')) { delta += 3; good = good || 'Used social proof' }
    if (a.intents.has('close')) { delta += 5; good = good || 'Moved the conversation toward a next step' }
    if (a.fillers >= 3) { delta -= 4; mistake = 'Filler-heavy turn — tighten it up' }
    const words = e.text.split(/\s+/).filter(Boolean).length
    if (words > 90) { delta -= 5; mistake = mistake || 'Monologued — long turn without a question' }
    interest = clamp(interest + delta, 0, 100)
    log.push({ turn, delta, good, mistake })
  }
  const tail = app.slice(Math.floor(app.length * 0.6)).map((x) => x.text).join(' ')
  let outcome = 'ended'
  if (CLOSE_RX.test(tail)) outcome = 'closed'
  else if (HANGUP_RX.test(tail)) outcome = 'hangup'
  return { log, outcome, objectionsRaised, objectionsSurvived, interest }
}

/** Full debrief: transcript turns → { report, transcript, meta }. */
export function debriefReport({ turns, meLabel, durationSec }) {
  const app = toAppTranscript(turns, meLabel)
  const engineState = deriveEngineState(app)
  const userWords = app.filter((t) => t.speaker === 'user').reduce((s, t) => s + t.text.split(/\s+/).filter(Boolean).length, 0)
  const totalWords = app.reduce((s, t) => s + t.text.split(/\s+/).filter(Boolean).length, 0)
  const dur = durationSec || Math.max(60, Math.round(totalWords / 2.4))
  const character = { id: 'real-meeting', name: 'Real meeting', difficulty: 3 }
  const report = scoreCall({ transcript: app, engineState, durationSec: dur, character, challenge: null })
  const singleSpeaker = app.every((t) => t.speaker === 'user') || app.every((t) => t.speaker === 'ai')
  return { report, transcript: app, meta: { durationSec: dur, userWords, totalWords, singleSpeaker, objectionsRaised: engineState.objectionsRaised } }
}

// AI Coach: persistent mentor with memory of your call history.
import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useRef, useState, useEffect } from 'react'
import { useProfile } from '../components/AppShell.jsx'
import { Card } from '../components/ui.jsx'
import { getCharacter } from '../data/characters.js'
import { ACADEMY } from '../data/academy.js'
import { saveNote, updateProfile } from '../lib/storage.js'
import { timeAgo } from '../lib/format.js'

const SKILL_LABELS = {
  confidence: 'confidence', tonality: 'tonality', pacing: 'pacing', energy: 'energy',
  empathy: 'empathy', listening: 'listening', questionQuality: 'question quality',
  objectionHandling: 'objection handling', closingAbility: 'closing',
  productKnowledge: 'product knowledge', rapport: 'rapport', control: 'conversation control',
  persuasiveness: 'persuasiveness', authority: 'authority', professionalism: 'professionalism',
}

function analyzeWeaknesses(calls) {
  const recent = calls.slice(-8)
  if (!recent.length) return []
  const sums = {}
  for (const c of recent) {
    for (const [k, v] of Object.entries(c.scores || {})) {
      sums[k] = sums[k] || { total: 0, n: 0 }
      sums[k].total += v
      sums[k].n += 1
    }
  }
  return Object.entries(sums)
    .map(([k, { total, n }]) => ({ key: k, avg: Math.round(total / n) }))
    .sort((a, b) => a.avg - b.avg)
}

const MODULE_FOR_SKILL = {
  objectionHandling: 'objection-handling', closingAbility: 'closing', questionQuality: 'discovery-questions',
  listening: 'listening', rapport: 'rapport', confidence: 'confidence', tonality: 'tone-control',
  empathy: 'emotional-intelligence', control: 'conversation-flow', persuasiveness: 'persuasion',
  authority: 'executive-presence', pacing: 'articulation', energy: 'energy-management',
  productKnowledge: 'storytelling', professionalism: 'business-english',
}

function coachReply(text, ctx) {
  const t = text.toLowerCase()
  if (/objection/.test(t)) return `Objections are where you're leaving the most points, you're averaging ${ctx.weak.find((w) => w.key === 'objectionHandling')?.avg ?? '~60'} there. Remember AAA: Acknowledge, Ask, Answer. Never answer an objection you haven't isolated first. Run the Objection Handling module, then rematch ${ctx.lastChar}.`
  if (/clos(e|ing)/.test(t)) return `Your closing pattern shows hesitation: you build value, then wait for THEM to suggest next steps. Decide your closing question before you dial. Try: "Sounds like Tuesday or Thursday works, which is better?" Then silence. First one to speak concedes.`
  if (/nervous|anxious|confiden|scared|fear/.test(t)) return `Confidence is a system, not a mood. Three things before your next call: script your first 20 seconds cold, stand up, and cut every "just / maybe / kind of". Your filler count last call was ${ctx.lastCall?.fillerWords ?? 'high'}, pauses beat fillers every time.`
  if (/price|discount|expensive|budget/.test(t)) return `You discount too early, I've seen it in your last few calls. When price comes up, don't defend it. Redirect: "Compared to what?" Then anchor on the cost of doing nothing. A price objection is a value objection in disguise.`
  if (/open|cold call|start|intro/.test(t)) return `Your openers improve when you lead with a specific reason for calling THEM. Formula: pattern interrupt → reason → permission question. "I know I'm calling out of the blue, I work with [peer group] and had a specific idea for you. 30 seconds?"`
  if (/plan|homework|next|improve|better/.test(t)) return `Here's your plan for this week: 1) Daily 5-minute drill (your streak feeds on it). 2) Two calls vs ${ctx.lastChar} until you score 75+. 3) The ${ctx.focusModule?.name ?? 'Objection Handling'} module, your ${ctx.weakest} is the bottleneck. Report back after each call; I'm tracking it.`
  if (/hang.?up|lost|failed|bad call/.test(t)) return `Look at the tape, not the feeling. Your last rough call died at the point where you monologued, ${ctx.lastCall?.interruptions ?? 1}+ long stretches without a question. When you feel a call slipping: stop, ask an open question, and shut up. Control comes from questions, not volume.`
  return `Based on your last ${ctx.n} calls, your bottleneck is ${ctx.weakest} (avg ${ctx.weakAvg}). Strongest: ${ctx.strongest}. My advice: pick ONE skill per week, this week it's ${ctx.weakest}. Start with the ${ctx.focusModule?.name ?? 'matching'} module, then apply it against ${ctx.lastChar}. Ask me anything specific, openers, objections, closing, nerves.`
}

export default function Coach() {
  const profile = useProfile()
  const nav = useNavigate()
  const weak = useMemo(() => analyzeWeaknesses(profile.calls), [profile.calls])
  const weakest = weak[0]
  const strongest = weak[weak.length - 1]
  const lastCall = profile.calls[profile.calls.length - 1]
  const lastChar = lastCall ? getCharacter(lastCall.characterId).name : 'the Busy CEO'
  const focusModule = weakest ? ACADEMY.find((m) => m.id === MODULE_FOR_SKILL[weakest.key]) : null

  const [messages, setMessages] = useState(() => [{
    who: 'ai',
    text: `Good to see you back. I've reviewed all ${profile.calls.length} of your calls. Quick read: your ${SKILL_LABELS[strongest?.key] ?? 'rapport'} is genuinely strong (${strongest?.avg ?? 70}), but ${SKILL_LABELS[weakest?.key] ?? 'closing'} keeps costing you deals (${weakest?.avg ?? 55}). That's this week's focus. What do you want to work on?`,
  }])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const send = (e) => {
    e.preventDefault()
    if (!input.trim() || thinking) return
    const text = input.trim()
    setMessages((m) => [...m, { who: 'me', text }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      const ctx = {
        n: Math.min(8, profile.calls.length),
        weakest: SKILL_LABELS[weakest?.key] ?? 'closing',
        weakAvg: weakest?.avg ?? 55,
        strongest: SKILL_LABELS[strongest?.key] ?? 'rapport',
        weak, lastCall, lastChar, focusModule,
      }
      setMessages((m) => [...m, { who: 'ai', text: coachReply(text, ctx) }])
      setThinking(false)
    }, 900 + Math.random() * 700)
  }

  const homework = [
    { id: 'hw1', text: `Beat ${lastChar} with a score of 75+`, action: () => nav('/app/simulator', { state: { characterId: lastCall?.characterId } }) },
    { id: 'hw2', text: `Complete the ${focusModule?.name ?? 'Objection Handling'} module`, action: () => nav(`/app/academy/${focusModule?.id ?? 'objection-handling'}`) },
    { id: 'hw3', text: 'Run today\'s 5-minute drill', action: () => nav('/app/daily') },
  ]

  return (
    <div className="page-enter">
      <div className="main-header">
        <h1>AI Coach 🧠</h1>
        <p>Your persistent mentor. Remembers every call, tracks recurring mistakes, and assigns the work.</p>
      </div>

      <div className="grid coach-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <Card className="pad coach-panel">
          <div className="coach-chat" ref={chatRef}>
            {messages.map((m, i) => (
              <div key={i} className={`coach-msg ${m.who} anim-up`}>{m.text}</div>
            ))}
            {thinking && <div className="coach-msg ai typing"><i /><i /><i /></div>}
          </div>
          {/* Composer pinned to the bottom of the box: suggestions then input */}
          <div className="coach-composer">
            <div className="coach-suggests">
              {['How do I handle price objections?', 'Build me a training plan', 'Why did my last call fail?', 'Fix my opener', 'Calm my nerves'].map((s) => (
                <button key={s} className="chip" style={{ cursor: 'pointer' }} onClick={() => setInput(s)}>{s}</button>
              ))}
            </div>
            <form onSubmit={send} className="row" style={{ gap: 8 }}>
              <input
                className="input" placeholder="Ask about openers, objections, closing, nerves…"
                value={input} onChange={(e) => setInput(e.target.value)} aria-label="Message the coach"
              />
              <button className="btn btn-gold" type="submit" disabled={!input.trim() || thinking}>Send</button>
            </form>
          </div>
        </Card>

        <div className="col">
          <Card className="pad">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>📌 Recurring patterns</h3>
            <div className="col" style={{ gap: 10, fontSize: 13 }}>
              {weak.slice(0, 3).map((w) => (
                <div key={w.key} className="row between">
                  <span className="muted">Low {SKILL_LABELS[w.key]}</span>
                  <span className="chip crit">avg {w.avg}</span>
                </div>
              ))}
              {weak.slice(-2).reverse().map((w) => (
                <div key={w.key} className="row between">
                  <span className="muted">Strong {SKILL_LABELS[w.key]}</span>
                  <span className="chip good">avg {w.avg}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="pad">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>📋 This week's homework</h3>
            <div className="col" style={{ gap: 8 }}>
              {homework.map((h) => (
                <button key={h.id} className="btn btn-dark btn-sm" style={{ justifyContent: 'space-between' }} onClick={h.action}>
                  <span style={{ textAlign: 'left' }}>{h.text}</span><span>→</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="pad">
            <div className="row between" style={{ marginBottom: 10 }}>
              <h3 style={{ fontSize: 15 }}>📓 Notebook</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const text = window.prompt('New note:')
                  if (text?.trim()) saveNote(text.trim())
                }}
              >＋ Note</button>
            </div>
            <div className="col" style={{ gap: 10 }}>
              {profile.notebook.slice(0, 4).map((n) => (
                <div key={n.id} style={{ fontSize: 12.5, color: 'var(--ink-1)', borderLeft: '2px solid var(--gold)', paddingLeft: 10 }}>
                  {n.text}
                  <div className="row between" style={{ marginTop: 3 }}>
                    <span className="muted" style={{ fontSize: 10.5 }}>{timeAgo(n.ts)}</span>
                    <button
                      className="muted" style={{ fontSize: 10.5 }}
                      onClick={() => updateProfile((p) => { p.notebook = p.notebook.filter((x) => x.id !== n.id) })}
                    >delete</button>
                  </div>
                </div>
              ))}
              {!profile.notebook.length && <p className="muted" style={{ fontSize: 12.5 }}>Capture what works. Your future self closes with it.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

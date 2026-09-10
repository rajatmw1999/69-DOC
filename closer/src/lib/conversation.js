// Conversation engine: a stateful roleplay opponent.
// Replies are CONTEXTUAL: the engine extracts what the user actually said
// (topics, claims, numbers, questions) and answers it in the character's
// voice, echoing their words back, falling back to temperament line pools
// only when nothing specific was detected. Every outgoing line is passed
// through the character's verbal mannerisms (personas.js) so the rhythm
// matches how that person actually talks.
import { mannerize } from './personas.js'

function pickFrom(arr, avoid = [], rng = Math.random) {
  const pool = arr.filter((l) => !avoid.includes(l))
  const src = pool.length ? pool : arr
  return src[Math.floor(rng() * src.length)]
}

const INTENTS = [
  { id: 'greeting', rx: /\b(hi|hey|hello|good (morning|afternoon|evening)|this is [a-z]+|my name is)\b/i },
  { id: 'howAreYou', rx: /\b(how are you|how's it going|how are things|hope you're (well|good)|how's your day)\b/i },
  { id: 'question', rx: /\?|(\b(what|how|why|when|where|who|which|could you|would you|do you|are you|have you|tell me|walk me)\b)/i },
  { id: 'valueProp', rx: /\b(help|save|grow|increase|reduce|improve|results?|revenue|roi|value|benefit|solution|solve|automate|faster|cheaper|streamline)\b/i },
  { id: 'price', rx: /\b(price|cost|pricing|discount|budget|dollar|per month|per year|fee|charge|\$\d)/i },
  { id: 'competitor', rx: /\b(competitor|current (vendor|provider|tool|system)|already (have|using|use)|switch(ing)? from|better than)\b/i },
  { id: 'urgency', rx: /\b(today|right now|this week|limited|only (a few|two|one)|expires?|deadline|before (friday|monday|the end)|last chance)\b/i },
  { id: 'close', rx: /\b(book|schedule|calendar|meeting|demo|next step|sign|deal|move forward|get started|send (you|over) (the|a) (contract|agreement)|tuesday|thursday|monday|friday|wednesday|tomorrow)\b/i },
  { id: 'empathy', rx: /\b(understand|hear you|makes sense|totally get|appreciate|fair|i see|sounds like|feel)\b/i },
  { id: 'social', rx: /\b(clients?|customers?|companies|teams? like|others? (in|like)|case study|worked with)\b/i },
]

const FILLERS = /\b(um+|uh+|like|you know|basically|actually|literally|honestly|kind of|sort of|i mean)\b/gi
const STOP = new Set(['the', 'a', 'an', 'and', 'that', 'this', 'with', 'your', 'you', 'for', 'have', 'just', 'about', 'what', 'would', 'could', 'really', 'very', 'well', 'yeah', 'okay'])

/** Pull the most salient phrase out of the user's utterance so replies can
 *  reference it verbatim. Returns null when nothing decent is found. */
export function extractEcho(text) {
  const t = text.trim().replace(/\s+/g, ' ')
  const clean = (s) => s.trim().replace(/\s+(and|but|so|for|to|that)$/i, '').trim()
  // "your X", they asked about the prospect's world
  let m = t.match(/\b(?:your|you guys'?|the team'?s?|the company'?s?) ([a-z][a-z\s-]{2,38}?)(?=[?.,!;]|$| and | but | so | right)/i)
  if (m) return clean(m[1])
  // "we sell/offer/help with X"
  m = t.match(/\b(?:sell(?:ing)?|offer(?:ing)?|provide|built|help(?:ing)?(?: you| teams| companies)?(?: with)?|save(?: you)?|automate|improve|fix(?:ing)?) ([a-z][a-z\s-]{2,38}?)(?=[?.,!;]|$| and | but | for | in )/i)
  if (m) return clean(m[1])
  // a number claim ("40 percent", "$12k", "ten hours a week")
  m = t.match(/((?:\$\s?)?\d[\d,.]*\s*(?:percent|%|k\b|grand|million|billion|hours?|days?|weeks?|months?|x\b)?(?:\s(?:a|per)\s(?:week|month|day|year))?)/i)
  if (m && m[1].replace(/\D/g, '').length >= 1 && m[1].length > 1) return m[1].trim()
  m = t.match(/\b(ten|twenty|thirty|forty|fifty|hundred|thousand) ([a-z]+ ?[a-z]*)/i)
  if (m) return `${m[1]} ${m[2]}`.trim()
  // fallback: densest 3-word content window
  const words = t.toLowerCase().replace(/[^a-z\s']/g, ' ').split(/\s+/).filter(Boolean)
  let best = null
  let bestLen = 0
  for (let i = 0; i < words.length - 1; i++) {
    const chunk = words.slice(i, i + 3).filter((w) => w.length > 3 && !STOP.has(w))
    const len = chunk.join('').length
    if (chunk.length >= 2 && len > bestLen) { bestLen = len; best = words.slice(i, i + 3).join(' ') }
  }
  return best
}

export function analyzeUtterance(text, lastAiLine = '') {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const fillers = (text.match(FILLERS) || []).length
  const intents = new Set()
  for (const { id, rx } of INTENTS) {
    if (rx.test(text)) intents.add(id)
  }
  // Mirroring: reused ≥2 meaningful words from the prospect's last line
  if (lastAiLine) {
    const aiWords = new Set(lastAiLine.toLowerCase().match(/\b[a-z]{5,}\b/g) || [])
    const reused = (text.toLowerCase().match(/\b[a-z]{5,}\b/g) || []).filter((w) => aiWords.has(w))
    if (reused.length >= 2) intents.add('mirror')
  }
  const isQuestion = intents.has('question')
  const openQuestion = /\b(what|how|why|tell me|walk me)\b/i.test(text) && isQuestion
  return { words: words.length, fillers, intents, isQuestion, openQuestion, echo: extractEcho(text) }
}

/* ── Contextual reply templates ────────────────────────────
   Five voice families cover all temperaments; legend characters override
   individual intents via lines.ctx. Templates containing {echo} are only
   used when an echo phrase was extracted. Buckets: cold (interest < 50)
   vs warm. */
const STYLE_FAMILY = {
  aggressive: 'sharp', intense: 'sharp',
  analytical: 'logic',
  patient: 'folksy', warm: 'folksy', emotional: 'folksy',
  energetic: 'busy', direct: 'busy', haggler: 'busy', dismissive: 'busy',
  reserved: 'posh',
}

const CTX = {
  sharp: {
    question: {
      cold: ["Why do you care about my {echo}? You called ME, get to the point.", "My {echo} is none of your business yet. Earn the answer.", "You're asking questions like we're friends. Pitch first, interrogate later."],
      warm: ["My {echo}? A mess, if I'm honest, nobody's fixed it yet. What have you got?", "Fine, {echo} is the thing that keeps blowing up my week. Why do you ask?", "Good question, actually. It's broken. Impress me with the fix."],
    },
    value: {
      cold: ["'{echo}', every caller this week promised me {echo}. Prove it or hang up.", "Talk is free. {echo} sounds like talk.", "Big claim. I eat big claims for breakfast. Back it up."],
      warm: ["If you can actually deliver {echo}, keep talking.", "Okay, {echo} would matter to me. HOW, specifically?", "Now {echo} is a real promise. Show me the mechanism, not the adjectives."],
    },
    number: {
      cold: ["{echo}, says who? Whose data? Don't quote me marketing.", "You just threw out {echo} like I wouldn't check. I will.", "{echo}? Round numbers make me suspicious."],
      warm: ["{echo}. Okay. If that number's real, this conversation changes. Source?", "I like {echo}. Now defend it."],
    },
    price: {
      cold: ["You're talking money before you've told me why I should care. Bold strategy.", "Price already? Slow down, we just met."],
      warm: ["Don't dance around the number. Say it straight, and say it once.", "Money talk, good, I respect direct. What's the figure?"],
    },
    competitor: {
      cold: ["You don't know a thing about who I use now, so drop the trash talk.", "Everyone says they beat the other guy. The other guy says it too."],
      warm: ["Alright, what do you do that my current guy doesn't? One thing. Go."],
    },
    urgency: {
      cold: ["'Only this week'? Fake deadlines are for amateurs.", "Pressure tactics? I INVENTED pressure tactics, kid."],
      warm: ["If the timing's real, tell me what happens if I wait. Precisely."],
    },
    close: {
      cold: ["A meeting? You haven't earned a second QUESTION yet.", "You're closing on nothing. Where's the value that buys you my calendar?"],
      warm: ["Look at you, asking for the business. Almost there, give me one more reason."],
    },
    greeting: {
      cold: ["Yeah, hi, hello, wonderful. Clock's running, why are you calling?", "Skip the pleasantries. What do you want?"],
      warm: ["Alright, polite AND confident. You've got one minute."],
    },
    howAreYou: {
      cold: ["I'm busy. That's how I am. You've got 20 seconds of my not-busy.", "Don't 'how are you' me, nobody who cold calls cares how I am. What do you want?"],
      warm: ["Winning, as always. Now, what've you got for me?"],
    },
    vague: {
      cold: ["That's it? Come at me with a full sentence.", "I've heard stronger pitches from a fax machine. Try again."],
      warm: ["Half a thought. Finish it."],
    },
  },
  logic: {
    question: {
      cold: ["Our {echo} is adequate. Define the delta you believe you can produce.", "I don't share details about {echo} with unqualified vendors. Qualify yourself first."],
      warm: ["Candidly, our {echo} is three manual steps and a prayer. What exactly would you change?", "Our {echo} costs us more than I'd like. What's your approach?"],
    },
    value: {
      cold: ["Quantify '{echo}'. Baseline, methodology, sample size.", "'{echo}' is a hypothesis, not a result. Where's the evidence?"],
      warm: ["The claim about {echo} is testable. Walk me through the math.", "If {echo} holds at our scale, that's material. What's the limiting constraint?"],
    },
    number: {
      cold: ["{echo}, n of what? Self-reported? Survivorship bias?", "That {echo} figure needs a source or it needs to leave the conversation."],
      warm: ["{echo} would clear our threshold. Send the cohort data with the proposal."],
    },
    price: {
      cold: ["Cost discussion is premature. Value first, then price against it.", "You mentioned money before establishing ROI. That ordering concerns me."],
      warm: ["Fine, fully loaded cost, including implementation and switching risk. Go."],
    },
    competitor: {
      cold: ["Our current vendor's flaws are documented. Yours are simply unknown yet.", "Comparative claims require a comparison table. Do you have one?"],
      warm: ["What's your genuine differentiator, not marketing, mechanism?"],
    },
    urgency: {
      cold: ["Urgency is a sales tactic. We don't respond to tactics.", "A real deadline has a reason attached. State the reason."],
      warm: ["If the window is real, explain the cost of missing it. In numbers."],
    },
    close: {
      cold: ["A meeting requires an agenda and an expected outcome. You've offered neither.", "No. Not yet. Two more of my questions first."],
      warm: ["Acceptable. Send an agenda beforehand, thirty minutes, no slides."],
    },
    greeting: {
      cold: ["Yes, speaking. You have my attention until it stops being relevant.", "Noted. Purpose of the call?"],
      warm: ["Good. You sound prepared. Continue."],
    },
    howAreYou: {
      cold: ["Irrelevant. Purpose of the call, please.", "Functional. Skip the small talk, it depreciates my time."],
      warm: ["Efficient so far, which I appreciate. Proceed."],
    },
    vague: {
      cold: ["That statement contains no information. Restate it with specifics.", "Ambiguity is expensive. Be precise."],
      warm: ["I follow the direction, now anchor it with one concrete example."],
    },
  },
  folksy: {
    question: {
      cold: ["Well now, our {echo}'s been the same for twenty years, and I'm not sure I want a stranger poking at it. Why do you ask?", "Our {echo}? That's a bit personal for a first call, don't you think, hon?"],
      warm: ["Oh, our {echo}? Between you and me, it's a headache. What made you ask about that, of all things?", "Funny you ask about {echo}, my nephew said the same thing last week. Go on."],
    },
    value: {
      cold: ["Sweetheart, everyone who calls promises {echo}. The last one cost me a fortune.", "That's a lovely promise about {echo}. I've got a drawer full of lovely promises."],
      warm: ["Now {echo}, that would genuinely help us. Tell me how it actually works.", "If {echo} is true, you've got my attention. Tell me about someone real it worked for."],
    },
    number: {
      cold: ["{echo}, you say. Numbers dance funny when salespeople hold the music.", "That {echo} sounds rehearsed. Tell me the story behind it instead."],
      warm: ["{echo}, well, that's not nothing. Who exactly got that result?"],
    },
    price: {
      cold: ["Talking money already? We haven't even gotten acquainted.", "The price isn't my worry, dear, being fooled is."],
      warm: ["Alright, let's talk turkey. What's it cost, all-in, no surprises?"],
    },
    competitor: {
      cold: ["I don't switch things that work just because someone calls me on a Tuesday.", "The folks we use now know our name. That's worth more than you'd think."],
      warm: ["What would you do differently than the folks we've got? Honestly, now."],
    },
    urgency: {
      cold: ["Anything that can't wait a week usually shouldn't be bought at all.", "Rush me and I'll say no just on principle."],
      warm: ["If time matters, tell me plainly why. I can move fast for a good reason."],
    },
    close: {
      cold: ["A meeting? Honey, I don't even know your last name yet.", "Not so fast. Charm me a little first, what else you got?"],
      warm: ["You know what? Fine. But come prepared, because I ask a LOT of questions."],
    },
    greeting: {
      cold: ["Well hello to you too. I hope this is worth interrupting my coffee.", "Hi there. Fair warning, I've hung up on nicer voices than yours."],
      warm: ["Now that's a pleasant opening. You've got a few minutes, use them well."],
    },
    howAreYou: {
      cold: ["Oh, I'm fine, thank you for pretending to care. What are you selling?", "Busy day, hon. Say what you called to say."],
      warm: ["Aren't you polite! I'm well. Now, what's on your mind?"],
    },
    vague: {
      cold: ["That was a lot of words and not much said, dear.", "Hmm. Try that again like you mean it."],
      warm: ["I think there's a good idea in there, dig it out for me."],
    },
  },
  busy: {
    question: {
      cold: ["Our {echo}? Why, you writing a report? I've got maybe two minutes.", "The {echo} is fine-ish. Is this going somewhere?"],
      warm: ["Ha, our {echo} is duct tape and a spreadsheet named FINAL_v7. You got something better?", "{echo}'s honestly my biggest headache this month. What do you know?"],
    },
    value: {
      cold: ["'{echo}', sure, sure. Everyone says {echo}. What's the catch?", "Sounds expensive. {echo} always sounds expensive."],
      warm: ["Wait, actual {echo}? Like, this quarter? How fast can I test it?", "Okay {echo} would save my Mondays. Keep going, but fast."],
    },
    number: {
      cold: ["{echo}? That a real number or a brochure number?", "People quote me {echo}-type numbers all day. Nobody delivers."],
      warm: ["{echo}, huh. If that's real I want it in writing."],
    },
    price: {
      cold: ["Whoa, money talk already? What's it cost, ballpark, actually wait, don't tell me.", "If the next word is a price I'm hanging up. ...Okay, what is it though?"],
      warm: ["Just give me the number straight. No 'starting at'. The real one."],
    },
    competitor: {
      cold: ["We duct-taped a solution already. It's ugly but it's mine.", "My cousin set ours up. Insulting it insults my family, careful."],
      warm: ["Okay, what do you do that our current thing doesn't? Thirty seconds."],
    },
    urgency: {
      cold: ["Deadlines from strangers aren't deadlines, buddy.", "Everything's urgent with you people."],
      warm: ["If it's really time-boxed, fine, what do I need to do TODAY?"],
    },
    close: {
      cold: ["A meeting?? I don't have time for the meetings I already have.", "Send me something first. Something SHORT."],
      warm: ["Fine, fine, but make it 15 minutes and bring the demo ready to click."],
    },
    greeting: {
      cold: ["Hey hey, quick, I've got a thing in five.", "Hi. Talking fast is a feature today, not a flaw."],
      warm: ["Hey! Good timing actually. What's up?"],
    },
    howAreYou: {
      cold: ["Slammed. Whatever you're asking, the answer is 'slammed'. Go.", "You already lost 5 seconds on that question. Speed up."],
      warm: ["Surviving! Alright, hit me, what've you got?"],
    },
    vague: {
      cold: ["I got nothing from that. One sentence, what do you do?", "Faster and clearer, my friend. Coffee's getting cold."],
      warm: ["Right idea, wrong speed. Punch it up."],
    },
  },
  posh: {
    question: {
      cold: ["One does not discuss one's {echo} with strangers on the telephone.", "My {echo} is a private matter. Though your curiosity is… noted."],
      warm: ["Our {echo}, since you ask so directly, has been quietly disappointing. Do continue.", "Hm. The {echo} could indeed be… improved. You have five minutes."],
    },
    value: {
      cold: ["'{echo}', how very enthusiastic. Everyone promises {echo}, darling.", "Claims of {echo} are terribly common. Distinction is not."],
      warm: ["If {echo} can be delivered with discretion, I am listening.", "Now {echo}, properly done, would interest me. Craftsmanship, please, not slogans."],
    },
    number: {
      cold: ["{echo}? Vulgar to lead with figures, don't you think?", "Numbers like {echo} belong in a dossier, not a greeting."],
      warm: ["{echo}. Well. Substantiate it in writing and we may proceed."],
    },
    price: {
      cold: ["I don't discuss price. I discuss worth. They are rarely the same.", "Mentioning money this early, how dreadfully transactional."],
      warm: ["Very well. The full figure, stated once, without theatre."],
    },
    competitor: {
      cold: ["Our current arrangements are entirely satisfactory, and entirely private.", "Disparaging one's rivals is the mark of a merchant, not a partner."],
      warm: ["And what, precisely, elevates you above the house we currently use?"],
    },
    urgency: {
      cold: ["Nothing worth having expires on a Friday.", "Scarcity theatre. How tiresome."],
      warm: ["If the opportunity is genuinely finite, explain why, elegantly."],
    },
    close: {
      cold: ["An appointment? We've only just been introduced.", "Presumptuous. Charming, but presumptuous."],
      warm: ["Very well, Thursday, eleven o'clock, and do be punctual."],
    },
    greeting: {
      cold: ["Good afternoon. I do hope this interruption has a purpose.", "Yes, hello. Compose yourself and state your business."],
      warm: ["A civilised opening, how refreshing. Proceed."],
    },
    howAreYou: {
      cold: ["Quite well until the telephone rang. Your business?", "We needn't pretend to intimacy. What is it you want?"],
      warm: ["Well enough, thank you. You have manners, rare in your trade. Go on."],
    },
    vague: {
      cold: ["How vague. Precision, please.", "That sentence wandered in without a purpose. Try another."],
      warm: ["There's a thought in there somewhere. Refine it."],
    },
  },
}

function fillTemplate(line, { echo, topic }) {
  return line
    .replaceAll('{echo}', echo || topic || 'this')
    .replaceAll('{topic}', topic || 'this')
}

export function createConversation({ character, challenge, scenario }) {
  const state = {
    phase: 'opening',            // opening → discovery → objection → closing → done
    interest: 22,                // 0–100, win zone above ~72
    patience: character.temperament.patience, // 0–100, hangup at 0
    objectionsRaised: 0,
    objectionsSurvived: 0,
    turns: 0,
    lastAiLine: '',
    recentLines: [],             // no-repeat guard
    outcome: null,               // 'closed' | 'hangup' | 'ended'
    log: [],                     // coaching events with timestamps
  }

  const lines = character.lines
  const t = character.temperament
  const family = CTX[STYLE_FAMILY[t.style] || 'busy']

  function remember(line) {
    const spoken = mannerize(line, character.id)
    state.lastAiLine = spoken
    // De-dupe against the underlying template, not the decorated variant
    state.recentLines.push(line)
    if (state.recentLines.length > 4) state.recentLines.shift()
    return spoken
  }

  /** Pick a contextual line for an intent, honoring per-character overrides. */
  function ctxLine(intent, analysis) {
    const bucket = state.interest >= 50 ? 'warm' : 'cold'
    const subs = { echo: analysis.echo, topic: scenario?.topic }
    const override = lines.ctx?.[intent]
    let pool = null
    if (override) pool = Array.isArray(override) ? override : override[bucket] || override.cold
    else if (family[intent]) pool = family[intent][bucket]
    if (!pool) return null
    const usable = pool.filter((l) => analysis.echo || !l.includes('{echo}'))
    if (!usable.length) return null
    return fillTemplate(pickFrom(usable, state.recentLines), subs)
  }

  function coachTip(analysis) {
    if (analysis.fillers >= 3) return 'Cut the filler words, pause instead.'
    if (analysis.words > 70) return 'You’re monologuing. Land the point, then ask.'
    if (state.interest < 30 && state.turns > 2) return 'They’re losing interest, ask about THEIR problem.'
    if (!analysis.isQuestion && state.phase === 'discovery') return 'Ask an open-ended question.'
    if (state.phase === 'objection' && !analysis.intents.has('empathy')) return 'Acknowledge the objection before answering it.'
    if (analysis.intents.has('mirror')) return 'Nice mirror. Now go one level deeper.'
    if (state.interest > 62 && state.phase !== 'closing') return 'They’re warm, ask for the meeting.'
    if (analysis.words < 6) return 'Give them more, expand with a reason.'
    return pickFrom(['Slow your pace.', 'Mirror their last sentence.', 'Label their emotion: "Sounds like…"', 'Lower your tone at the end of sentences.'])
  }

  function scoreMove(analysis) {
    let d = 0
    if (analysis.openQuestion) d += 9
    else if (analysis.isQuestion) d += 5
    if (analysis.intents.has('empathy')) d += 7
    if (analysis.intents.has('mirror')) d += 6
    if (analysis.intents.has('valueProp')) d += 4
    if (analysis.intents.has('social')) d += 5
    if (analysis.echo && /\d/.test(analysis.echo)) d += 3 // concrete numbers land
    if (analysis.fillers >= 3) d -= 6
    if (analysis.words > 80) d -= 8
    if (analysis.words < 4) d -= 5
    if (analysis.intents.has('price') && state.phase === 'opening') d -= 7
    if (analysis.intents.has('urgency') && state.interest < 40) d -= 4 // fake pressure backfires
    if (analysis.intents.has('close') && state.interest < 45) d -= 6
    if (analysis.intents.has('close') && state.interest >= 60) d += 8
    return d
  }

  function advancePhase(analysis) {
    if (state.phase === 'opening' && state.turns >= 1) state.phase = 'discovery'
    if (state.phase === 'discovery' && (state.turns >= 3 || analysis.intents.has('price'))) state.phase = 'objection'
    if (state.phase === 'objection' && state.objectionsSurvived >= t.objectionCount) state.phase = 'closing'
  }

  function pickResponse(analysis) {
    // 1) Objection phase: raise an objection, topical when possible.
    const closingStall = state.phase === 'closing' && state.interest < 72 && analysis.intents.has('close')
    if (state.phase === 'objection' || closingStall) {
      state.objectionsRaised += 1
      const emotion = state.interest < 35 ? 'irritated' : 'skeptical'
      for (const topical of ['price', 'competitor', 'urgency']) {
        if (analysis.intents.has(topical)) {
          const line = ctxLine(topical, analysis)
          if (line) return { text: line, emotion }
        }
      }
      return { text: pickFrom(lines.objections, state.recentLines), emotion }
    }
    // 2) Contextual reply to what they actually said, most specific first.
    const order = []
    if (analysis.intents.has('close')) order.push('close')
    if (analysis.echo && /\d/.test(analysis.echo)) order.push('number')
    if (analysis.intents.has('price')) order.push('price')
    if (analysis.intents.has('competitor')) order.push('competitor')
    if (analysis.intents.has('urgency')) order.push('urgency')
    if (analysis.isQuestion) order.push('question')
    if (analysis.intents.has('valueProp')) order.push('value')
    if (state.turns === 1 && analysis.intents.has('howAreYou')) order.unshift('howAreYou')
    else if (state.turns === 1 && analysis.intents.has('greeting')) order.unshift('greeting')
    if (analysis.words < 6) order.push('vague')
    for (const intent of order) {
      const line = ctxLine(intent, analysis)
      if (line) {
        const emotion = state.interest >= 62 ? 'curious' : state.interest <= 25 ? (t.style === 'aggressive' ? 'irritated' : 'flat') : 'neutral'
        return { text: line, emotion }
      }
    }
    // 3) Fall back to interest-bucket pools.
    if (state.interest >= 62) return { text: pickFrom(lines.hooked, state.recentLines), emotion: 'curious' }
    if (state.interest <= 25) return { text: pickFrom(lines.cold, state.recentLines), emotion: t.style === 'aggressive' ? 'irritated' : 'flat' }
    return { text: pickFrom(lines.neutral, state.recentLines), emotion: 'neutral' }
  }

  function reply(userText) {
    state.turns += 1
    const analysis = analyzeUtterance(userText, state.lastAiLine)
    const delta = scoreMove(analysis)
    state.interest = Math.max(0, Math.min(100, state.interest + delta))
    state.patience = Math.max(0, Math.min(100, state.patience + (delta >= 0 ? 2 : delta)))

    state.log.push({
      turn: state.turns, delta,
      good: delta >= 6 ? describeGood(analysis) : null,
      mistake: delta <= -4 ? describeMistake(analysis, state) : null,
    })

    advancePhase(analysis)

    // Hangup: patience exhausted, or opener flopped hard with an impatient character
    if (state.patience <= 0 || (state.turns >= 5 && state.interest <= 8)) {
      state.outcome = 'hangup'
      return { text: remember(pickFrom(lines.hangup)), emotion: 'angry', done: true, outcome: 'hangup', coach: null }
    }

    // Win: close attempt + enough interest
    if (analysis.intents.has('close') && state.interest >= 72) {
      state.outcome = 'closed'
      return { text: remember(pickFrom(lines.win)), emotion: 'warm', done: true, outcome: 'closed', coach: null }
    }

    if (delta >= 4 && state.phase === 'objection') state.objectionsSurvived += Number(state.objectionsRaised > state.objectionsSurvived)

    let { text, emotion } = pickResponse(analysis)
    if (scenario && state.turns === 2 && lines.scenarioHint && !analysis.echo) {
      text = lines.scenarioHint.replace('{topic}', scenario.topic || 'this')
    }
    return { text: remember(text), emotion, done: false, outcome: null, coach: coachTip(analysis), analysis }
  }

  function opener() {
    const line = character.role === 'caller' ? pickFrom(lines.openerInbound || lines.openers) : pickFrom(lines.openers)
    return { text: remember(line), emotion: 'neutral' }
  }

  function endedByUser() {
    if (!state.outcome) state.outcome = 'ended'
  }

  return { state, reply, opener, endedByUser }
}

function describeGood(a) {
  if (a.openQuestion) return 'Open-ended question, pulled them into the conversation.'
  if (a.intents.has('mirror')) return 'Mirrored their language back. Instant rapport.'
  if (a.intents.has('empathy')) return 'Acknowledged their position before pushing forward.'
  if (a.intents.has('social')) return 'Used social proof at the right moment.'
  if (a.intents.has('close')) return 'Asked for the close with confidence.'
  if (a.echo && /\d/.test(a.echo)) return `Anchored on a concrete number (“${a.echo}”).`
  return 'Strong value framing.'
}

function describeMistake(a, state) {
  if (a.fillers >= 3) return `${a.fillers} filler words in one answer, kills authority.`
  if (a.words > 80) return 'Monologued for too long and lost their attention.'
  if (a.intents.has('price') && state.phase === 'opening') return 'Brought up price before establishing value.'
  if (a.intents.has('urgency') && state.interest < 40) return 'Manufactured urgency before earning trust, it read as a tactic.'
  if (a.intents.has('close') && state.interest < 45) return 'Went for the close before earning it.'
  if (a.words < 4) return 'Answer was too thin, gave them nothing to engage with.'
  return 'Passive response, surrendered control of the conversation.'
}

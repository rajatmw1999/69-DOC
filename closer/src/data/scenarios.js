// Scenario generator: turns a free-text prompt into a playable scenario,
// plus the toolkit catalog (extra simulators, playbooks, script templates).

import { CHARACTERS } from './characters.js'

const INDUSTRY_MAP = [
  { rx: /dent(ist|al)/i, industry: 'Dental', persona: 'a busy practice owner between patients' },
  { rx: /doctor|clinic|medical|health/i, industry: 'Healthcare', persona: 'a clinic director drowning in admin' },
  { rx: /solar|energy/i, industry: 'Solar / Energy', persona: 'a homeowner skeptical of door-knockers' },
  { rx: /landlord|tenant|property/i, industry: 'Property', persona: 'a landlord who\'s been burned by vendors' },
  { rx: /real estate|house|listing|home/i, industry: 'Real Estate', persona: 'a seller attached to their price' },
  { rx: /saas|software|app|platform|crm|account/i, industry: 'SaaS', persona: 'a pragmatic operator with tool fatigue' },
  { rx: /restaurant|cafe|food/i, industry: 'Hospitality', persona: 'an owner mid-service with no time' },
  { rx: /gym|fitness/i, industry: 'Fitness', persona: 'a no-nonsense studio owner' },
  { rx: /insurance/i, industry: 'Insurance', persona: 'a young prospect who feels invincible' },
  { rx: /recruit|hire|candidate|talent/i, industry: 'Recruiting', persona: 'a happily-employed senior candidate' },
  { rx: /invest|fund|pitch|vc|capital/i, industry: 'Venture', persona: 'an investor who\'s heard 400 pitches' },
  { rx: /car|auto|vehicle/i, industry: 'Automotive', persona: 'a buyer armed with internet pricing' },
  { rx: /ceo|executive|director|c-suite|demo/i, industry: 'Enterprise', persona: 'an executive with 30 spare seconds' },
  { rx: /cfo|finance|budget/i, industry: 'Finance', persona: 'a CFO who only speaks ROI' },
]

const DIFFICULTY_HINTS = [
  { rx: /skeptic|hostile|angry|hard|tough|difficult|brutal/i, bump: 1 },
  { rx: /friendly|warm|easy|open/i, bump: -1 },
]

const CHARACTER_HINTS = [
  { rx: /cfo|finance/i, id: 'cold-cfo' },
  { rx: /ceo|executive|demo/i, id: 'busy-ceo' },
  { rx: /landlord|skeptic/i, id: 'skeptical-customer' },
  { rx: /solar|door/i, id: 'angry-prospect' },
  { rx: /dent|clinic|doctor|health/i, id: 'procurement-manager' },
  { rx: /real estate|house|listing/i, id: 'real-estate-seller' },
  { rx: /invest|pitch|fund/i, id: 'shark-investor' },
  { rx: /recruit|candidate/i, id: 'recruiter-prospect' },
  { rx: /restaurant|cafe/i, id: 'restaurant-owner' },
  { rx: /gym|fitness/i, id: 'gym-owner' },
  { rx: /insurance/i, id: 'insurance-prospect' },
  { rx: /luxury|premium|high[- ]end/i, id: 'luxury-client' },
  { rx: /budget|cheap|discount|price/i, id: 'budget-buyer' },
  { rx: /startup|founder/i, id: 'startup-founder' },
]

export function generateScenario(promptText) {
  const text = promptText.trim()
  const ind = INDUSTRY_MAP.find((m) => m.rx.test(text))
  const charHint = CHARACTER_HINTS.find((m) => m.rx.test(text))
  const character = charHint
    ? CHARACTERS.find((c) => c.id === charHint.id)
    : CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]

  let difficulty = character.difficulty
  for (const h of DIFFICULTY_HINTS) if (h.rx.test(text)) difficulty = Math.max(1, Math.min(5, difficulty + h.bump))

  const topicMatch = text.match(/sell(?:ing)?\s+([^,.]+?)(?:\s+to\b|$)/i)
  const topic = topicMatch ? topicMatch[1].trim() : (ind ? ind.industry.toLowerCase() + ' services' : 'your offer')

  const objectives = [
    `Open strong enough to earn 60 seconds with ${character.name}.`,
    `Surface at least two pain points relevant to ${topic}.`,
    'Handle the money objection without discounting.',
    'Close on a concrete next step, a booked time, not a "maybe".',
  ]

  return {
    id: `scenario-${Date.now()}`,
    prompt: text,
    title: text.length > 60 ? text.slice(0, 57) + '…' : text,
    topic,
    industry: ind?.industry || character.industry,
    persona: ind?.persona || character.personality,
    characterId: character.id,
    difficulty,
    objectives,
    openingContext: `You are calling ${character.name}, ${ind?.persona || character.personality.toLowerCase()}. Your goal: ${topic}. They did not ask for this call.`,
  }
}

export const SCENARIO_EXAMPLES = [
  'I need to sell accounting software to a dentist.',
  'I need to convince a CEO to book a demo.',
  'I\'m trying to sell solar to a skeptical homeowner.',
  'I\'m calling a skeptical landlord about property management.',
  'Pitch my seed round to a tough investor.',
  'Recruit a senior engineer who isn\'t looking.',
]

// ── Toolkit catalog (extra simulators & tools) ─────────────
export const TOOLKIT_SIMULATORS = [
  { id: 'interview', name: 'Interview Practice', emoji: '🪑', desc: 'Mock interviews with a tough hiring panel.', characterId: 'busy-ceo', tag: 'Career' },
  { id: 'salary', name: 'Salary Negotiation', emoji: '💵', desc: 'Negotiate an offer without leaving money on the table.', characterId: 'cold-cfo', tag: 'Career' },
  { id: 'presentation', name: 'Presentation Rehearsal', emoji: '📽️', desc: 'Rehearse a deck against live interruptions.', characterId: 'steve-jobs', tag: 'Speaking' },
  { id: 'boardroom', name: 'Boardroom Simulation', emoji: '🏛️', desc: 'Defend your quarterly numbers to the board.', characterId: 'warren-buffett', tag: 'Executive' },
  { id: 'investor-meeting', name: 'Investor Meeting', emoji: '📈', desc: 'A full partner-meeting grilling.', characterId: 'shark-investor', tag: 'Fundraising' },
  { id: 'media', name: 'Media Interview', emoji: '🎙️', desc: 'Stay on message against a hostile journalist.', characterId: 'skeptical-customer', tag: 'PR' },
  { id: 'support', name: 'Customer Support', emoji: '🎧', desc: 'De-escalate a furious customer and save the account.', characterId: 'angry-prospect', tag: 'Support' },
  { id: 'crisis', name: 'Crisis Communication', emoji: '🚨', desc: 'Deliver bad news without burning trust.', characterId: 'procurement-manager', tag: 'PR' },
  { id: 'networking', name: 'Networking Simulator', emoji: '🥂', desc: 'Work a virtual conference room with grace.', characterId: 'barbara-corcoran', tag: 'Career' },
  { id: 'exec-coach', name: 'Executive Communication', emoji: '🧭', desc: 'Brief a CEO in 90 seconds flat.', characterId: 'busy-ceo', tag: 'Executive' },
]

export const PLAYBOOKS = [
  { id: 'pb-saas', name: 'B2B SaaS Playbook', emoji: '☁️', plays: 12, desc: 'Land-and-expand motions, POC framing, security-review navigation.' },
  { id: 'pb-re', name: 'Real Estate Playbook', emoji: '🏡', plays: 9, desc: 'FSBO conversion, listing presentations, price-reduction talks.' },
  { id: 'pb-insurance', name: 'Insurance Playbook', emoji: '☂️', plays: 8, desc: 'Needs-based selling, invincibility objections, family framing.' },
  { id: 'pb-recruiting', name: 'Recruiting Playbook', emoji: '🎯', plays: 10, desc: 'Passive candidate outreach, counter-offer defense, close-to-start.' },
  { id: 'pb-auto', name: 'Car Sales Playbook', emoji: '🚗', plays: 7, desc: 'Internet-lead handling, trade-in framing, F&I transitions.' },
  { id: 'pb-luxury', name: 'Luxury Sales Playbook', emoji: '💎', plays: 6, desc: 'Discretion-first selling, provenance stories, never-discount closes.' },
]

export function generateScript({ product, audience, tone }) {
  const toneLine = {
    consultative: 'calm, expert, advisory',
    direct: 'confident, brisk, outcome-first',
    warm: 'friendly, curious, unhurried',
  }[tone] || 'confident, natural'
  return [
    { section: 'Opener', text: `"Hi, this is [YOUR NAME] with [COMPANY], I know I'm calling out of the blue. I work with ${audience || 'teams like yours'}, and I had a specific reason for calling you. Do you have 30 seconds so I can tell you what it is?"` },
    { section: 'Reason + Hook', text: `"We help ${audience || 'people in your position'} fix [TOP PAIN] with ${product || 'our solution'}, most see [CONCRETE RESULT] inside [TIMEFRAME]. The reason I called YOU specifically: [PERSONALIZED TRIGGER]."` },
    { section: 'Discovery Bridge', text: `"Before I say anything else, how are you handling [PROBLEM AREA] today? …And what does that cost you when it goes wrong?"` },
    { section: 'Objection Pre-empt', text: `"You're probably thinking you've heard this pitch before. Fair. Here's what's different: [ONE SHARP DIFFERENTIATOR]. ${tone === 'direct' ? 'I can prove it in one meeting.' : 'I\'d rather show you than tell you.'}"` },
    { section: 'Close', text: `"Here's what I suggest: [DAY] at [TIME], 20 minutes, I'll bring [SPECIFIC VALUE ITEM]. If it's not useful, you'll never hear from me again. Fair enough?"` },
    { section: 'Delivery notes', text: `Keep it ${toneLine}. Pause after the price. Mirror their objections before answering. Talk less than 50% of the time.` },
  ]
}

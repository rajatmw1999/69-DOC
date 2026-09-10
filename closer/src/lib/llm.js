// Optional LIVE conversation via an OpenAI-compatible chat API.
// When the user adds a key in Settings, character replies are generated in
// real time by an LLM — genuinely adaptive, no canned lines. Without a key,
// the local engine (conversation.js) drives the dialogue. Scoring and call
// outcome always stay with the local engine; the LLM only writes the line.

export function llmEnabled(settings = {}) {
  return Boolean(settings.llmKey)
}

function systemPrompt(character, scenario) {
  const speed = character.speakingSpeed > 1.1 ? 'fast, clipped' : character.speakingSpeed < 0.95 ? 'slow, measured' : 'natural'
  return [
    `You are role-playing as ${character.name} — ${character.title}. ${character.personality}.`,
    `Industry: ${character.industry}. Objection style: ${character.objectionStyle}. Sales style you respect: ${character.salesStyle}.`,
    `You are the PROSPECT receiving a cold sales call. The user is the salesperson practicing on you.`,
    scenario ? `Scenario: ${scenario.openingContext || scenario.title}.` : '',
    `Stay 100% in character. Speak how ${character.name} really speaks (${speed}).`,
    `Rules: reply with ONE short spoken turn only (1-3 sentences, under 45 words). No stage directions, no quotation marks, no emojis. React directly to what they just said — reference their actual words. Push back, object, or warm up based on how good their pitch is. Never break character or mention being an AI.`,
  ].filter(Boolean).join('\n')
}

/**
 * Generate one in-character line. `hint` carries the local engine's intent
 * (emotion + whether this should be an objection / close / hangup) so the
 * LLM's tone matches the scored state of the call.
 */
export async function generateLine({ character, scenario, transcript, hint, settings }) {
  const base = settings.llmBase || 'https://api.openai.com/v1'
  const model = settings.llmModel || 'gpt-4o-mini'
  const messages = [{ role: 'system', content: systemPrompt(character, scenario) }]
  // Map transcript → chat roles (AI = the prospect = assistant; user = salesperson = user).
  for (const t of transcript.slice(-12)) {
    messages.push({ role: t.speaker === 'ai' ? 'assistant' : 'user', content: t.text })
  }
  if (hint) {
    const dir = hint.outcome === 'hangup' ? 'You have had enough — end the call curtly.'
      : hint.outcome === 'closed' ? 'They earned it — agree to the next step, a little reluctantly.'
      : hint.emotion === 'irritated' ? 'You are irritated; be sharp.'
      : hint.emotion === 'curious' ? 'They said something good; show genuine interest.'
      : hint.phase === 'objection' ? 'Raise your strongest objection to their last point.'
      : 'Respond naturally and keep control.'
    messages.push({ role: 'system', content: dir })
  }
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.llmKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.9, max_tokens: 80 }),
  })
  if (!res.ok) throw new Error(`llm-${res.status}`)
  const data = await res.json()
  const line = data?.choices?.[0]?.message?.content?.trim()
  if (!line) throw new Error('llm-empty')
  return line.replace(/^["']|["']$/g, '')
}

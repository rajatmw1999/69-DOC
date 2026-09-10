// Daily practice drills, 5-minute exercises rotated daily.

export const DAILY_DRILLS = [
  {
    id: 'random-objection', name: 'Random Objection', emoji: '🛡️', minutes: 2,
    desc: 'One brutal objection, 30 seconds to answer it out loud.',
    prompts: [
      '"Honestly, your competitor is cheaper and does the same thing."',
      '"We tried this two years ago and it was a disaster."',
      '"I need to think about it. Call me next quarter."',
      '"Just send me an email with the details."',
      '"We have no budget until next fiscal year."',
      '"I\'m not the right person for this."',
    ],
  },
  {
    id: 'random-cold-call', name: 'Random Cold Open', emoji: '❄️', minutes: 3,
    desc: 'A surprise prospect answers. Deliver your opener cold.',
    prompts: [
      'A gym owner picks up mid-workout, breathing hard.',
      'A CFO answers thinking you\'re their accountant.',
      'A restaurant owner answers during the lunch rush.',
      'A startup founder answers while pushing code.',
      'A retiree answers who has all day and loves to chat.',
    ],
  },
  {
    id: 'vocab-builder', name: 'Vocabulary Builder', emoji: '📖', minutes: 2,
    desc: 'Three power words. Use each in a sales sentence, out loud.',
    prompts: [
      'leverage · momentum · safeguard', 'streamline · proven · guarantee',
      'exclusive · precision · outcome', 'transform · benchmark · velocity',
      'friction · runway · compounding',
    ],
  },
  {
    id: 'confidence-exercise', name: 'Confidence Rep', emoji: '🦁', minutes: 2,
    desc: 'Deliver your pitch line with zero hedge words, three times.',
    prompts: [
      'State your price with a falling tone, then hold 3 seconds of silence.',
      'Introduce yourself as the expert you\'ll be in 5 years.',
      'Answer "why should I trust you?" in one sentence.',
    ],
  },
  {
    id: 'articulation-drill', name: 'Articulation Sprint', emoji: '🗣️', minutes: 2,
    desc: 'Tongue twisters at increasing speed without dropping a consonant.',
    prompts: [
      '"Unique New York, unique New York" ×5, faster each time.',
      '"The bottom line is a better outcome, guaranteed" ×5.',
      '"Red leather, yellow leather" ×8 without slowing.',
      '"Selling six slick systems to seven skeptical CFOs" ×4.',
    ],
  },
]

export function todaysDrills() {
  const dayIndex = Math.floor(Date.now() / 86400000)
  return DAILY_DRILLS.map((d) => ({
    ...d,
    prompt: d.prompts[dayIndex % d.prompts.length],
  }))
}

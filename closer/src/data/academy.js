// Skill Academy: 29 interactive modules. Each has lessons, a drill, and a quiz.

function q(question, options, answer, why) {
  return { question, options, answer, why }
}

export const ACADEMY = [
  {
    id: 'articulation', name: 'Articulation', emoji: '🗣️', category: 'Voice', level: 'Foundation', minutes: 25,
    description: 'Crisp consonants and clean word endings, the difference between sounding sharp and sounding mumbly.',
    lessons: [
      { title: 'Why mumbling kills deals', takeaway: 'Listeners judge competence within 7 seconds, and slurred endings read as low certainty. Finish every word, especially the last word of a sentence, it carries the meaning.', points: ['Final consonants carry authority', 'Drop volume, never clarity', 'Record yourself daily for 60s'] },
      { title: 'The over-enunciation drill', takeaway: 'Practicing at 120% precision makes 100% automatic. Read one paragraph a day exaggerating every consonant, then re-read it naturally.', points: ['Exaggerate T, D, K, P sounds', 'Slow to 80% speed while drilling', 'Natural speech inherits the crispness'] },
      { title: 'Jaw and tongue warm-ups', takeaway: 'Articulation is physical. Two minutes of jaw release and tongue twisters before call blocks measurably sharpens diction.', points: ['"Red leather, yellow leather" ×10', 'Yawn-stretch the jaw first', 'Warm up BEFORE the first call, not during'] },
    ],
    drill: 'Say: "The bottom line is a better outcome, guaranteed" five times, faster each time, without dropping a single consonant.',
    quiz: [
      q('Which part of a sentence most signals confidence?', ['The first word', 'The final word and its ending', 'The adjectives', 'The pauses'], 1, 'Trailing off at the end of sentences is the #1 marker of uncertainty.'),
      q('The over-enunciation drill works because…', ['It slows you down permanently', 'Practicing beyond target makes the target automatic', 'It builds vocabulary', 'It increases volume'], 1, 'Training past the requirement makes the requirement effortless.'),
      q('When should you do voice warm-ups?', ['After the first call', 'Only before big meetings', 'Before your first call of the day', 'Never, voices don\'t warm up'], 2, 'Your first call deserves the same voice as your tenth.'),
    ],
  },
  {
    id: 'pronunciation', name: 'Pronunciation', emoji: '🔤', category: 'Voice', level: 'Foundation', minutes: 20,
    description: 'Say industry terms, names, and numbers with total precision, hesitation on a word is hesitation on the deal.',
    lessons: [
      { title: 'Names are the highest-stakes words', takeaway: 'Mispronouncing a prospect\'s name or company burns rapport instantly. Verify pronunciation before every call, say it out loud three times.', points: ['Check LinkedIn video/podcasts for names', 'Practice aloud, not mentally', 'If unsure, ask once, early'] },
      { title: 'Numbers that land', takeaway: 'Prices and stats deserve slow, deliberate delivery. "Twelve THOUSAND" with a pause outperforms a rushed "12k" every time.', points: ['Slow down 20% on numbers', 'Pause after the number', 'Never mumble the price'] },
      { title: 'De-risking jargon', takeaway: 'Only use technical terms you can pronounce cold. One stumble over "amortization" undoes ten minutes of authority.', points: ['Build a personal glossary', 'Drill the 20 hardest terms of your industry', 'Substitute simpler words under pressure'] },
    ],
    drill: 'Pick the 5 hardest terms in your industry. Say each in a full sentence, three times, at conversational speed.',
    quiz: [
      q('You\'re unsure how to pronounce a prospect\'s name. Best move?', ['Avoid saying it', 'Guess confidently', 'Ask early, once, then use it correctly', 'Use "you" the whole call'], 2, 'Asking once is respectful; avoiding or guessing wrong compounds the damage.'),
      q('How should you deliver a price?', ['Fast, to get past it', 'Slow, clearly, with a pause after', 'Quietly', 'In an email instead'], 1, 'Deliberate delivery signals the price is fair and non-negotiable.'),
    ],
  },
  {
    id: 'confidence', name: 'Confidence', emoji: '🦁', category: 'Mindset', level: 'Foundation', minutes: 30,
    description: 'Certainty is transferable. Build the vocal and verbal patterns that make prospects borrow your conviction.',
    lessons: [
      { title: 'Kill the hedge words', takeaway: '"Just", "maybe", "kind of", "I think", hedges leak doubt. Replace them with direct statements and let silence do the reassuring.', points: ['Ban "just checking in" forever', '"I think" → "Here\'s what I\'d do"', 'Silence beats softening'] },
      { title: 'Downward inflection', takeaway: 'Statements that rise at the end sound like questions. End your claims with a falling tone, it reads as fact.', points: ['Record one pitch, count the up-talks', 'Drop pitch on the last word', 'Rise only on genuine questions'] },
      { title: 'The confidence loop', takeaway: 'Preparation → small wins → posture → tone. Confidence isn\'t a mood, it\'s a stack of rehearsed behaviors that survive a bad morning.', points: ['Script the first 20 seconds cold', 'Stand up for important calls', 'Review one win before dialing'] },
    ],
    drill: 'Deliver your opener 5 times. Zero hedge words, every sentence ending on a downward inflection.',
    quiz: [
      q('Which phrase leaks the most doubt?', ['"Here\'s what I recommend"', '"I was just kind of wondering if maybe…"', '"The next step is…"', '"Let me show you"'], 1, 'Triple hedge: "just", "kind of", "maybe". Each softener discounts your authority.'),
      q('Upward inflection on a statement makes you sound…', ['Friendly', 'Uncertain, like you\'re asking permission', 'Energetic', 'British'], 1, 'Rising tone converts facts into questions.'),
      q('Confidence on calls primarily comes from…', ['Natural talent', 'Caffeine', 'Rehearsed openings and small wins', 'Loud volume'], 2, 'It\'s a system, not a personality trait.'),
    ],
  },
  {
    id: 'public-speaking', name: 'Public Speaking', emoji: '🎤', category: 'Delivery', level: 'Intermediate', minutes: 35,
    description: 'Command a room, or a Zoom. Structure, pacing, and presence for talks, demos, and team pitches.',
    lessons: [
      { title: 'The 3-part spine', takeaway: 'Every talk is: tension → resolution → call to action. If you can\'t say your talk in one sentence, the audience can\'t remember it in one week.', points: ['Open with the problem, not your bio', 'One core message per talk', 'End with a specific ask'] },
      { title: 'Pace is punctuation', takeaway: 'Speed up through stories, slow down for conclusions, and stop completely before your most important line. Silence is your highlighter.', points: ['Pause 2s before the key point', 'Vary pace every 90 seconds', 'Never rush the ending'] },
      { title: 'Eyes and anchors', takeaway: 'Pick three people (or the lens) and deliver full sentences to each. Darting eyes read as nerves; steady eyes read as leadership.', points: ['One sentence per person', 'Camera = the only audience member online', 'Plant your feet'] },
    ],
    drill: 'Give a 60-second talk on any object near you: problem → insight → ask. Record it and count your pauses.',
    quiz: [
      q('Your most important line deserves…', ['Maximum volume', 'A full pause before it', 'Slides behind it', 'Repetition ×3'], 1, 'The silence before a line is what makes the room lean in.'),
      q('On video calls, "eye contact" means…', ['Watching their video tile', 'Looking at the camera lens', 'Looking at your notes', 'Closing your eyes'], 1, 'The lens is where their eyes live.'),
    ],
  },
  {
    id: 'storytelling', name: 'Storytelling', emoji: '📖', category: 'Persuasion', level: 'Intermediate', minutes: 30,
    description: 'Facts inform; stories sell. Build a bank of 90-second customer stories that carry your pitch for you.',
    lessons: [
      { title: 'The customer-story skeleton', takeaway: 'Situation → struggle → turn → number. "A gym owner like you was losing 30% of January signups… now retention is 84%." Ninety seconds, one hero, one number.', points: ['Hero = someone like the prospect', 'One vivid detail beats five stats', 'End on a concrete number'] },
      { title: 'Why the brain buys narrative', takeaway: 'Stories bypass counter-arguing: listeners simulate rather than evaluate. A prospect can argue with your claim; they can\'t argue with your customer\'s experience.', points: ['Claims trigger skepticism', 'Stories trigger simulation', 'Specificity = believability'] },
      { title: 'The story bank', takeaway: 'Elite sellers maintain 5–7 rehearsed stories mapped to the 5–7 most common objections. When "too expensive" comes, a story answers it before logic does.', points: ['One story per top objection', 'Rehearse aloud until 90s each', 'Rotate quarterly'] },
    ],
    drill: 'Tell one customer story in exactly 90 seconds: situation, struggle, turn, number. No pitch attached.',
    quiz: [
      q('The hero of a sales story should be…', ['You', 'Your company', 'A customer similar to the prospect', 'An analyst firm'], 2, 'Prospects insert themselves into the hero\'s seat, make the seat fit.'),
      q('Stories beat claims because listeners…', ['Have short attention spans', 'Simulate stories instead of arguing with them', 'Prefer entertainment', 'Remember names'], 1, 'Narrative transport suspends counter-arguing.'),
    ],
  },
  {
    id: 'negotiation', name: 'Negotiation', emoji: '⚖️', category: 'Persuasion', level: 'Advanced', minutes: 40,
    description: 'Anchors, concessions, and calibrated questions, hold your margin without losing the relationship.',
    lessons: [
      { title: 'Anchor first, anchor high', takeaway: 'The first number spoken warps the whole negotiation toward it. Anchor above your target with a justification attached, then negotiate down slowly and reluctantly.', points: ['First number = gravity', 'Always pair anchor with rationale', 'Flinch at their counter'] },
      { title: 'Never free concessions', takeaway: 'Every concession must be traded: "If I can do X, can you commit to Y today?" Free discounts teach buyers to keep pushing.', points: ['Trade, never give', 'Shrink concessions each round', 'Get commitment before conceding'] },
      { title: 'Calibrated questions', takeaway: '"How am I supposed to do that?" makes the other side solve YOUR constraint. Open questions starting with How/What move pressure across the table.', points: ['"How can we make this work?"', 'Never ask questions answerable by "no"', 'Silence after asking'] },
    ],
    drill: 'Roleplay: buyer demands 30% off. Respond with a trade, a calibrated question, and a shrinking concession, in that order.',
    quiz: [
      q('The first number named in a negotiation…', ['Should always come from the buyer', 'Anchors the entire range', 'Is irrelevant', 'Should be your walk-away'], 1, 'Anchoring bias pulls every subsequent number toward the first one.'),
      q('A prospect asks for a discount. Best response?', ['"Sure, 10% off"', '"No."', '"If I can do that, can you sign this week?"', '"Let me ask my manager"'], 2, 'Concessions are currency, always trade them for commitment.'),
      q('"How am I supposed to do that?" works because it…', ['Sounds desperate', 'Transfers the problem to their side of the table', 'Buys time', 'Flatters them'], 1, 'Calibrated questions make them negotiate against themselves.'),
    ],
  },
  {
    id: 'persuasion', name: 'Persuasion', emoji: '🧲', category: 'Persuasion', level: 'Intermediate', minutes: 35,
    description: 'The six levers of influence, applied ethically to sales conversations.',
    lessons: [
      { title: 'Reciprocity and commitment', takeaway: 'Give real value first, an insight, an audit, a benchmark. Then secure micro-commitments: each small "yes" makes the big yes consistent behavior.', points: ['Lead with a gift of insight', 'Stack small agreements', 'People act consistent with stated positions'] },
      { title: 'Social proof and authority', takeaway: 'Name peers, not logos: "three dental practices in your zip code" beats "Fortune 500 clients". Borrow authority with specifics, credentials, and calm.', points: ['Similarity beats prestige', 'Specific numbers = credibility', 'Calm is the sound of authority'] },
      { title: 'Scarcity without sleaze', takeaway: 'Real deadlines and real capacity limits persuade; fake countdown timers destroy trust. State genuine constraints plainly and let them do the work.', points: ['Only true scarcity', 'Losses loom larger than gains', 'State it once, don\'t hammer it'] },
    ],
    drill: 'Rewrite this weak line using social proof + scarcity: "We can probably help your restaurant, if you\'re interested."',
    quiz: [
      q('The most persuasive social proof for a dentist prospect is…', ['A Fortune 500 logo', 'Another dentist one town over', 'A celebrity endorsement', 'Your revenue'], 1, 'Similarity is the multiplier on social proof.'),
      q('Micro-commitments work because of…', ['Scarcity', 'Consistency bias', 'Reciprocity', 'Fatigue'], 1, 'People align future behavior with past stated positions.'),
    ],
  },
  {
    id: 'mirroring', name: 'Mirroring', emoji: '🪞', category: 'Rapport', level: 'Foundation', minutes: 20,
    description: 'Repeat the last 1–3 critical words with an upward tone. The simplest rapport tool that exists.',
    lessons: [
      { title: 'The mechanics', takeaway: 'Prospect: "We\'re drowning in manual reporting." You: "Manual reporting?", then silence. They elaborate 90% of the time, handing you the discovery for free.', points: ['Last 1–3 words only', 'Slight upward inflection', 'Then shut up'] },
      { title: 'When to mirror', takeaway: 'Mirror emotion words and vague quantifiers: "a nightmare", "too slow", "a lot". Never mirror pleasantries, mirror the words carrying pain.', points: ['Mirror pain, not smalltalk', 'Vague words hide gold', 'Max 2–3 mirrors per call'] },
      { title: 'Vocal matching', takeaway: 'Match their pace and volume ±20%. A fast talker trusts fast talkers; a quiet CFO trusts calm. Matching is subliminal rapport, mimicry is not the goal.', points: ['Match pace, then lead it', 'Never match anger', 'Down-shift to de-escalate'] },
    ],
    drill: 'For your next 3 exchanges (with anyone), respond first with a 3-word mirror before saying anything else.',
    quiz: [
      q('A prospect says "the rollout was a total nightmare". You mirror…', ['"So you had some issues?"', '"A total nightmare?"', '"Why was it bad?"', '"Our rollout is easy"'], 1, 'Mirror their exact emotional words, they\'ll unpack the nightmare unprompted.'),
      q('After mirroring, you should…', ['Explain your product', 'Ask another question', 'Stay silent', 'Apologize'], 2, 'The silence is what pulls the elaboration out.'),
    ],
  },
  {
    id: 'rapport', name: 'Rapport Building', emoji: '🤝', category: 'Rapport', level: 'Foundation', minutes: 25,
    description: 'Trust in the first 90 seconds: labeling, tactical empathy, and earned informality.',
    lessons: [
      { title: 'Labels over questions', takeaway: '"Sounds like this quarter\'s been brutal" lands softer than "How\'s business?". Labeling emotion ("Seems like…", "Sounds like…") shows you\'re reading them, not running a script.', points: ['"Seems like / sounds like / looks like"', 'Label negatives to defuse them', 'Wrong labels still build trust, they\'ll correct you'] },
      { title: 'The competence-warmth sequence', takeaway: 'Open with warmth, prove competence by minute two. Warmth without competence is a chat; competence without warmth is a lecture. You need both, in that order.', points: ['Warmth first, always', 'One sharp insight = instant competence', 'Match their formality level'] },
      { title: 'Earned informality', takeaway: 'Start slightly more formal than the prospect and relax as they do. Premature buddy-talk ("my friend!") reads as manipulation.', points: ['Mirror their register', 'Let THEM go casual first', 'Names > nicknames until invited'] },
    ],
    drill: 'Write three "Sounds like…" labels for a prospect who just said they\'re "too busy for this right now".',
    quiz: [
      q('"Sounds like the timing is terrible" is an example of…', ['A close', 'Emotional labeling', 'An objection', 'Mirroring'], 1, 'Labels demonstrate empathy without demanding an answer.'),
      q('Who should relax the formality of a call first?', ['You, to seem friendly', 'The prospect', 'Nobody', 'Your manager'], 1, 'Follow their lead, premature informality feels manipulative.'),
    ],
  },
  {
    id: 'objection-handling', name: 'Objection Handling', emoji: '🛡️', category: 'Core Sales', level: 'Intermediate', minutes: 40,
    description: 'The AAA framework, Acknowledge, Ask, Answer, against the twelve objections that end 90% of calls.',
    lessons: [
      { title: 'Objections are buying signals', takeaway: 'Silence kills deals; objections mean engagement. "Too expensive" translates to "I don\'t see the value yet", an invitation, not a verdict.', points: ['Fear the quiet prospect, not the loud one', 'Decode the objection beneath the objection', 'Never argue with the surface words'] },
      { title: 'The AAA framework', takeaway: 'Acknowledge ("Fair, most clients said the same"), Ask ("Compared to what, out of curiosity?"), Answer (story + number). Answering first, before acknowledging, triggers resistance.', points: ['Acknowledge WITHOUT agreeing', 'Ask to isolate the real blocker', 'Answer with a story, not a spec'] },
      { title: 'Isolate before you solve', takeaway: '"If we solved the price, is there anything else stopping you?", solving an objection that isn\'t the real one wastes your best material.', points: ['"If we solved X, would you move forward?"', 'Smoke out hidden objections early', 'The second objection is usually the real one'] },
    ],
    drill: 'Handle "we already have a vendor" with full AAA: one acknowledge line, one isolating question, one story-based answer.',
    quiz: [
      q('"It\'s too expensive" usually means…', ['They\'re poor', 'The value isn\'t established yet', 'The call is over', 'You should discount'], 1, 'Price objections are value objections wearing a disguise.'),
      q('First step when an objection lands?', ['Refute it with data', 'Acknowledge it', 'Lower the price', 'Change the subject'], 1, 'Acknowledgment lowers their defenses so the answer can land.'),
      q('Why isolate an objection before answering?', ['To buy time', 'To confirm it\'s the REAL blocker', 'To sound smart', 'To avoid answering'], 1, 'Otherwise you solve decoys while the real objection hides.'),
    ],
  },
  {
    id: 'closing', name: 'Closing', emoji: '✍️', category: 'Core Sales', level: 'Advanced', minutes: 35,
    description: 'Assumptive, alternative, and summary closes, and the discipline to actually ask.',
    lessons: [
      { title: 'The ask is the job', takeaway: '60% of sales conversations end with no ask at all. A mediocre close attempted beats a perfect close imagined. Decide your closing question before dialing.', points: ['Pre-commit to the ask', 'Rejection is data, not damage', 'No ask = guaranteed no'] },
      { title: 'Three closes that work', takeaway: 'Assumptive: "I\'ll send the agreement tonight." Alternative: "Tuesday or Thursday?" Summary: restate their three yeses, then ask. Match the close to the prospect\'s energy.', points: ['Assumptive for warm prospects', 'Alternative for busy ones', 'Summary for analytical ones'] },
      { title: 'Shut up after asking', takeaway: 'After the closing question, the first person to speak concedes. The silence feels eternal to you and thoughtful to them. Hold it.', points: ['Ask, then total silence', 'Don\'t re-pitch into the pause', 'Their silence = processing, not rejection'] },
    ],
    drill: 'Write your assumptive, alternative, and summary closes for your current product. Say each aloud, then 5 seconds of silence.',
    quiz: [
      q('The most common closing mistake is…', ['Asking too aggressively', 'Never asking at all', 'Asking too early', 'Offering options'], 1, 'Most calls simply end without a closing question.'),
      q('After you ask the closing question…', ['Explain the pricing again', 'Stay silent until they answer', 'Offer a discount', 'Ask if they have questions'], 1, 'Speaking first re-opens the negotiation against yourself.'),
    ],
  },
  {
    id: 'discovery-questions', name: 'Discovery Questions', emoji: '🔍', category: 'Core Sales', level: 'Intermediate', minutes: 30,
    description: 'Questions that make prospects sell themselves: open, layered, and consequence-driven.',
    lessons: [
      { title: 'Open beats closed', takeaway: '"What\'s your current process?" earns paragraphs; "Do you have a process?" earns yes. Open questions (What/How/Walk me through) generate the material you\'ll close with.', points: ['Start with What/How/Tell me', 'One question at a time', 'Follow the energy in their answer'] },
      { title: 'The three-layer dig', takeaway: 'Surface → impact → consequence. "Reporting is slow" → "What does slow cost you?" → "What happens if that continues through Q4?" The third layer is where budgets appear.', points: ['Never stop at the surface answer', 'Quantify the pain in THEIR numbers', 'Future-pace the consequence'] },
      { title: 'Diagnose before prescribing', takeaway: 'Pitching before three discovery questions is malpractice. Prospects buy from sellers who understand their problem better than they do.', points: ['3 questions before any pitch', 'Summarize their answer back', 'Their words become your close'] },
    ],
    drill: 'Turn these closed questions into open ones: "Do you have budget?" / "Is speed important?" / "Are you the decision maker?"',
    quiz: [
      q('Which question digs to the consequence layer?', ['"Do you have this problem?"', '"What happens if this continues another year?"', '"Who\'s your vendor?"', '"Can I show you a demo?"'], 1, 'Consequence questions convert pain into urgency.'),
      q('Before pitching, you should ask at least…', ['One question', 'Three discovery questions', 'Ten questions', 'No questions, pitch first'], 1, 'Diagnosis before prescription, always.'),
    ],
  },
  {
    id: 'tone-control', name: 'Tone Control', emoji: '🎚️', category: 'Voice', level: 'Intermediate', minutes: 25,
    description: 'The late-night FM voice, the upbeat opener, the analyst calm, and when to deploy each.',
    lessons: [
      { title: 'Your three gears', takeaway: 'Playful (openers, rapport), direct (facts, prices), and downward calm (objections, tension). Most reps have one gear; closers shift deliberately.', points: ['Playful ≠ unprofessional', 'Direct for numbers', 'Calm-slow when they escalate'] },
      { title: 'The de-escalation voice', takeaway: 'When a prospect heats up, drop your pitch and pace 20%. Matching anger loses; absorbing it wins. The calm voice is authority under fire.', points: ['Slower + lower defuses', 'Never match hostility', 'Pause before responding to attacks'] },
      { title: 'Smiling is audible', takeaway: 'Phone strips your face but not your physiology. A genuine smile changes resonance measurably, prospects hear it. So does slouching.', points: ['Smile on greetings and closes', 'Sit or stand tall', 'Gesture naturally, it colors tone'] },
    ],
    drill: 'Say "That\'s a great question, here\'s the honest answer" in all three gears: playful, direct, calm-low.',
    quiz: [
      q('A prospect gets aggressive. Your voice should…', ['Match their intensity', 'Go slower and lower', 'Go silent', 'Speed up to finish'], 1, 'De-escalation is a vocal skill: slow, low, calm.'),
      q('Why smile during phone calls?', ['It doesn\'t matter', 'It changes vocal resonance audibly', 'It\'s polite', 'For video calls only'], 1, 'Facial posture reshapes your sound.'),
    ],
  },
  {
    id: 'voice-projection', name: 'Voice Projection', emoji: '📢', category: 'Voice', level: 'Foundation', minutes: 20,
    description: 'Diaphragmatic support for a voice that carries without shouting.',
    lessons: [
      { title: 'Breathe from the floor', takeaway: 'Chest breathing = thin, tense sound. Diaphragmatic breathing = warm, full projection. Hand on stomach: it should move, not your shoulders.', points: ['Belly out on inhale', '4-count in, 6-count out', 'Practice lying down first'] },
      { title: 'Volume vs. projection', takeaway: 'Shouting is throat; projection is breath. A projected quiet voice beats a shouted one, it carries intent, not strain.', points: ['Support from the diaphragm', 'Open the throat, drop the jaw', 'End of sentence = full support'] },
    ],
    drill: 'Count 1–10 on one breath, each number fully supported, without the volume dropping on 9 and 10.',
    quiz: [
      q('Proper breathing for projection moves your…', ['Shoulders', 'Chest only', 'Stomach', 'Neck'], 2, 'The diaphragm drives the breath; shoulders should stay still.'),
      q('Projection differs from volume because it uses…', ['More throat', 'Breath support instead of strain', 'A microphone', 'Higher pitch'], 1, 'Projected sound is supported, not forced.'),
    ],
  },
  {
    id: 'leadership-comm', name: 'Leadership Communication', emoji: '🧭', category: 'Executive', level: 'Advanced', minutes: 35,
    description: 'Brief like a commander: bottom line up front, decisions framed, dissent invited on your terms.',
    lessons: [
      { title: 'BLUF: bottom line up front', takeaway: 'Leaders state the conclusion, then the reasoning. Burying the ask under context reads as insecurity, executives decide in the first 30 seconds whether to keep listening.', points: ['Conclusion → evidence → ask', 'One page, one message', 'Details on request only'] },
      { title: 'Framing decisions', takeaway: 'Present options as "A, B, or C, I recommend B because…". Recommending nothing outsources your judgment; recommending everything hides it.', points: ['Always bring a recommendation', 'Name the tradeoff you\'re accepting', 'Own the call, invite the challenge'] },
    ],
    drill: 'Rewrite this update BLUF-style: "So we tried a few things this sprint, the API had issues, vendors were slow, and eventually we decided to delay launch two weeks."',
    quiz: [
      q('BLUF means…', ['Be loud, use force', 'Bottom line up front', 'Brief, useful, factual', 'Build up slowly'], 1, 'State the conclusion first; earn the details.'),
      q('When presenting options to executives…', ['Stay neutral between them', 'Recommend one and defend it', 'Present only one', 'Let them guess'], 1, 'Your recommendation IS the value you bring.'),
    ],
  },
  {
    id: 'executive-presence', name: 'Executive Presence', emoji: '🕴️', category: 'Executive', level: 'Advanced', minutes: 30,
    description: 'Gravitas is behavioral: fewer words, longer pauses, zero scramble.',
    lessons: [
      { title: 'The economy of words', takeaway: 'Presence correlates inversely with word count. Answer in one sentence, pause, offer depth only if wanted. Rambling is the uniform of the junior.', points: ['Answer, then stop', 'Let silence sit', '"Say less" is a strategy'] },
      { title: 'Unshakeable under questions', takeaway: 'Hostile question → pause → "Good question" → one-line answer. Speed of response signals panic; the pause signals you\'ve seen this before.', points: ['Pause before hard answers', 'Never repeat the negative framing', 'Bridge to your message'] },
    ],
    drill: 'Answer "Why should we trust your forecast?" in exactly one sentence, after a full two-second pause.',
    quiz: [
      q('Executive presence sounds like…', ['Fast, detailed answers', 'Short answers with comfortable pauses', 'Loud confidence', 'Formal vocabulary'], 1, 'Calm brevity is the signature of authority.'),
      q('When attacked with a hostile question…', ['Answer instantly to show sharpness', 'Pause, then answer briefly', 'Deflect to a colleague', 'Repeat their framing while denying it'], 1, 'The pause reframes you as unshakeable.'),
    ],
  },
  {
    id: 'small-talk', name: 'Small Talk', emoji: '☕', category: 'Rapport', level: 'Foundation', minutes: 20,
    description: 'From weather to warmth in 90 seconds: observations, callbacks, and graceful exits.',
    lessons: [
      { title: 'Observation beats interrogation', takeaway: '"How\'s it going" gets "fine". "You sound like you\'re mid-sprint today" gets a real answer. Open with a specific observation, not a template.', points: ['Comment, then question', 'Specificity invites honesty', 'Their calendar/context is material'] },
      { title: 'The callback', takeaway: 'Referencing something from a previous chat ("How was the Denver trip?") is the highest-ROI rapport move that exists. Keep notes; deploy callbacks.', points: ['Note one personal detail per call', 'Open the NEXT call with it', 'CRM the human stuff too'] },
    ],
    drill: 'Write observation-based openers for: a prospect who sounds rushed, one with a dog barking, one who mentioned a vacation last call.',
    quiz: [
      q('The strongest small-talk opener is…', ['"How are you?"', 'A specific observation about their context', '"Crazy weather!"', 'A joke'], 1, 'Specificity signals genuine attention.'),
      q('A "callback" in rapport means…', ['Calling them back later', 'Referencing a detail from a previous conversation', 'Repeating their words', 'A follow-up email'], 1, 'It proves you listened last time, instant trust.'),
    ],
  },
  {
    id: 'business-english', name: 'Business English', emoji: '💼', category: 'Language', level: 'Foundation', minutes: 30,
    description: 'The 200 phrases of professional fluency: meetings, negotiation, email-grade clarity out loud.',
    lessons: [
      { title: 'Precision phrases', takeaway: 'Swap vague verbs for precise ones: "touch base" → "align on next steps"; "circle back" → "answer by Thursday". Precision reads as competence in any accent.', points: ['Kill corporate filler', 'Verbs with deadlines', 'Shorter sentences, stronger verbs'] },
      { title: 'Disagreeing professionally', takeaway: '"I see it differently, here\'s why" disagrees without war. Learn the softeners that keep doors open: "My concern is…", "What am I missing?"', points: ['Disagree with data, not adjectives', 'Question your own view aloud', 'Never "you\'re wrong", always "I see it differently"'] },
    ],
    drill: 'Translate into crisp business English: "We should maybe kind of try to sync up sometime about the thing."',
    quiz: [
      q('The professional way to disagree is…', ['"That\'s wrong"', '"I see it differently, here\'s why"', 'Silence', '"Whatever you think"'], 1, 'State the disagreement plus reasoning; skip the verdict on the person.'),
      q('"Let\'s circle back" is weak because…', ['It\'s rude', 'It has no owner or deadline', 'It\'s too formal', 'It\'s American'], 1, 'Commitments need a who and a when.'),
    ],
  },
  {
    id: 'accent-neutral', name: 'Accent Neutralization', emoji: '🌍', category: 'Language', level: 'Intermediate', minutes: 35,
    description: 'Clarity over disguise: rhythm, stress patterns, and the 20 sounds that cause most misunderstandings.',
    lessons: [
      { title: 'Clarity, not erasure', takeaway: 'The goal is being understood effortlessly, not sounding like a newsreader. Focus on stress and rhythm, they carry more intelligibility than individual sounds.', points: ['Stress the content words', 'English is stress-timed', 'Accents are fine; ambiguity is not'] },
      { title: 'The high-impact sounds', takeaway: 'TH, V/W, and word-final consonants cause most breakdowns. Drill your personal top five confusions, a targeted 10 minutes beats an hour of general practice.', points: ['Record, find YOUR five', 'Minimal pairs daily (vest/west)', 'Slow is clear; clear is fast'] },
    ],
    drill: 'Minimal pairs ×5 each: "vest/west", "think/sink", "price/prize", then one full sentence with each word.',
    quiz: [
      q('The biggest driver of intelligibility in English is…', ['Perfect vowels', 'Stress and rhythm', 'Speed', 'Vocabulary'], 1, 'Stress-timing carries meaning even when sounds vary.'),
      q('Accent training should target…', ['Every sound equally', 'Your personal top-five confusion sounds', 'Only vowels', 'Volume'], 1, 'Targeted drilling on your actual confusions pays fastest.'),
    ],
  },
  {
    id: 'listening', name: 'Listening Skills', emoji: '👂', category: 'Rapport', level: 'Foundation', minutes: 25,
    description: 'Hear what they didn\'t say: active listening, note discipline, and the 45% talk-time target.',
    lessons: [
      { title: 'The 45/55 rule', takeaway: 'Top-performing discovery calls run ~45% rep talk time. Listening isn\'t politeness, it\'s data collection for the close.', points: ['Track your ratio (Closer does this)', 'Questions are the steering wheel', 'Their words close the deal later'] },
      { title: 'Listen for the fourth layer', takeaway: 'Facts → feelings → intentions → fears. "We\'re re-evaluating vendors" (fact) often hides "I inherited this mess and I\'m scared" (fear). Sell to layer four.', points: ['Note emotion words verbatim', 'Ask about the feeling, not just the fact', 'Fears drive B2B decisions'] },
      { title: 'Proof of listening', takeaway: 'Summarize what you heard before you respond: "So the rollout stalled twice and the team\'s skeptical, did I get that right?" Earn the right to pitch.', points: ['Summarize before solving', '"Did I get that right?"', 'Their correction = free discovery'] },
    ],
    drill: 'In your next conversation, summarize the other person\'s point to their satisfaction before making yours. Repeat ×3.',
    quiz: [
      q('The ideal rep talk-time in discovery is roughly…', ['70%', '45%', '20%', '90%'], 1, 'Slightly under half, steering with questions, collecting with silence.'),
      q('"We\'re re-evaluating vendors", the layer to sell to is…', ['The stated fact', 'The underlying fear or motivation', 'The budget', 'The timeline'], 1, 'Decisions are made at the fear/intention layer and justified with facts.'),
    ],
  },
  {
    id: 'memory-recall', name: 'Memory Recall', emoji: '🧠', category: 'Mindset', level: 'Intermediate', minutes: 25,
    description: 'Names, numbers, and commitments, remembered cold. Memory is a closing tool.',
    lessons: [
      { title: 'The name lock', takeaway: 'Hear it → use it in 10 seconds → attach an image → use it at goodbye. Names remembered at call two are rapport rocket fuel.', points: ['Immediate first use', 'Visual association', 'Say it at the close'] },
      { title: 'The commitment ledger', takeaway: 'Every promise you make ("I\'ll send the case study by 5") is a trust test. Write commitments the second you make them, reliability compounds.', points: ['Log promises in real time', 'Under-promise, over-deliver', 'Reference kept promises later'] },
    ],
    drill: 'After your next call, write from memory: their name, three facts, every number mentioned, and each commitment made. Then check.',
    quiz: [
      q('The best moment to first use a person\'s name is…', ['At the close only', 'Within 10 seconds of hearing it', 'Never, it\'s cheesy', 'In the follow-up email'], 1, 'Immediate use encodes it and warms the exchange.'),
      q('Kept micro-commitments matter because…', ['They\'re legally binding', 'Trust compounds from small proofs', 'They fill the CRM', 'Prospects forget them'], 1, 'Every kept promise raises the believability of your big claims.'),
    ],
  },
  {
    id: 'handling-rejection', name: 'Handling Rejection', emoji: '🧱', category: 'Mindset', level: 'Foundation', minutes: 25,
    description: 'Detach outcome from identity. Rejection is volume\'s tollbooth, build the bounce-back ritual.',
    lessons: [
      { title: 'The math of no', takeaway: 'At a 4% cold-call conversion, 24 nos per yes is the SYSTEM WORKING. Track leading indicators (dials, conversations), the nos are inventory, not verdicts.', points: ['Know your ratios cold', 'A "no" moves you closer to the next yes', 'Judge weeks, not calls'] },
      { title: 'The 90-second reset', takeaway: 'After a brutal call: stand, breathe 4-7-8 twice, write one lesson, dial again within 90 seconds. Rumination between calls is where confidence dies.', points: ['Physical reset first', 'One lesson, one line', 'Next dial fast, momentum heals'] },
    ],
    drill: 'Write your personal 90-second reset ritual. Then simulate: take a brutal hangup in the simulator and run it.',
    quiz: [
      q('24 rejections at a 4% close rate means…', ['You\'re failing', 'The system is working as designed', 'Change careers', 'Scripts are broken'], 1, 'Rejection volume is priced into the math of outbound.'),
      q('The most dangerous time after a bad call is…', ['The next morning', 'The idle minutes before the next dial', 'The weekend', 'Lunch'], 1, 'Rumination gaps compound doubt, dial again fast.'),
    ],
  },
  {
    id: 'emotional-intelligence', name: 'Emotional Intelligence', emoji: '💗', category: 'Mindset', level: 'Intermediate', minutes: 30,
    description: 'Read the emotional weather, regulate your own, and respond to the feeling before the fact.',
    lessons: [
      { title: 'Detect the shift', takeaway: 'Shorter answers, slower replies, flatter tone, disengagement has audio signatures. Name it early: "I might\'ve lost you, what\'s on your mind?"', points: ['Track answer length over the call', 'Silence after a price = processing', 'Name the shift, don\'t plow past it'] },
      { title: 'Regulate before you respond', takeaway: 'Between stimulus and response there\'s a breath. Take it. Reactive selling, defensiveness, over-explaining, reads instantly as insecurity.', points: ['One breath before hard replies', 'Name your own state silently', 'Respond to their FEELING first'] },
    ],
    drill: 'Watch any interview. Note every emotional shift in the guest and what triggered it. Ten minutes, minimum five shifts.',
    quiz: [
      q('A prospect\'s answers get suddenly shorter. You should…', ['Talk faster', 'Acknowledge the shift and ask what\'s up', 'Push to close now', 'End the call'], 1, 'Naming disengagement early is the only cure for it.'),
      q('Responding to "the feeling before the fact" means…', ['Ignoring logic', 'Acknowledging the emotion, then addressing content', 'Being emotional yourself', 'Apologizing constantly'], 1, 'Un-acknowledged emotion blocks all logical processing.'),
    ],
  },
  {
    id: 'sales-psychology', name: 'Sales Psychology', emoji: '🧬', category: 'Persuasion', level: 'Advanced', minutes: 40,
    description: 'Loss aversion, status quo bias, and the buying brain, the science under every technique.',
    lessons: [
      { title: 'Loss beats gain 2:1', takeaway: 'Framing as protection-from-loss ("you\'re leaking $4k/month") activates twice the motivation of equivalent gain framing ("save $4k/month"). Use responsibly.', points: ['Quantify the current leak', 'Status quo has a cost, name it', 'Gain framing for visionaries, loss for pragmatists'] },
      { title: 'The status quo is your competitor', takeaway: 'You rarely lose to rivals; you lose to "do nothing". The pitch must beat inertia: make changing feel safer than staying.', points: ['De-risk the switch explicitly', 'Pilot programs beat big-bang', 'Testimonials from switchers, not just users'] },
      { title: 'Peak-end rule', takeaway: 'Prospects remember the emotional peak and the ending of a call, not the average. Engineer one genuine "wow" moment and always end up.', points: ['One rehearsed insight = the peak', 'End every call with momentum', 'Last 30 seconds get remembered'] },
    ],
    drill: 'Reframe your main pitch line from gain to loss framing. Say both aloud, feel the difference in weight.',
    quiz: [
      q('Your real competitor in most deals is…', ['The market leader', 'Doing nothing', 'Price', 'Procurement'], 1, 'Inertia kills more deals than any rival.'),
      q('Per the peak-end rule, prospects remember…', ['Everything equally', 'The peak moment and the ending', 'Only the price', 'The first minute'], 1, 'Engineer the peak; protect the ending.'),
      q('Loss framing works because…', ['People are pessimists', 'Losses psychologically outweigh equal gains', 'It sounds urgent', 'It\'s aggressive'], 1, 'Loss aversion ≈ 2x weighting, Kahneman\'s classic result.'),
    ],
  },
  {
    id: 'behavioral-econ', name: 'Behavioral Economics', emoji: '📊', category: 'Persuasion', level: 'Advanced', minutes: 35,
    description: 'Anchoring, decoys, and defaults, choice architecture for deal design.',
    lessons: [
      { title: 'Decoy pricing', takeaway: 'Three tiers with a deliberately weak middle drives buyers to the tier you designed them to pick. The decoy isn\'t meant to sell, it\'s meant to compare.', points: ['Good/Better/Best always', 'The decoy makes "Best" rational', 'Never present one price alone'] },
      { title: 'Defaults and friction', takeaway: 'Whatever requires no action wins. Pre-checked annual billing, auto-scheduled onboarding, calendar links over "let me know", design the lazy path to be your path.', points: ['Reduce clicks to yes', 'Make the next step the default', '"Let me know" is where deals die'] },
    ],
    drill: 'Design a three-tier offer for your product where the middle tier exists purely to make the top tier obvious.',
    quiz: [
      q('A decoy option exists to…', ['Be purchased often', 'Make the target option look rational', 'Confuse buyers', 'Fill the pricing page'], 1, 'Comparison, not conversion, is the decoy\'s job.'),
      q('"Let me know what works for you" underperforms because…', ['It\'s impolite', 'It adds friction and no default', 'It\'s too casual', 'It\'s pushy'], 1, 'Every decision you outsource is a decision delayed.'),
    ],
  },
  {
    id: 'influence', name: 'Influence', emoji: '🎯', category: 'Persuasion', level: 'Intermediate', minutes: 30,
    description: 'Pre-suasion and frame control: win the conversation before it starts.',
    lessons: [
      { title: 'Pre-suasion', takeaway: 'What you get someone to attend to BEFORE the ask changes the ask\'s reception. Opening with "Are you open-minded about growth?" primes an open-minded evaluation.', points: ['Prime the frame first', 'Questions direct attention', 'The moment before matters most'] },
      { title: 'Frame control', takeaway: 'Every conversation has a frame: buyer-interviewing-vendor, or expert-advising-owner. Set yours in the first minute, "I\'m calling with a specific idea for you", or inherit theirs.', points: ['State your frame early', 'Expert frame > vendor frame', 'Reject frames with calm redirects'] },
    ],
    drill: 'Write a pre-suasive opening question for your next pitch that primes the exact mindset you need.',
    quiz: [
      q('Pre-suasion works by…', ['Talking faster', 'Directing attention before the request', 'Repeating the ask', 'Discounting early'], 1, 'Attention in the moment before the ask shapes its evaluation.'),
      q('The "expert frame" means the prospect sees you as…', ['A vendor to be screened', 'An advisor with a specific insight for them', 'A friend', 'An interviewer'], 1, 'Advisors get listened to; vendors get procurement-ed.'),
    ],
  },
  {
    id: 'conversation-flow', name: 'Conversation Flow', emoji: '🌊', category: 'Delivery', level: 'Intermediate', minutes: 25,
    description: 'Transitions, threading, and the art of never letting a call stall.',
    lessons: [
      { title: 'Conversational threading', takeaway: 'Every answer contains 3+ threads. "We\'re busy with the merger" offers: busy, merger, we. Pick one, pull it, you\'ll never run out of road.', points: ['Note threads while listening', 'Pull the emotional thread first', 'Bank unused threads for later'] },
      { title: 'Graceful transitions', takeaway: '"Which reminds me…", "Building on that…", "You mentioned X earlier…", transitions that reference THEIR words make your agenda feel like their conversation.', points: ['Bridge from their words', 'Callbacks as transitions', 'Never "anyway, so…"'] },
    ],
    drill: 'Take the sentence "Things are hectic since we opened the second location", list every thread, then pull each with one question.',
    quiz: [
      q('"We\'re busy with the merger" contains how many conversational threads?', ['One', 'At least three', 'None', 'Two exactly'], 1, 'Busy / merger / we, every clause is a door.'),
      q('The best transition to your pitch references…', ['Your slide deck', 'Something they said earlier', 'The time', 'Your quota'], 1, 'Their words make your agenda feel collaborative.'),
    ],
  },
  {
    id: 'power-questions', name: 'Power Questions', emoji: '❓', category: 'Core Sales', level: 'Advanced', minutes: 30,
    description: 'The 25 questions that change deals: status-quo breakers, vision builders, and commitment tests.',
    lessons: [
      { title: 'Status-quo breakers', takeaway: '"What made you take this call?" and "What happens if you change nothing?" force the prospect to argue FOR change, the most persuasive voice they\'ll ever hear is their own.', points: ['Let them state the pain', 'Their reasons > your reasons', 'Write down their exact words'] },
      { title: 'Commitment tests', takeaway: '"If the pilot hits the numbers, what happens next on your side?" reveals the real process, the real blockers, and the real interest, before you invest a month.', points: ['Test before you build', 'Map the buying process aloud', 'Vague answers = soft interest'] },
    ],
    drill: 'Memorize five power questions until you can deploy them mid-conversation without reading.',
    quiz: [
      q('"What made you take this call?" is powerful because…', ['It\'s flattering', 'The prospect argues for change themselves', 'It fills time', 'It\'s unexpected'], 1, 'Self-generated reasons are the ones people act on.'),
      q('A vague answer to a commitment test means…', ['They\'re busy', 'Interest is softer than it looks', 'They\'re sold', 'Ask again louder'], 1, 'Concrete next steps are the pulse of a real deal.'),
    ],
  },
  {
    id: 'energy-management', name: 'Energy Management', emoji: '🔋', category: 'Mindset', level: 'Foundation', minutes: 20,
    description: 'Call blocks, recovery rituals, and protecting your peak hours for peak conversations.',
    lessons: [
      { title: 'Block, don\'t sprinkle', takeaway: 'Ten scattered calls exhaust more than twenty blocked ones. Momentum is an energy source: batch dials in 50-minute blocks with hard breaks.', points: ['50-minute call blocks', 'No email between dials', 'Momentum lowers the activation cost per call'] },
      { title: 'Match energy to stakes', takeaway: 'Know your biological prime time and spend it on the hardest calls. Admin in the trough, closing in the peak.', points: ['Track your energy for one week', 'Hardest call at highest energy', 'Never negotiate exhausted'] },
    ],
    drill: 'Map tomorrow: your two peak-energy hours, and which two calls deserve them.',
    quiz: [
      q('Call blocking beats scattered calls because…', ['Managers prefer it', 'Momentum reduces per-call energy cost', 'It looks organized', 'Prospects notice'], 1, 'Each dial in a block costs less willpower than a cold start.'),
      q('Your toughest negotiation should be scheduled…', ['First thing regardless', 'During your peak-energy window', 'Late evening', 'Whenever they want'], 1, 'Stakes deserve your biological prime time.'),
    ],
  },
]

// Decorate each module as either a comprehensive "Certified" course (longer /
// harder — awards a personalised certificate on completion) or a "Quick"
// course (short foundation reps, no certificate). Outcomes are derived from
// each lesson's core takeaway so every course reads like a real syllabus.
for (const m of ACADEMY) {
  m.certificate = m.level !== 'Foundation' || m.minutes >= 30
  m.track = m.certificate ? 'Certified' : 'Quick'
  m.outcomes = m.lessons.map((l) => {
    const first = l.takeaway.split(/(?<=[.!?])\s/)[0].replace(/[.!?]+$/, '').trim()
    return first.length > 96 ? first.slice(0, 93).trim() + '…' : first
  })
  m.hours = Math.max(0.5, Math.round((m.minutes / 60) * 2) / 2) // rounded to nearest half-hour
}

export function getModule(id) {
  return ACADEMY.find((m) => m.id === id)
}

export const ACADEMY_CATEGORIES = [...new Set(ACADEMY.map((m) => m.category))]
export const CERTIFIED_COURSES = ACADEMY.filter((m) => m.certificate)
export const QUICK_COURSES = ACADEMY.filter((m) => !m.certificate)

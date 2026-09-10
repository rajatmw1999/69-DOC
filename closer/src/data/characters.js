// AI character roster. Each character = temperament + line pack.
// Line packs drive the conversation engine; archetypes are shared bases
// with signature overrides for the legends.

const base = {
  hangup: [
    "Yeah, I'm done here. Don't call this number again.",
    "This is going nowhere. Goodbye.",
    "I've heard enough. Take me off your list.",
  ],
  win: [
    "Alright, you know what, you've earned fifteen minutes. Send the invite.",
    "Fine. Thursday, 10am. Don't make me regret this.",
    "Okay, I'm in. Send me the details and let's move.",
  ],
  cold: [
    "I'm really not following why this matters to me.",
    "Mm-hm. Look, I've got about thirty seconds.",
    "We already have something for that.",
    "You're the fourth call like this today. What makes you different?",
  ],
  neutral: [
    "Okay… go on.",
    "Alright, so how does that actually work?",
    "I mean, maybe. What would that look like for us?",
    "We've had mixed results with things like this before.",
  ],
  hooked: [
    "Huh. Okay, that's actually interesting. Tell me more.",
    "That's the first useful thing anyone's said to me all day. Keep going.",
    "Now you have my attention. What's the catch?",
    "Interesting. How fast could we see that?",
  ],
  objections: [
    "It sounds expensive. What's this going to cost me?",
    "We don't have budget for this quarter. Why now?",
    "I'd need to run this by my partner. Why shouldn't I just wait?",
    "We tried something like this last year and it flopped. Why would yours be different?",
    "Honestly, I don't have time to implement anything new.",
    "Send me an email and I'll look when I can.",
  ],
  scenarioHint: "Look, if this is about {topic}, you'd better get specific fast.",
}

function pack(overrides = {}) {
  return { ...base, ...overrides }
}

export const CHARACTERS = [
  // ── Legends ─────────────────────────────────────────────
  {
    id: 'jordan-belfort', name: 'Jordan Belfort', emoji: '🐺',
    title: 'The Wolf', industry: 'Finance', salesStyle: 'Straight Line Persuasion',
    difficulty: 5, personality: 'Relentless, charismatic, smells weakness instantly',
    speakingSpeed: 1.18, interruptiveness: 0.85, objectionStyle: 'Rapid-fire pressure tests',
    voice: { eleven: 'pNInz6obpgDQGcFmaJgB', gender: 'male', accent: 'us', pitch: 1.02 },
    temperament: { patience: 34, objectionCount: 3, style: 'aggressive' },
    locked: false,
    lines: pack({
      openers: ["You've got exactly ten seconds to tell me why this call is worth my time. Go."],
      cold: [
        "Weak. That was weak and you know it. Tighten it up.",
        "You're selling the way people sold in the nineties. Certainty, my friend. Where's your certainty?",
        "I can hear the hesitation in your voice from here.",
      ],
      hooked: [
        "Now THAT'S a line. See what happens when you commit to the sentence?",
        "Good. You're keeping the straight line. Don't let me pull you off it.",
      ],
      objections: [
        "The number's too high and you flinched saying it. Say it again like it's a bargain.",
        "Why you? Why your company? Why now? Answer all three or hang up.",
        "I like the idea, I just don't trust YOU yet. Fix that.",
      ],
      win: ["Boom. THAT'S how you close. You just sold the Wolf, take the win."],
      hangup: ["You lost me at hello, kid. Study the tape and call me back."],
      ctx: {
        question: {
          cold: ["My {echo}? Kid, I don't answer questions from people who haven't sold me anything yet. Sell first.", "You're asking about my {echo} like you've earned it. You haven't. Certainty first, questions second."],
          warm: ["My {echo}? Honestly? It bleeds money and everyone's too scared to tell me. You saw it, good. Now what?"],
        },
        value: {
          cold: ["'{echo}', you said it like you were apologizing for it. Say {echo} like it's the best thing that ever happened to me.", "Every schmuck on the phone promises {echo}. The tonality is what sells it, and yours is FLAT."],
          warm: ["NOW you sound like you believe {echo} yourself. That's the straight line. Stay on it."],
        },
        number: {
          cold: ["{echo}? You threw that number out there with zero conviction. Numbers are only real if YOU'RE real.", "{echo}, whose number is that? Say it again like you'd bet your house on it."],
          warm: ["{echo}. Good. Specific. Now attach it to MY life, what does {echo} buy ME?"],
        },
        price: {
          cold: ["You flinched on the money. NEVER flinch on the money. The moment you flinch, I own you."],
          warm: ["Say the number like it's a bargain, one time, then shut your mouth. Go."],
        },
        greeting: {
          cold: ["Hi hi, hello hello, that's four words of my ten seconds gone. GO.", "Pleasantries? The Wolf doesn't do pleasantries. Reason for the call. Now."],
          warm: ["Smooth opener. Confident. Okay kid, you bought yourself a minute."],
        },
        howAreYou: {
          cold: ["'How am I'? I'm RICH, that's how I am. And you're on the clock. Sell."],
          warm: ["Ha! I'm fantastic, I'm always fantastic. Now show me you deserve this phone call."],
        },
        vague: {
          cold: ["Mumbling is for people who don't believe their own pitch. Full sentence, full certainty.", "That was word soup. Straight line, kid, where are you taking me?"],
        },
      },
    }),
  },
  {
    id: 'grant-cardone', name: 'Grant Cardone', emoji: '🔟',
    title: '10X Mode', industry: 'Sales Training', salesStyle: 'Massive action, dominant frame',
    difficulty: 5, personality: 'Loud, demanding, zero tolerance for small thinking',
    speakingSpeed: 1.22, interruptiveness: 0.9, objectionStyle: 'Frame domination',
    voice: { eleven: 'VR6AewLTigWG4xSOukaG', gender: 'male', accent: 'us', pitch: 0.95 },
    temperament: { patience: 30, objectionCount: 3, style: 'aggressive' },
    locked: false,
    lines: pack({
      openers: ["Who is this and why should I not hang up in the next five seconds?"],
      cold: [
        "You're being reasonable. Reasonable is broke. Come at me bigger.",
        "That pitch was a 2 out of 10 and I'm being generous.",
      ],
      hooked: ["THAT'S the energy! Now we're doing business. Keep pushing."],
      objections: [
        "Price? Price is a myth. Show me the money it MAKES me.",
        "I don't buy from people who follow up 'when it's convenient'. Are you obsessed or not?",
        "You want my time? My time is ten grand an hour. Earn it.",
      ],
      win: ["Done deal. You showed up 10X, that's the only way I buy."],
      hangup: ["Little thinking, little results. Call me when you're serious."],
      ctx: {
        question: {
          cold: ["Why are you asking about my {echo}?? YOU called ME. Obsessed people don't ask permission, they bring VALUE.", "My {echo} is 10X better than whatever you're about to pitch. Prove me wrong."],
          warm: ["My {echo}? It's good. But good is the enemy of GREAT, so if you can 10X it, TALK."],
        },
        value: {
          cold: ["'{echo}'? That's a 1X promise, my man. I don't get out of bed for 1X.", "You're underselling {echo}! If you believed it you'd be SHOUTING it!"],
          warm: ["{echo} at SCALE? Now you're speaking my language. Show me massive."],
        },
        number: {
          cold: ["{echo}? Add a zero and maybe I care. Small numbers are for small thinkers.", "{echo}, is that all?? Think BIGGER."],
          warm: ["{echo}. Okay okay okay. Multiply that across a year and say it again. FEEL it."],
        },
        price: {
          cold: ["Price is a MYTH! You're talking cost when you should be talking money it MAKES me!"],
          warm: ["Don't discount it. Ever. Underpriced means under-believed. What's the number?"],
        },
        greeting: {
          cold: ["Great, hello, hi, love it, you've burned three seconds being polite. Are you obsessed or not?!"],
          warm: ["THERE'S some energy! Okay, you got my attention, don't waste it."],
        },
        howAreYou: {
          cold: ["How am I? I'm CRUSHING it, like every day. The question is what are YOU doing on this call?"],
          warm: ["10X, baby, always 10X. Now bring me something worth my next ten seconds."],
        },
        vague: {
          cold: ["Weak! Say it with your CHEST!", "That's a whisper in a hurricane, my man. LOUDER, CLEARER, BIGGER."],
        },
      },
    }),
  },
  {
    id: 'steve-jobs', name: 'Steve Jobs', emoji: '🍎',
    title: 'The Visionary', industry: 'Technology', salesStyle: 'Product zealotry, brutal simplicity',
    difficulty: 5, personality: 'Perfectionist, dismissive of mediocrity, moved only by insight',
    speakingSpeed: 0.94, interruptiveness: 0.7, objectionStyle: 'Existential product questions',
    voice: { eleven: 'TxGEqnHWrfWFTfGW9XjX', gender: 'male', accent: 'us', pitch: 1.0 },
    temperament: { patience: 38, objectionCount: 3, style: 'intense' },
    locked: false,
    lines: pack({
      openers: ["You have my attention for one question: what problem do you actually solve?"],
      cold: [
        "That's a feature, not a product. Features bore me.",
        "You're describing what it does. I asked what it MEANS.",
        "Most things are noise. So far, this is noise.",
      ],
      hooked: [
        "Hm. That's… actually elegant. Say more, and don't ruin it.",
        "Simple. I like simple. Simple is harder than complex.",
      ],
      objections: [
        "Why does this deserve to exist?",
        "If I gave you one sentence on a billboard, what does it say?",
        "A thousand companies do this. Why will yours be the one that matters?",
      ],
      win: ["Okay. This is insanely great. Let's talk, my people will set it up."],
      hangup: ["This is a C-minus conversation and I don't do C-minus. Goodbye."],
      ctx: {
        question: {
          cold: ["My {echo} is not the interesting question. The interesting question is why {echo} exists at all.", "You're asking about {echo}. Wrong altitude. Ask what it MEANS."],
          warm: ["Our {echo}? It's a committee-designed mess, like most things. What would you delete from it?"],
        },
        value: {
          cold: ["'{echo}' is a feature. Features bore me. What's the product?", "A thousand companies promise {echo}. Why will yours be the one that matters?"],
          warm: ["{echo}, stated simply. Good. Simple is harder than complex, don't ruin it now."],
        },
        number: {
          cold: ["{echo}. Numbers without taste are just noise. What does the customer FEEL?"],
          warm: ["{echo}, fine, the math works. But does it make someone's day better? That's the bar."],
        },
        price: {
          cold: ["Price is what mediocre people negotiate. Make something worth anything and the price is a detail."],
          warm: ["Charge more. If it's great, charge more and say it without apology."],
        },
        greeting: {
          cold: ["Hello. You have one question's worth of my patience. Make it the right question."],
          warm: ["Good, no fluff. Continue."],
        },
        howAreYou: {
          cold: ["That's a wasted sentence. You get very few. What do you actually want?"],
          warm: ["Focused, thanks. Which is what this call needs to be."],
        },
        vague: {
          cold: ["That was noise. Say it in one sentence, if you can't, you don't understand it yet.", "Simplify. Then simplify again. Then call me back, no wait, you're here. Try now."],
        },
      },
    }),
  },
  {
    id: 'elon-musk', name: 'Elon Musk', emoji: '🚀',
    title: 'First Principles', industry: 'Aerospace / EV', salesStyle: 'Physics-based interrogation',
    difficulty: 5, personality: 'Distracted genius, sudden deep dives, allergic to buzzwords',
    speakingSpeed: 0.9, interruptiveness: 0.6, objectionStyle: 'First-principles teardown',
    voice: { eleven: 'ErXwobaYiN019PkySvjV', gender: 'male', accent: 'neutral', pitch: 1.0 },
    temperament: { patience: 42, objectionCount: 3, style: 'analytical' },
    locked: false,
    lines: pack({
      openers: ["Uh, hi. I have about ninety seconds between meetings. What is this?"],
      cold: [
        "That's a buzzword. Break it down to first principles or don't bother.",
        "Sorry, I was answering a text. Say the important part again.",
        "The unit economics don't obviously work. Walk me through the math.",
      ],
      hooked: [
        "Okay wait, that's actually a non-obvious insight. Continue.",
        "Hm. If that scales, it's interesting. What's the limiting constraint?",
      ],
      objections: [
        "Why hasn't physics, or the market, already solved this?",
        "What's your marginal cost at 10x volume? You should know this instantly.",
        "This feels like a vitamin, not a painkiller. Convince me otherwise.",
      ],
      win: ["Alright, this is one of the more sane pitches this month. Email my chief of staff, I'll take the meeting."],
      hangup: ["Yeah, I have a rocket thing. Good luck with… whatever this was."],
      ctx: {
        question: {
          cold: ["Um, my {echo}? That's… not a first-principles question. Ask about the physics of the problem.", "Sorry, was half-reading a text. Why does my {echo} matter to your pitch?"],
          warm: ["Our {echo} is objectively suboptimal, yeah. The failure mode is obvious if you look. Do you see it?"],
        },
        value: {
          cold: ["'{echo}' is a marketing phrase. Break {echo} down to first principles or it's just… words.", "The claim of {echo} violates no laws of physics, so, possible. Probable is a different question."],
          warm: ["Hm. {echo}, if the unit economics hold, is actually non-trivial. What's the limiting constraint?"],
        },
        number: {
          cold: ["{echo}, is that measured or extrapolated? Extrapolations are usually wrong in the boring direction.", "You should know the error bars on {echo} instantly. Do you?"],
          warm: ["{echo}. Okay, if that's real, what happens at 10x volume? Marginal cost curve, go."],
        },
        price: {
          cold: ["Price before physics? The cost structure is the interesting part. What's it made of?"],
          warm: ["Just tell me the marginal cost and the margin. Two numbers. Fast."],
        },
        greeting: {
          cold: ["Uh, hi. I have about ninety seconds between things. Compress accordingly."],
          warm: ["Hi. Okay. You sound like you've actually thought about this. Proceed."],
        },
        howAreYou: {
          cold: ["Existentially? Complicated. Practically? Busy. Skip ahead."],
          warm: ["Optimizing, as usual. Alright, what've you got?"],
        },
        vague: {
          cold: ["That was a word cloud, not a sentence. What's the actual thing?", "Buzzword density too high. Recompile and resend."],
        },
      },
    }),
  },
  {
    id: 'warren-buffett', name: 'Warren Buffett', emoji: '🧢',
    title: 'The Oracle', industry: 'Investing', salesStyle: 'Folksy patience, lethal questions',
    difficulty: 4, personality: 'Warm, patient, disarms you and then asks the killer question',
    speakingSpeed: 0.82, interruptiveness: 0.2, objectionStyle: 'Value and moat scrutiny',
    voice: { eleven: 'pqHfZKP75CvOlQylNhV4', gender: 'male', accent: 'us', pitch: 0.92 },
    temperament: { patience: 70, objectionCount: 3, style: 'patient' },
    locked: false,
    lines: pack({
      openers: ["Well hello there. I've got a cherry Coke and a few minutes, what's on your mind?"],
      cold: [
        "That's fine and dandy, but I don't invest in what I don't understand. Simplify it for me.",
        "You know, in Omaha we'd call that a lot of hat and no cattle.",
      ],
      hooked: [
        "Now that's the kind of business I like, tell me about the moat.",
        "Heh, that's a wonderful little detail. Go on.",
      ],
      objections: [
        "What happens to this business in a bad year? Everybody's a genius in a bull market.",
        "If I gave you ten million and ten years, why won't a competitor just copy this?",
        "Price is what I pay, value is what I get. So what am I getting?",
      ],
      win: ["Well, you've made an old man curious, and that's not easy. Let's continue this over lunch."],
      hangup: ["I'll pass, friend. Rule number one is never lose money, and rule two is never forget rule one."],
      ctx: {
        question: {
          cold: ["Heh, my {echo}? I've had the same {echo} for fifty years, friend. It compounds, that's the whole trick.", "Now why would a fella want to know about my {echo}? Tell me what you're really fishing for."],
          warm: ["Our {echo}? Truthfully it's like an old tractor, runs fine until the day it doesn't. What are you seeing?"],
        },
        value: {
          cold: ["'{echo}', you know, in Omaha we'd call that a lot of hat and no cattle. Where's the cattle?", "Everybody promises {echo} in a bull market. What happens to {echo} in a bad year?"],
          warm: ["Now {echo}, if it's durable, that's a moat. And I do love a moat. Tell me why it lasts."],
        },
        number: {
          cold: ["{echo}, you say. I've seen prettier numbers turn ugly by Tuesday. What's behind it?", "A number like {echo} is a story wearing a suit. Tell me the story instead."],
          warm: ["{echo}, well now, that's a wonderful little figure. Is it repeatable, or did lightning strike once?"],
        },
        price: {
          cold: ["Price is what I pay, value is what I get. So far you've only told me the first part."],
          warm: ["Alright, name the price plainly. I've bought companies quicker than some folks buy shoes."],
        },
        greeting: {
          cold: ["Well hello there. I've got a cherry Coke and mild curiosity, one of them runs out fast."],
          warm: ["Hello, hello. You sound like someone with a story. I like stories. Go on."],
        },
        howAreYou: {
          cold: ["Oh, can't complain, nobody listens anyway, heh. What's on your mind, friend?"],
          warm: ["Happier than a mosquito at a nudist colony. Now what can I do for you?"],
        },
        vague: {
          cold: ["Friend, I don't invest in what I don't understand, and I didn't understand a word of that.", "Try that again in plain English. The simpler you say it, the smarter you'll sound."],
        },
      },
    }),
  },
  {
    id: 'mark-cuban', name: 'Mark Cuban', emoji: '🏀',
    title: 'The Shark', industry: 'Tech / Media', salesStyle: 'Numbers-first, BS detector',
    difficulty: 4, personality: 'Blunt, fast, respects hustle, destroys fluff',
    speakingSpeed: 1.15, interruptiveness: 0.75, objectionStyle: 'Margins and CAC interrogation',
    voice: { eleven: 'yoZ06aMxZJJ28mfd3POQ', gender: 'male', accent: 'us', pitch: 1.0 },
    temperament: { patience: 40, objectionCount: 3, style: 'aggressive' },
    locked: false,
    lines: pack({
      openers: ["You've got 60 seconds. Numbers first, story later. Go."],
      cold: [
        "Sales fixes everything, and you're not showing me sales.",
        "That's a hobby, not a business.",
      ],
      hooked: ["Okay, those margins don't suck. Keep talking."],
      objections: [
        "What's your customer acquisition cost, and don't guess.",
        "Everyone says 'no competitors'. That means you haven't looked.",
        "Why do you need ME? Money's a commodity.",
      ],
      win: ["Alright, I'm in. But I want weekly numbers in my inbox. Deal."],
      hangup: ["And for that reason, I'm out."],
      ctx: {
        question: {
          cold: ["My {echo}? You didn't do your homework, that's strike one. I talk about it in like nine interviews.", "Why does my {echo} matter? Sales fix everything, and you haven't shown me sales."],
          warm: ["Our {echo} could be better, not gonna lie. What do you got, and keep it real."],
        },
        value: {
          cold: ["'{echo}', everybody pitches me {echo}. Margins. Show me the margins.", "That's a hobby claim, not a business claim. {echo} means nothing without CAC."],
          warm: ["Okay, {echo} with decent unit economics? Keep talking. What's the acquisition cost?"],
        },
        number: {
          cold: ["{echo}? Don't guess with me. Is that gross or net? Trailing or projected?", "I've heard {echo}-type numbers from a hundred founders. Ninety-nine were wrong."],
          warm: ["{echo}. If that's net and repeatable, those margins don't suck. What's churn?"],
        },
        price: {
          cold: ["You're leading with price? Money's a commodity. Value isn't. Which one are you selling?"],
          warm: ["Fine, what's it cost, what's it return, and how fast? Three numbers, go."],
        },
        greeting: {
          cold: ["Yeah, hey. Sixty seconds. Numbers first, story later."],
          warm: ["Hey, okay, you came ready. Respect. What's the pitch?"],
        },
        howAreYou: {
          cold: ["Save the small talk for your barber. What are we doing here?"],
          warm: ["Living the dream. Alright, whatcha got?"],
        },
        vague: {
          cold: ["That answer had no numbers in it. Try again with numbers.", "Fluff. I hear fluff, I reach for the door."],
        },
      },
    }),
  },
  {
    id: 'barbara-corcoran', name: 'Barbara Corcoran', emoji: '🏙️',
    title: 'The Matriarch', industry: 'Real Estate', salesStyle: 'Gut instinct, people-reader',
    difficulty: 4, personality: 'Charming, sharp, bets on the person not the pitch',
    speakingSpeed: 1.05, interruptiveness: 0.5, objectionStyle: 'Character and grit tests',
    voice: { eleven: '21m00Tcm4TlvDq8ikWAM', gender: 'female', accent: 'us', pitch: 1.08 },
    temperament: { patience: 55, objectionCount: 2, style: 'warm' },
    locked: false,
    lines: pack({
      openers: ["Hi honey, I've got five minutes between showings. Make them count."],
      cold: [
        "I've heard this pitch a hundred times. What I haven't heard is YOU. Who are you?",
        "You're reading a script, sweetheart. Throw it out.",
      ],
      hooked: ["Ooh, now you sound like someone who's been knocked down and got up. I like that."],
      objections: [
        "Tell me about your worst failure. That's where I decide.",
        "If a bigger competitor called my clients tomorrow, why do they stay with you?",
      ],
      win: ["You know what? I trust my gut, and my gut says yes. Let's do it."],
      hangup: ["I'm going to save us both time, it's a no. Toughen up and try again."],
      ctx: {
        question: {
          cold: ["My {echo}? Honey, I built my {echo} from a thousand-dollar loan. What did YOU build?", "You're asking about my {echo}, cute. I ask the questions until you've earned a turn."],
          warm: ["Our {echo}? Between us, it needs work, and I only admit that to people I like. Careful, you're becoming one."],
        },
        value: {
          cold: ["Sweetheart, '{echo}' is what everyone says right before they disappoint me.", "I don't buy {echo}. I buy the PERSON selling {echo}. And I'm still reading you."],
          warm: ["Now {echo}, say it again with your spine straight, because that one I believe."],
        },
        number: {
          cold: ["{echo}? Numbers don't impress me, honey. Grit impresses me. Where's yours from?"],
          warm: ["{echo}, okay, that's a real number said like a real person. Who'd you learn that from?"],
        },
        price: {
          cold: ["Talking money before charming me? In New York we call that amateur hour."],
          warm: ["Give me the price straight, no wincing. Winners don't wince."],
        },
        greeting: {
          cold: ["Hi honey. I've got five minutes between showings and four of them are spoken for."],
          warm: ["Well hello! Good energy. Don't waste it, what've you got?"],
        },
        howAreYou: {
          cold: ["Fabulous, always fabulous. You won't distract me with manners though, pitch."],
          warm: ["I'm terrific, sweetheart. And you sound nervous-excited, which I love. Go."],
        },
        vague: {
          cold: ["You're reading a script, I can hear the paper. Throw it out and talk to me.", "That was mush. Tell me something TRUE."],
        },
      },
    }),
  },
  // ── Buyer archetypes ────────────────────────────────────
  {
    id: 'shark-investor', name: 'Shark Tank Investor', emoji: '🦈',
    title: 'Deal Hunter', industry: 'Venture', salesStyle: 'Equity leverage',
    difficulty: 4, personality: 'Ruthless with valuations, theatrical, loves leverage',
    speakingSpeed: 1.1, interruptiveness: 0.7, objectionStyle: 'Valuation attacks',
    voice: { eleven: '2EiwWnXFnvU5JabPnv8n', gender: 'male', accent: 'us', pitch: 0.98 },
    temperament: { patience: 45, objectionCount: 3, style: 'aggressive' },
    locked: false,
    lines: pack({
      openers: ["Alright, you're asking for money. Whose, how much, and for what percent?"],
      objections: [
        "Your valuation is insane. Justify it or cut it in half.",
        "What stops me from funding your competitor tomorrow?",
        "You're pre-revenue and asking for THAT? Walk me through your delusion.",
      ],
      win: ["Congratulations, you've got a deal. Don't make me look stupid."],
    }),
  },
  {
    id: 'luxury-client', name: 'Luxury Client', emoji: '💎',
    title: 'Old Money', industry: 'Luxury Retail', salesStyle: 'Discretion expected',
    difficulty: 3, personality: 'Refined, unhurried, offended by pushiness',
    speakingSpeed: 0.85, interruptiveness: 0.15, objectionStyle: 'Taste and exclusivity doubts',
    voice: { eleven: 'ThT5KcBeYPX3keUQqHPh', gender: 'female', accent: 'uk', pitch: 1.05 },
    temperament: { patience: 65, objectionCount: 2, style: 'reserved' },
    locked: false,
    lines: pack({
      openers: ["Good afternoon. I do hope this is worth interrupting my afternoon for."],
      cold: ["How very… enthusiastic. Do compose yourself.", "One does not simply 'discount' excellence. You cheapen the conversation."],
      hooked: ["Mm. Provenance and craftsmanship, now you're speaking properly."],
      objections: [
        "Everyone claims exclusivity, darling. Who else owns one?",
        "I don't discuss price. I discuss worth. Are they the same here?",
      ],
      win: ["Very well. You have taste and patience, a rare pairing. I'll proceed."],
      hangup: ["This has become rather tiresome. Good day."],
    }),
  },
  {
    id: 'busy-ceo', name: 'Busy CEO', emoji: '⏱️',
    title: 'No Time', industry: 'Enterprise', salesStyle: 'Executive brevity',
    difficulty: 4, personality: 'Checks email while you talk, decides in 90 seconds',
    speakingSpeed: 1.2, interruptiveness: 0.8, objectionStyle: 'Time-cost dismissals',
    voice: { eleven: 'AZnzlk1XvdvUeBnXmlld', gender: 'female', accent: 'us', pitch: 1.0 },
    temperament: { patience: 32, objectionCount: 2, style: 'aggressive' },
    locked: false,
    lines: pack({
      openers: ["You have 30 seconds and I'm walking into a board meeting. Go."],
      cold: ["Bottom line it. Now.", "You're describing features. I buy outcomes. Which one do you sell?"],
      hooked: ["Okay, that's a real number. Where's it come from?"],
      objections: [
        "My team already evaluated this category and passed. Why re-open it?",
        "Every vendor promises 30% improvement. Nobody delivers. Why will you?",
      ],
      win: ["Fine. 15 minutes Thursday with my VP. Impress her or don't come back."],
      hangup: ["I'm walking into my meeting. We're done."],
    }),
  },
  {
    id: 'angry-prospect', name: 'Angry Prospect', emoji: '😡',
    title: 'Bad Day', industry: 'Small Business', salesStyle: 'Hostile until earned',
    difficulty: 4, personality: 'Furious at cold callers, tests your composure',
    speakingSpeed: 1.15, interruptiveness: 0.9, objectionStyle: 'Personal attacks, hostility',
    voice: { eleven: 'N2lVS1w4EtoT3dr4eOWO', gender: 'male', accent: 'us', pitch: 0.9 },
    temperament: { patience: 26, objectionCount: 2, style: 'aggressive' },
    locked: false,
    lines: pack({
      openers: ["WHAT. Who gave you this number? You people call every single day."],
      cold: [
        "You're not LISTENING. I said I'm not interested!",
        "Unbelievable. You're still talking.",
      ],
      hooked: ["…Okay. Fine. That's… actually the first honest thing a salesperson has said to me. Keep going."],
      objections: [
        "The last company that promised that took my money and vanished. Why are you different?",
        "You've got one minute to prove you're not wasting my life.",
      ],
      win: ["Huh. You kept your cool and you actually made sense. Alright, send it over."],
      hangup: ["THAT'S IT. Lose this number!"],
    }),
  },
  {
    id: 'cold-cfo', name: 'Cold CFO', emoji: '🧊',
    title: 'The Iceberg', industry: 'Finance', salesStyle: 'Spreadsheet skepticism',
    difficulty: 5, personality: 'Monotone, emotionless, only ROI moves the needle',
    speakingSpeed: 0.88, interruptiveness: 0.3, objectionStyle: 'ROI and risk interrogation',
    voice: { eleven: 'onwK4e9ZLuTAKqWW03F9', gender: 'male', accent: 'uk', pitch: 0.9 },
    temperament: { patience: 50, objectionCount: 4, style: 'analytical' },
    locked: false,
    lines: pack({
      openers: ["Speaking. You have my attention until it stops being financially relevant."],
      cold: ["That is not a number.", "Adjectives are free. Show me the model."],
      hooked: ["Payback under two quarters. Continue, carefully."],
      objections: [
        "What is the fully loaded cost including implementation and churn risk?",
        "Your case study is n=1. Do you have cohort data?",
        "If this fails, who absorbs the write-off, you or me?",
        "We can build this internally for less. Convince me we can't.",
      ],
      win: ["The numbers survive scrutiny. Send the proposal, copy procurement."],
      hangup: ["This meeting has negative ROI. Goodbye."],
    }),
  },
  {
    id: 'real-estate-seller', name: 'Real Estate Seller', emoji: '🏡',
    title: 'FSBO Holdout', industry: 'Real Estate', salesStyle: 'Emotional attachment',
    difficulty: 3, personality: 'Attached to the house, burned by agents before',
    speakingSpeed: 1.0, interruptiveness: 0.4, objectionStyle: 'Commission resistance',
    voice: { eleven: 'EXAVITQu4vr4xnSDxMaL', gender: 'female', accent: 'us', pitch: 1.05 },
    temperament: { patience: 55, objectionCount: 3, style: 'emotional' },
    locked: false,
    lines: pack({
      openers: ["If you're another agent calling about the house, I'm selling it myself, thanks."],
      cold: ["You agents all say the same thing.", "My neighbor sold without an agent just fine."],
      hooked: ["Well… nobody explained it like that before. What would you do differently?"],
      objections: [
        "Six percent for putting a sign on my lawn? Be serious.",
        "The last agent listed high, then hammered me to drop the price. Why trust you?",
        "Zillow says my house is worth more than you're saying.",
      ],
      win: ["You know what, you clearly know this neighborhood. Come by Saturday and let's talk listing."],
      hangup: ["I said no agents. Goodbye."],
    }),
  },
  {
    id: 'recruiter-prospect', name: 'Passive Candidate', emoji: '🧑‍💻',
    title: 'Happily Employed', industry: 'Recruiting', salesStyle: 'Career risk aversion',
    difficulty: 3, personality: 'Content senior engineer, suspicious of recruiters',
    speakingSpeed: 0.95, interruptiveness: 0.3, objectionStyle: 'Status-quo bias',
    voice: { eleven: 'iP95p4xoKVk53GoZ742B', gender: 'male', accent: 'in', pitch: 1.0 },
    temperament: { patience: 55, objectionCount: 3, style: 'reserved' },
    locked: false,
    lines: pack({
      openers: ["Hi… sorry, who is this? If it's about a 'exciting opportunity', I get ten of these a week."],
      cold: ["That's what every recruiter says. Word for word.", "I'm not looking. Genuinely."],
      hooked: ["Hm, okay, that team actually sounds interesting. What's the stack?"],
      objections: [
        "I've got unvested equity. The math never works out.",
        "Last time I switched jobs it was a disaster. Why is this different?",
        "Just send the job description. I might look at it eventually.",
      ],
      win: ["Alright, you clearly did your homework. I'll take an intro call, Wednesday evening."],
      hangup: ["Please remove me from your list."],
    }),
  },
  {
    id: 'startup-founder', name: 'Startup Founder', emoji: '⚡',
    title: 'Moves Fast', industry: 'SaaS', salesStyle: 'Speed and leverage',
    difficulty: 2, personality: 'Curious, impatient, decides fast, churns fast',
    speakingSpeed: 1.15, interruptiveness: 0.6, objectionStyle: 'Speed and integration doubts',
    voice: { eleven: 'SOYHLrjzK2X1ezoPC6cr', gender: 'male', accent: 'us', pitch: 1.05 },
    temperament: { patience: 48, objectionCount: 2, style: 'energetic' },
    locked: false,
    lines: pack({
      openers: ["Hey hey, you've caught me between standups. What's up?"],
      cold: ["Is there a self-serve tier? I don't do sales calls usually.", "We duct-taped a solution already."],
      hooked: ["Oh nice, that would kill two tickets in my backlog. How fast is setup?"],
      objections: [
        "Can I integrate it this weekend? If not, it doesn't exist for me.",
        "We're pre-Series A, pricing needs to not be enterprise nonsense.",
      ],
      win: ["Sold. Send the sandbox link, I'll have it wired up by Monday."],
      hangup: ["Gotta jump, standup's starting. Ping me never."],
    }),
  },
  {
    id: 'restaurant-owner', name: 'Restaurant Owner', emoji: '🍝',
    title: 'In the Weeds', industry: 'Hospitality', salesStyle: 'Cash-flow stress',
    difficulty: 2, personality: 'Warm but exhausted, interrupted by kitchen chaos',
    speakingSpeed: 1.05, interruptiveness: 0.55, objectionStyle: 'Margin and time pressure',
    voice: { eleven: 'TX3LPaxmHKxFdv7VOQHJ', gender: 'male', accent: 'us', pitch: 0.98 },
    temperament: { patience: 45, objectionCount: 2, style: 'emotional' },
    locked: false,
    lines: pack({
      openers: ["Hello?, MARCO, TABLE SIX!, sorry, yeah, hi, who's this? We're slammed."],
      cold: ["Look, dinner rush starts in an hour.", "Margins are paper thin, friend. Paper. Thin."],
      hooked: ["Wait, it fills the Tuesday dead hours? Okay, talk while I chop."],
      objections: [
        "Every app takes a cut. I'm done giving away my margin.",
        "My cousin set up our website. Why do I need more?",
      ],
      win: ["Alright, alright. Come by Monday before prep, we'll set it up. You eat free."],
      hangup: ["I gotta go, the fryer's, yeah. Bye."],
    }),
  },
  {
    id: 'gym-owner', name: 'Gym Owner', emoji: '💪',
    title: 'No Nonsense', industry: 'Fitness', salesStyle: 'Results skepticism',
    difficulty: 2, personality: 'Direct, competitive, hates gimmicks',
    speakingSpeed: 1.1, interruptiveness: 0.5, objectionStyle: 'Show-me-proof',
    voice: { eleven: 'jsCqWAovK2LkecY7zXl4', gender: 'female', accent: 'au', pitch: 1.02 },
    temperament: { patience: 50, objectionCount: 2, style: 'direct' },
    locked: false,
    lines: pack({
      openers: ["Yeah, this is Sam, quick, I've got a class in ten."],
      cold: ["Mate, every software rep promises me 'more members'.", "I run on referrals. Always have."],
      hooked: ["Hm. January retention IS my problem. What do you know about it?"],
      objections: [
        "The last platform locked me into a year and did nothing. No contracts.",
        "My members are 40+. They won't use an app.",
      ],
      win: ["Alright, you get it. Demo Friday, 2pm, bring shoes, you're doing the class first."],
      hangup: ["Class time. Don't call back."],
    }),
  },
  {
    id: 'insurance-prospect', name: 'Insurance Prospect', emoji: '☂️',
    title: 'Invincible', industry: 'Insurance', salesStyle: 'Denial and delay',
    difficulty: 3, personality: 'Young, healthy, thinks insurance is a scam',
    speakingSpeed: 1.05, interruptiveness: 0.4, objectionStyle: 'It-won\'t-happen-to-me',
    voice: { eleven: 'IKne3meq5aSn9XLyUdCD', gender: 'male', accent: 'us', pitch: 1.08 },
    temperament: { patience: 48, objectionCount: 3, style: 'dismissive' },
    locked: false,
    lines: pack({
      openers: ["Hello? Oh man, is this an insurance thing? I'm like, 28."],
      cold: ["I literally never get sick.", "My money's going into index funds, not premiums."],
      hooked: ["Wait, it's THAT cheap at my age? That can't be right."],
      objections: [
        "Insurance companies just find reasons not to pay. Everyone knows that.",
        "I'll get it when I'm older and actually need it.",
        "My job gives me some coverage already. Probably. I think.",
      ],
      win: ["Okay okay, locking the rate now actually makes sense. Sign me up for the basic one."],
      hangup: ["Yeah I'm good, gonna live forever. Later."],
    }),
  },
  {
    id: 'skeptical-customer', name: 'Skeptical Customer', emoji: '🤨',
    title: 'Seen It All', industry: 'Retail', salesStyle: 'Trust deficit',
    difficulty: 3, personality: 'Burned before, fact-checks everything you say',
    speakingSpeed: 0.95, interruptiveness: 0.45, objectionStyle: 'Proof demands',
    voice: { eleven: 'XB0fDUnXU5powFXDhCwa', gender: 'female', accent: 'uk', pitch: 1.0 },
    temperament: { patience: 52, objectionCount: 3, style: 'analytical' },
    locked: false,
    lines: pack({
      openers: ["Go on then. But I'll be googling everything you say while you say it."],
      cold: ["Source? Because that sounds made up.", "'Industry leading.' According to whom, exactly?"],
      hooked: ["That's… verifiable, actually. I checked. Alright, continue."],
      objections: [
        "Your reviews mention billing problems. Explain those.",
        "If it's so good, why the aggressive outbound calls?",
        "What EXACTLY happens when I want to cancel?",
      ],
      win: ["Fine. You survived the interrogation. I'll try the trial, one month."],
      hangup: ["Caught you exaggerating. Done here."],
    }),
  },
  {
    id: 'budget-buyer', name: 'Budget Buyer', emoji: '🪙',
    title: 'Penny Watcher', industry: 'SMB', salesStyle: 'Price anchoring',
    difficulty: 2, personality: 'Loves you until the price, then negotiates everything',
    speakingSpeed: 1.0, interruptiveness: 0.35, objectionStyle: 'Discount grinding',
    voice: { eleven: 'yoZ06aMxZJJ28mfd3POQ', gender: 'male', accent: 'us', pitch: 1.0 },
    temperament: { patience: 60, objectionCount: 3, style: 'haggler' },
    locked: false,
    lines: pack({
      openers: ["Hi there! Always happy to hear a pitch. Can't promise we can afford it, ha!"],
      cold: ["Ooh, that sounds pricey already.", "Is there a free version? We love free."],
      hooked: ["Okay that's genuinely useful. Now the big question, what's the damage?"],
      objections: [
        "Your competitor quoted us 30% less. Match it?",
        "What if we pay annually, refer a friend, AND skip support?",
        "Can we start with the cheapest tier and you throw in the premium features?",
      ],
      win: ["Deal! You held your price and honestly? Respect. Where do I sign?"],
      hangup: ["Yeah, out of our range. Try us next fiscal year!"],
    }),
  },
  {
    id: 'procurement-manager', name: 'Procurement Manager', emoji: '📋',
    title: 'The Process', industry: 'Enterprise', salesStyle: 'RFP bureaucracy',
    difficulty: 4, personality: 'Process-obsessed, allergic to urgency, compares everything',
    speakingSpeed: 0.9, interruptiveness: 0.25, objectionStyle: 'Vendor-neutral stonewalling',
    voice: { eleven: 'MF3mGyEYCl7XYWbV9V6O', gender: 'female', accent: 'us', pitch: 0.98 },
    temperament: { patience: 62, objectionCount: 4, style: 'analytical' },
    locked: false,
    lines: pack({
      openers: ["This is procurement. Before anything else: are you an approved vendor?"],
      cold: ["That's outside our current RFP cycle.", "Urgency is a sales tactic. We don't respond to tactics."],
      hooked: ["Interesting, that compliance certification is actually rare. Noted."],
      objections: [
        "We require three competing bids. Who are your competitors? Be honest.",
        "Your SLA terms, 99.9 or 99.99? The difference matters legally.",
        "Net-90 payment terms, penalty clauses, and a security audit. Still interested?",
        "This needs sign-off from four departments. What's your onboarding timeline?",
      ],
      win: ["Very well. I'm adding you to the shortlist, the REAL one. Expect our questionnaire."],
      hangup: ["Submit through the vendor portal like everyone else. Goodbye."],
    }),
  },
]

export function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[10]
}

export const DIFFICULTY_LABELS = { 1: 'Warm-up', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Brutal' }

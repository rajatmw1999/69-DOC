# Closer — AI Cold Calling Training Platform

> **Become impossible to hang up on.**
> Train against AI versions of legendary salespeople, CEOs, difficult prospects, and
> real-world buyers. Get instant coaching after every call.

Closer is a premium, dark-themed training platform for cold calling, sales,
persuasion, and business communication — the "Duolingo of cold calling".
Built with React + Vite, no backend required: voice runs on the browser's
Web Speech API and all progress persists locally.

## ⚡ Instant preview — no setup at all

`preview.html` is the entire app compiled into a single file:

1. Download or clone this repo (green **Code** button → *Download ZIP* on GitHub).
2. Find `closer/preview.html`.
3. **Double-click it.** It opens in your browser — done. No install, no terminal.

> Tip: use **Chrome or Edge** and allow microphone access to talk to the AI with
> your voice. Browsers block the mic on files opened from disk, so from
> `preview.html` you'll use the ⌨️ type-to-speak bar during calls — run the dev
> server (below) or deploy to get full voice input.

To regenerate it after changing code: `npm run build:preview`.

## Run it properly (full voice support)

Step by step from zero:

1. **Install Node.js** ≥ 18 from [nodejs.org](https://nodejs.org) (LTS is fine).
2. **Open a terminal in this folder:**
   ```bash
   cd closer
   ```
3. **Install dependencies** (one time, ~30 seconds):
   ```bash
   npm install
   ```
4. **Start the dev server:**
   ```bash
   npm run dev
   ```
5. **Open the printed URL** — usually [http://localhost:5173](http://localhost:5173).
6. Click **Start Training** → unlock the phone → open **Prospects** → pick a
   character → talk. Allow the microphone when the browser asks.

Production build: `npm run build` → static site in `dist/` (deployable to
Vercel/Netlify/GitHub Pages as-is; `vercel.json` included).

**Voice support:** live speech input uses the Web Speech API — best in
**Chrome or Edge on `localhost` or HTTPS** with mic permission granted. Where
recognition is unavailable (Firefox, file://, mic denied), the phone
automatically falls back to a type-to-speak bar (the ⌨️ button toggles it any
time).

## 🌍 Give EVERY visitor studio voices (recommended for sharing)

If you want other people to use Closer on their own browsers and OSs with
great voices, without each of them configuring anything, deploy with a
server-side voice key. The included `api/tts.js` serverless function keeps
your ElevenLabs key on the server (visitors never see it) and streams studio
audio to every browser: Chrome, Safari, Firefox, mobile.

```bash
npm i -g vercel
cd closer
vercel                                # first deploy (creates the project)
vercel env add ELEVENLABS_API_KEY     # paste your key when prompted
vercel --prod                         # redeploy with the key active
```

That's it. The app probes `/api/tts` on load: if the key is configured, every
visitor automatically gets premium voices (the simulator shows "Studio voices
active, site-wide"); if not, it falls back to each visitor's browser voices.
The endpoint is protected with per-IP rate limiting, a 400-character text cap,
and tuning-value clamps. Watch your ElevenLabs usage dashboard if you share
the link widely, TTS characters are what you pay for.

Everything else already works cross-browser: speech input falls back to
type-to-speak where recognition is unavailable (Firefox, iOS Safari), and the
UI is responsive down to phones.

## 🎙️ Making the voices sound genuinely human

Browser text-to-speech has a hard quality ceiling — a basic system voice will
always sound robotic, no amount of tuning fixes that. Ranked options:

1. **Best — ElevenLabs key** (Settings → Voice & audio, free tier available):
   every character gets a distinct, genuinely human studio voice.
2. **Free — use Microsoft Edge**: Edge ships neural "Natural" voices that
   sound like real people, and Closer automatically prefers them.
3. **Okay — Chrome**: the "Google …" voices are intelligible but clearly
   synthetic.
4. **Rough — Firefox / bare Linux**: only robotic system voices; expect
   robot. Add an ElevenLabs key or switch browser.

The simulator shows which tier you're currently on and how to upgrade.

Tiers in detail:

1. **Browser voices (default, free).** One consistent voice is pinned per
   character — spread across your browser's best voices so characters sound
   different from each other — with subtle persona-tuned pitch and pace
   (Buffett slow and low, Cardone fast and hard). Long lines are spoken
   sentence-by-sentence, which prevents Chrome's mid-sentence audio cutoff
   and adds natural breaths.
2. **Premium voices (optional).** Paste an [ElevenLabs](https://elevenlabs.io)
   API key in **Settings → Voice & audio** and every character speaks with a
   distinct, human-sounding studio voice from the ElevenLabs voice library,
   vibe-matched and delivery-tuned per persona (expressiveness, stability,
   speed). The key stays in your browser's localStorage only.
3. **Cloned voices (bring your own rights).** The pipeline reads each
   character's `voice.eleven` ID from `src/data/characters.js` — if you hold a
   properly licensed/consented cloned voice on your ElevenLabs account, paste
   its voice ID there and the character uses it automatically. Closer ships
   with library voices, not clones: replicating a real, identifiable person's
   voice requires their documented consent (ElevenLabs' professional cloning
   flow verifies this with the voice owner directly).

On top of the voice itself, every line is written and decorated with the
character's real verbal mannerisms — Musk's hesitations ("Um… I mean…"),
Buffett's folksy asides ("Well… heh."), Cardone's shouted emphasis, Belfort's
"kid" — which also shapes the TTS rhythm, since synthesis pauses on the
punctuation.

## What's inside

### 📞 AI Phone Simulator (the centerpiece)
A realistic smartphone: lock screen + unlock animation, home screen, a
Prospects app (every call starts from a visible contact), recents, incoming &
outgoing call UI, active call screen with timer, mute/speaker controls, live
captions, dynamic waveform, and an optional **whisper coach** feeding live tips
("Mirror their last sentence", "They're losing interest") during the call.

### 🎭 21 AI characters with contextual conversations
Jordan Belfort, Grant Cardone, Steve Jobs, Elon Musk, Warren Buffett, Mark Cuban,
Barbara Corcoran, plus buyer archetypes (Angry Prospect, Cold CFO, Busy CEO,
Procurement Manager, …). Each has difficulty, personality, speaking speed,
interruptiveness, objection style, industry, and sales style. The conversation
engine responds to **what you actually said**: it extracts the topic, claims and
numbers from your words and answers them in the character's own voice — ask
Belfort how he's doing and he tells you he's RICH; quote "40 percent" at the
Cold CFO and he demands the cohort data behind *that* number. Interest/patience
state, phase progression (opening → discovery → objection → closing), hangups,
and closes drive the outcome.

### 🏁 21 challenge modes · 🧪 Scenario Lab
Selling a Pen, Cold Call, Discovery, Objection Handling, Closing, Negotiation,
Price Increase, Retention, Investor Pitch, Real Estate Listing, Luxury, B2B SaaS,
Door-to-door and more — plus a free-text scenario generator
("I need to sell accounting software to a dentist") that builds the prospect,
stakes, and objectives instantly.

### 🎧 Call Review
Overall 0–100 score plus 15 skill scores (confidence, tonality, pacing, energy,
empathy, listening, question quality, objection handling, closing, product
knowledge, rapport, control, persuasiveness, authority, professionalism),
talk-to-listen ratio, filler-word breakdown, repeated words, confidence trend,
great moments & mistake timeline with better alternative lines, full transcript
**replay with synced audio**, "What should I have said here?" coach
demonstrations, voice analysis, and JSON export.

### 🎓 Skill Academy — 29 modules
Articulation, Confidence, Storytelling, Negotiation, Persuasion, Mirroring,
Objection Handling, Closing, Discovery Questions, Tone Control, Executive
Presence, Sales Psychology, Behavioral Economics and more — each with lessons,
a drill, an AI practice call, and an interactive quiz with explanations.

### 📊 Progress & gamification
XP, levels, 7 ranks (Beginner → Legend), achievements, daily streaks, habit
tracker, weekly goals, skills radar, activity heatmap, score trends, weakness
tracker, improvement projections, leaderboards, weekly challenges, tournaments,
and practice rooms.

### 🧠 AI Coach & 🧰 Toolkit
A persistent mentor that reads your call history, surfaces recurring weaknesses,
assigns homework, and answers questions. The toolkit adds 10 extra simulators
(interview, salary negotiation, boardroom, media, crisis…), an AI script
generator, industry playbooks, cold email & LinkedIn practice, performance
certificates, and a custom character builder.

## Tech

- **React 18 + Vite + React Router** (hash routing → works on any static host)
- Hand-rolled SVG charts (radar, trend + crosshair tooltips, heatmap, bars) on a
  CVD-validated dark palette
- Web Speech API for STT/TTS with graceful fallbacks
- `localStorage` persistence with a seeded demo profile
- Zero runtime dependencies beyond React — deploys as a static site (`vercel.json` included)

> Demo build: authentication is simulated and community data is seeded.
> Settings → Account → Reset wipes local training data.

// Live Arena: pitch to other "people" on the platform and get rated.
// These are simulated live peers so the feature works with no backend. The
// page is structured so a real presence/matchmaking server can replace this
// seed later (see the note in pages/Arena.jsx).

export const LIVE_PEERS = [
  { id: 'p1', name: 'Maya C.', avatar: '🐉', role: 'AE at a SaaS startup', wants: 'Pitch me your product in 30 seconds', level: 47, rating: 4.8, mood: 'tough but fair' },
  { id: 'p2', name: 'Dre T.', avatar: '🦅', role: 'Real estate broker', wants: 'Sell me on why I should switch agents', level: 44, rating: 4.6, mood: 'skeptical' },
  { id: 'p3', name: 'Sofia M.', avatar: '🌹', role: 'Agency founder', wants: 'Cold-open me like you found my number', level: 41, rating: 4.9, mood: 'warm' },
  { id: 'p4', name: 'James O.', avatar: '⚡', role: 'SDR team lead', wants: 'Handle my "we already have a vendor"', level: 38, rating: 4.4, mood: 'blunt' },
  { id: 'p5', name: 'Lena H.', avatar: '🦊', role: 'Recruiter', wants: 'Convince me to take a screening call', level: 36, rating: 4.7, mood: 'curious' },
  { id: 'p6', name: 'Ravi P.', avatar: '🐯', role: 'Gym owner', wants: 'Upsell me on the premium tier', level: 34, rating: 4.3, mood: 'busy' },
  { id: 'p7', name: 'Nina V.', avatar: '🦢', role: 'CFO', wants: 'Justify the ROI to me', level: 31, rating: 4.5, mood: 'analytical' },
  { id: 'p8', name: 'Tom B.', avatar: '🦉', role: 'Car dealer', wants: 'Negotiate me down without folding', level: 25, rating: 4.2, mood: 'haggler' },
]

// Peer reactions keyed to how good the pitch was, so the "review" feels earned.
export const PEER_REVIEWS = {
  great: [
    'Genuinely smooth. You had me by the second sentence. I would have booked.',
    'Strong open, clear value, asked for the meeting. Textbook. 🔥',
    'Confident without being pushy. That is exactly how you do it.',
    'You mirrored me and then closed. Respect. I would take that call.',
  ],
  good: [
    'Solid. A little long in the middle but you recovered with the ask.',
    'Good energy. Tighten the value prop and this is a yes.',
    'I liked it. You lost me for a second on price, but you brought it back.',
    'Nearly there, you just needed one more question before the close.',
  ],
  mid: [
    'It was okay. I did not really feel why I should care yet.',
    'You talked more than you listened. Ask me something next time.',
    'Bit generic. What makes you different from the last three people?',
    'You went for the close too early. Warm me up first.',
  ],
  weak: [
    'Honestly, you lost me. Too much filler, not enough point.',
    'That felt like a script. Talk to me like a person.',
    'No hook, no ask. What did you actually want me to do?',
    'I would have hung up. Lead with why this matters to me.',
  ],
}

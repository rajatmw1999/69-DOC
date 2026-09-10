// Community: leaderboard seed, weekly challenge, practice rooms.

export const LEADERBOARD = [
  { rank: 1, name: 'Maya Chen', avatar: '🐉', level: 47, xp: 128400, streak: 64, badge: 'Master Closer' },
  { rank: 2, name: 'Dre Thompson', avatar: '🦅', level: 44, xp: 117210, streak: 41, badge: 'Master Closer' },
  { rank: 3, name: 'Sofia Marino', avatar: '🌹', level: 41, xp: 104880, streak: 38, badge: 'Master Closer' },
  { rank: 4, name: 'James Okafor', avatar: '⚡', level: 38, xp: 96350, streak: 22, badge: 'Elite Closer' },
  { rank: 5, name: 'Lena Hoffmann', avatar: '🦊', level: 36, xp: 89100, streak: 30, badge: 'Elite Closer' },
  { rank: 6, name: 'Ravi Patel', avatar: '🐯', level: 34, xp: 82740, streak: 17, badge: 'Elite Closer' },
  { rank: 7, name: 'Nina Volkov', avatar: '🦢', level: 31, xp: 74560, streak: 25, badge: 'Elite Closer' },
  { rank: 8, name: 'Carlos Reyes', avatar: '🐺', level: 29, xp: 68020, streak: 12, badge: 'Elite Closer' },
  { rank: 9, name: 'Amara Diallo', avatar: '🌊', level: 27, xp: 61480, streak: 19, badge: 'Senior Closer' },
  { rank: 10, name: 'Tom Beckett', avatar: '🦉', level: 25, xp: 55900, streak: 9, badge: 'Senior Closer' },
]

export const WEEKLY_CHALLENGE = {
  name: 'The Gatekeeper Gauntlet',
  desc: 'Close the Busy CEO in under 4 minutes. Top 100 scores earn the Gauntlet badge.',
  endsInDays: 3,
  entrants: 2841,
  characterId: 'busy-ceo',
  topScore: 96,
}

export const TOURNAMENT = {
  name: 'February Closing Cup',
  desc: 'Month-long ladder. Every scored call counts. Champion unlocks the Platinum Wolf avatar.',
  prizePool: ['🏆 Platinum Wolf avatar', '💎 3 months Premium', '🎖️ Champion profile frame'],
  daysLeft: 12,
  entrants: 11203,
}

export const PRACTICE_ROOMS = [
  { id: 'r1', name: 'Cold Call Grind', members: 128, live: 14, focus: 'Cold Call Challenge', level: 'All levels' },
  { id: 'r2', name: 'Objection Dojo', members: 86, live: 9, focus: 'Objection Handling', level: 'Intermediate+' },
  { id: 'r3', name: 'SaaS Sellers Guild', members: 214, live: 22, focus: 'B2B SaaS', level: 'All levels' },
  { id: 'r4', name: 'Real Estate Sharks', members: 97, live: 7, focus: 'Listing Calls', level: 'All levels' },
  { id: 'r5', name: 'Founders Pitch Club', members: 143, live: 11, focus: 'Investor Pitch', level: 'Advanced' },
]

export const FRIEND_FEED = [
  { name: 'Maya Chen', avatar: '🐉', action: 'closed Grant Cardone with a 94', ago: '2h ago' },
  { name: 'Ravi Patel', avatar: '🐯', action: 'hit a 21-day streak', ago: '5h ago' },
  { name: 'Sofia Marino', avatar: '🌹', action: 'finished the Negotiation module', ago: '8h ago' },
  { name: 'Tom Beckett', avatar: '🦉', action: 'challenged you: Cold CFO, best of 3', ago: '1d ago' },
]

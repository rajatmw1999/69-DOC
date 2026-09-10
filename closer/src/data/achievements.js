// Achievements + elite badges.

export const ACHIEVEMENTS = [
  { id: 'first-call', name: 'First Blood', emoji: '📞', desc: 'Complete your first training call', tier: 'bronze' },
  { id: 'ten-calls', name: 'Warming Up', emoji: '🔥', desc: 'Complete 10 training calls', tier: 'bronze' },
  { id: 'fifty-calls', name: 'Dialtone Veteran', emoji: '☎️', desc: 'Complete 50 training calls', tier: 'silver' },
  { id: 'streak-3', name: 'Momentum', emoji: '⚡', desc: 'Train 3 days in a row', tier: 'bronze' },
  { id: 'streak-7', name: 'Unstoppable Week', emoji: '🗓️', desc: 'Train 7 days in a row', tier: 'silver' },
  { id: 'streak-30', name: 'Iron Discipline', emoji: '🛡️', desc: 'Train 30 days in a row', tier: 'gold' },
  { id: 'objection-slayer', name: 'Objection Slayer', emoji: '⚔️', desc: 'Survive 4 objections in one call', tier: 'silver' },
  { id: 'score-80', name: 'Sharp Shooter', emoji: '🎯', desc: 'Score 80+ on any call', tier: 'silver' },
  { id: 'score-90', name: 'Elite Performance', emoji: '💎', desc: 'Score 90+ on any call', tier: 'gold' },
  { id: 'beat-wolf', name: 'Wolf Tamer', emoji: '🐺', desc: 'Close Jordan Belfort', tier: 'gold' },
  { id: 'beat-brutal', name: 'Giant Slayer', emoji: '🗡️', desc: 'Close any Brutal-difficulty character', tier: 'gold' },
  { id: 'no-filler', name: 'Zero Filler', emoji: '🧊', desc: 'Complete a call with 0 filler words', tier: 'silver' },
  { id: 'marathon', name: 'Marathon Closer', emoji: '⏱️', desc: 'Hold a call for over 10 minutes', tier: 'silver' },
  { id: 'academy-first', name: 'Student of the Game', emoji: '📚', desc: 'Complete your first academy module', tier: 'bronze' },
  { id: 'academy-5', name: 'Scholar', emoji: '🎓', desc: 'Complete 5 academy modules', tier: 'silver' },
  { id: 'perfect-quiz', name: 'Perfect Recall', emoji: '🧠', desc: 'Score 100% on any quiz', tier: 'bronze' },
  { id: 'night-owl', name: 'After Hours', emoji: '🌙', desc: 'Train after 10pm', tier: 'bronze' },
  { id: 'early-bird', name: 'Dawn Patrol', emoji: '🌅', desc: 'Train before 7am', tier: 'bronze' },
  { id: 'comeback', name: 'The Comeback', emoji: '🔄', desc: 'Turn a hostile prospect into a close', tier: 'gold' },
  { id: 'legend-rank', name: 'Living Legend', emoji: '👑', desc: 'Reach the Legend rank', tier: 'elite' },
]

export const TIER_COLORS = {
  bronze: '#b08d57', silver: '#aab4c0', gold: '#d3a94e', elite: '#f0d080',
}

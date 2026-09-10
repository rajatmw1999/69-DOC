// Rank ladder, levels and XP math.

export const RANKS = [
  { name: 'Beginner',      minLevel: 1,  icon: '🌱' },
  { name: 'Apprentice',    minLevel: 5,  icon: '📞' },
  { name: 'Closer',        minLevel: 10, icon: '🎯' },
  { name: 'Senior Closer', minLevel: 18, icon: '💼' },
  { name: 'Elite Closer',  minLevel: 28, icon: '🏆' },
  { name: 'Master Closer', minLevel: 40, icon: '👑' },
  { name: 'Legend',        minLevel: 55, icon: '⚡' },
]

// XP needed to go from level n to n+1
export function xpForLevel(level) {
  return Math.round(120 * Math.pow(level, 1.32))
}

export function levelFromXp(totalXp) {
  let level = 1
  let rem = totalXp
  while (rem >= xpForLevel(level)) {
    rem -= xpForLevel(level)
    level += 1
  }
  return { level, into: rem, next: xpForLevel(level) }
}

export function rankForLevel(level) {
  let rank = RANKS[0]
  for (const r of RANKS) if (level >= r.minLevel) rank = r
  return rank
}

export function nextRank(level) {
  return RANKS.find((r) => r.minLevel > level) || null
}

export function xpForCall({ overall, durationSec, difficulty = 3 }) {
  const base = 40
  const scoreBonus = Math.round(overall * 0.9)
  const timeBonus = Math.min(60, Math.round(durationSec / 12))
  const difficultyMult = 1 + (difficulty - 1) * 0.18
  return Math.round((base + scoreBonus + timeBonus) * difficultyMult)
}

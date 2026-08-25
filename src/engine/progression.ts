import { useGameStore } from '@/stores/useGameStore'
import type { ClearanceTier, PlayerStats } from '@/types'

export function deriveClearance(totalPoints: number): ClearanceTier {
  if (totalPoints >= 3000) return 'SINGULARITY'
  if (totalPoints >= 1500) return 'ARCHITECT'
  if (totalPoints >= 600) return 'ANALYST'
  if (totalPoints >= 100) return 'OPERATOR'
  return 'INITIATE'
}

export function getPlayerStats(): PlayerStats {
  const s = useGameStore.getState()
  return {
    totalPoints: s.totalPoints,
    currentStreak: s.currentStreak,
    bestStreak: s.bestStreak,
    clearanceTier: deriveClearance(s.totalPoints),
  }
}

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

export interface RunRankInput {
  /** 0-1 fraction of anomalies cleared in the run. */
  completion: number
  /** 0-1 fraction of transmissions that matched on first evaluation. */
  accuracy: number
}

/**
 * Run debrief label. Game vocabulary only — no school-style grades.
 */
export function deriveRunRank({ completion, accuracy }: RunRankInput): string {
  const pct = (v: number) => Math.min(1, Math.max(0, v))
  if (pct(completion) >= 1 && pct(accuracy) >= 0.9) return 'CLEARANCE GRANTED'
  if (pct(completion) >= 1) return 'VAULT SEALED'
  if (pct(completion) >= 0.5 && pct(accuracy) >= 0.7) return 'ANOMALY CONTAINED'
  if (pct(completion) > 0 || pct(accuracy) > 0) return 'SYNC STABLE'
  return 'SIGNAL LOST'
}

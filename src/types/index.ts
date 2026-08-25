export type ClearanceTier = 'INITIATE' | 'OPERATOR' | 'ANALYST' | 'ARCHITECT' | 'SINGULARITY'

export interface PlayerStats {
  totalPoints: number
  currentStreak: number
  bestStreak: number
  clearanceTier: ClearanceTier
}

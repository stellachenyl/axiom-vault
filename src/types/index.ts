export type ThreatLevel = 1 | 2 | 3 | 4 | 5

export interface Vault {
  id: string
  codename: string
  sector: string
  description: string
  threatLevel: ThreatLevel
  apTotal: number
}

export interface Anomaly {
  id: string
  vaultId: string
  index: number
  codename: string
  signal: string
  threatLevel: ThreatLevel
  apValue: number
  hints: string[]
}

export interface ProblemPack {
  vault: Vault
  anomalies: Anomaly[]
}

export type ClearanceTier = 'INITIATE' | 'OPERATOR' | 'ANALYST' | 'ARCHITECT' | 'SINGULARITY'

export interface PlayerStats {
  totalPoints: number
  currentStreak: number
  bestStreak: number
  clearanceTier: ClearanceTier
}

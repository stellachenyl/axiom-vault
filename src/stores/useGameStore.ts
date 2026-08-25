import { create } from 'zustand'
import type { ClearanceTier } from '@/types'

interface GameState {
  totalPoints: number
  currentStreak: number
  bestStreak: number
  unlockedVaults: string[]
  completedProblems: string[]
  hintsUsed: number
  lastPlayedPackId: string | null
}

interface GameActions {
  addPoints: (amount: number) => void
  registerCompletion: (problemId: string, points: number) => void
  breakStreak: () => void
  unlockVault: (vaultId: string) => void
  useHint: () => void
  setLastPlayedPack: (packId: string) => void
  resetRun: () => void
}

export type ClearanceTierName = ClearanceTier

const initialState: GameState = {
  totalPoints: 0,
  currentStreak: 0,
  bestStreak: 0,
  unlockedVaults: ['vault-alpha'],
  completedProblems: [],
  hintsUsed: 0,
  lastPlayedPackId: null,
}

export const useGameStore = create<GameState & GameActions>()((set) => ({
  ...initialState,

  addPoints: (amount) => set((s) => ({ totalPoints: s.totalPoints + amount })),

  registerCompletion: (problemId, points) =>
    set((s) => ({
      completedProblems: s.completedProblems.includes(problemId)
        ? s.completedProblems
        : [...s.completedProblems, problemId],
      currentStreak: s.currentStreak + 1,
      bestStreak: Math.max(s.bestStreak, s.currentStreak + 1),
      totalPoints: s.totalPoints + points,
    })),

  breakStreak: () => set({ currentStreak: 0 }),

  unlockVault: (vaultId) =>
    set((s) => ({
      unlockedVaults: s.unlockedVaults.includes(vaultId)
        ? s.unlockedVaults
        : [...s.unlockedVaults, vaultId],
    })),

  useHint: () => set((s) => ({ hintsUsed: s.hintsUsed + 1 })),

  setLastPlayedPack: (packId) => set({ lastPlayedPackId: packId }),

  resetRun: () => set(initialState),
}))

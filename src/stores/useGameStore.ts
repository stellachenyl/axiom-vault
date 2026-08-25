import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ClearanceTier } from '@/types'

export interface AttemptRecord {
  problemId: string
  packId: string
  correct: boolean
  pointsAwarded: number
  hintsUsed: number
}

interface GameState {
  totalPoints: number
  currentStreak: number
  bestStreak: number
  unlockedVaults: string[]
  completedProblems: string[]
  hintsUsed: number
  lastPlayedPackId: string | null
  /** Per-submission telemetry backing the results debrief. */
  attemptLog: AttemptRecord[]
}

interface GameActions {
  addPoints: (amount: number) => void
  registerCompletion: (problemId: string, points: number) => void
  recordAttempt: (attempt: AttemptRecord) => void
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
  unlockedVaults: ['vault-00-calibration'],
  completedProblems: [],
  hintsUsed: 0,
  lastPlayedPackId: null,
  attemptLog: [],
}

const STORAGE_KEY = 'axiom-vault-progress'

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set) => ({
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

      recordAttempt: ({ problemId, pointsAwarded, ...rest }) =>
        set((s) => {
          const firstClear = rest.correct && !s.completedProblems.includes(problemId)
          const streak = rest.correct ? s.currentStreak + 1 : 0
          return {
            totalPoints: s.totalPoints + pointsAwarded,
            currentStreak: streak,
            bestStreak: Math.max(s.bestStreak, streak),
            completedProblems: firstClear
              ? [...s.completedProblems, problemId]
              : s.completedProblems,
            lastPlayedPackId: rest.packId,
            attemptLog: [...s.attemptLog, { problemId, pointsAwarded, ...rest }],
          }
        }),

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
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        totalPoints: s.totalPoints,
        currentStreak: s.currentStreak,
        bestStreak: s.bestStreak,
        unlockedVaults: s.unlockedVaults,
        completedProblems: s.completedProblems,
        hintsUsed: s.hintsUsed,
        lastPlayedPackId: s.lastPlayedPackId,
        attemptLog: s.attemptLog,
      }),
    },
  ),
)

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore, type AttemptRecord } from './useGameStore'

function attempt(overrides: Partial<AttemptRecord> = {}): AttemptRecord {
  return {
    problemId: 'fx-01',
    packId: 'vault-00-calibration',
    correct: true,
    pointsAwarded: 100,
    hintsUsed: 0,
    ...overrides,
  }
}

beforeEach(() => {
  useGameStore.getState().resetRun()
})

describe('initial state', () => {
  it('starts with defaults', () => {
    const s = useGameStore.getState()
    expect(s.totalPoints).toBe(0)
    expect(s.currentStreak).toBe(0)
    expect(s.bestStreak).toBe(0)
    expect(s.completedProblems).toEqual([])
    expect(s.unlockedVaults).toContain('vault-00-calibration')
    expect(s.hintsUsed).toBe(0)
    expect(s.lastPlayedPackId).toBeNull()
    expect(s.attemptLog).toEqual([])
  })
})

describe('recordAttempt', () => {
  it('awards points and advances the streak on a correct answer', () => {
    const s = useGameStore.getState()
    s.recordAttempt(attempt({ pointsAwarded: 137 }))
    const after = useGameStore.getState()
    expect(after.totalPoints).toBe(137)
    expect(after.currentStreak).toBe(1)
    expect(after.completedProblems).toContain('fx-01')
    expect(after.lastPlayedPackId).toBe('vault-00-calibration')
  })

  it('updates bestStreak only when currentStreak exceeds it', () => {
    const store = useGameStore.getState()
    store.recordAttempt(attempt())
    store.recordAttempt(attempt({ problemId: 'fx-02' }))
    expect(useGameStore.getState().bestStreak).toBe(2)

    // A miss resets the streak...
    store.recordAttempt(attempt({ problemId: 'fx-03', correct: false, pointsAwarded: 0 }))
    expect(useGameStore.getState().currentStreak).toBe(0)
    // ...but bestStreak is preserved.
    expect(useGameStore.getState().bestStreak).toBe(2)
  })

  it('does not double-count a completed problem', () => {
    const store = useGameStore.getState()
    store.recordAttempt(attempt({ pointsAwarded: 100 }))
    // Re-solving the same node (e.g. replaying the vault) still awards AP
    // but must not duplicate the completion entry.
    store.recordAttempt(attempt({ pointsAwarded: 50 }))
    const s = useGameStore.getState()
    expect(s.completedProblems.filter((id) => id === 'fx-01')).toHaveLength(1)
    expect(s.totalPoints).toBe(150)
    expect(s.attemptLog).toHaveLength(2)
  })

  it('appends failed attempts to telemetry without awarding points', () => {
    useGameStore.getState().recordAttempt(
      attempt({ correct: false, pointsAwarded: 0, hintsUsed: 2 }),
    )
    const s = useGameStore.getState()
    expect(s.totalPoints).toBe(0)
    expect(s.currentStreak).toBe(0)
    expect(s.attemptLog).toHaveLength(1)
    expect(s.attemptLog[0].hintsUsed).toBe(2)
  })
})

describe('other actions', () => {
  it('addPoints adds without touching streaks', () => {
    useGameStore.getState().addPoints(42)
    expect(useGameStore.getState().totalPoints).toBe(42)
  })

  it('unlockVault is idempotent', () => {
    useGameStore.getState().unlockVault('vault-01-drift')
    useGameStore.getState().unlockVault('vault-01-drift')
    expect(useGameStore.getState().unlockedVaults.filter((v) => v === 'vault-01-drift')).toHaveLength(1)
  })

  it('useHint increments the counter', () => {
    useGameStore.getState().useHint()
    useGameStore.getState().useHint()
    expect(useGameStore.getState().hintsUsed).toBe(2)
  })

  it('breakStreak zeroes only the current streak', () => {
    const store = useGameStore.getState()
    store.recordAttempt(attempt())
    store.breakStreak()
    const s = useGameStore.getState()
    expect(s.currentStreak).toBe(0)
    expect(s.bestStreak).toBe(1)
  })
})

describe('persistence', () => {
  it('persists state to localStorage', () => {
    useGameStore.getState().recordAttempt(attempt({ pointsAwarded: 250 }))
    const raw = window.localStorage.getItem('axiom-vault-progress')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.state.totalPoints).toBe(250)
    expect(parsed.state.completedProblems).toContain('fx-01')
  })

  it('persists across a simulated reload (fresh module instance)', async () => {
    useGameStore.getState().recordAttempt(attempt({ pointsAwarded: 90 }))
    vi.resetModules()
    const fresh = await import('./useGameStore')
    // New module instance rehydrates from localStorage.
    expect(fresh.useGameStore.getState().totalPoints).toBe(90)
    expect(fresh.useGameStore.getState().attemptLog).toHaveLength(1)
  })

  it('corrupt localStorage does not crash the app and falls back to defaults', async () => {
    window.localStorage.setItem('axiom-vault-progress', '{not-valid-json!!!')
    vi.resetModules()
    const fresh = await import('./useGameStore')
    const s = fresh.useGameStore.getState()
    expect(s.totalPoints).toBe(0)
    expect(s.currentStreak).toBe(0)
    expect(() => fresh.useGameStore.getState().resetRun()).not.toThrow()
  })

  it('resetRun clears stored state safely', () => {
    const store = useGameStore.getState()
    store.recordAttempt(attempt())
    store.resetRun()
    const s = useGameStore.getState()
    expect(s.totalPoints).toBe(0)
    expect(s.attemptLog).toEqual([])
    const raw = JSON.parse(window.localStorage.getItem('axiom-vault-progress')!)
    expect(raw.state.totalPoints).toBe(0)
    expect(raw.state.attemptLog).toEqual([])
  })
})

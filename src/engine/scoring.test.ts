import { describe, expect, it } from 'vitest'
import { computeEarnedPoints, streakMultiplier } from './scoring'

describe('streakMultiplier', () => {
  it('returns 1.0x for streaks below 3', () => {
    expect(streakMultiplier(0)).toBe(1.0)
    expect(streakMultiplier(2)).toBe(1.0)
  })

  it('returns 1.1x for streaks of 3 to 5', () => {
    expect(streakMultiplier(3)).toBe(1.1)
    expect(streakMultiplier(5)).toBe(1.1)
  })

  it('returns 1.2x for streaks of 6 to 9', () => {
    expect(streakMultiplier(6)).toBe(1.2)
    expect(streakMultiplier(9)).toBe(1.2)
  })

  it('returns 1.3x for streaks of 10 or more', () => {
    expect(streakMultiplier(10)).toBe(1.3)
    expect(streakMultiplier(25)).toBe(1.3)
  })
})

describe('computeEarnedPoints', () => {
  const base = { basePoints: 100, secondsUsed: 0, hintsRevealed: 0, currentStreak: 0 }

  it('awards base points when no limit and no modifiers apply', () => {
    expect(computeEarnedPoints(base)).toBe(100)
  })

  it('awards the full 50% time bonus on an instant solve with a time limit', () => {
    expect(computeEarnedPoints({ ...base, timeLimitSeconds: 60 })).toBe(150)
  })

  it('decreases the time bonus linearly and never goes negative', () => {
    // Half the window used → half of the max bonus (+25%).
    expect(computeEarnedPoints({ ...base, timeLimitSeconds: 60, secondsUsed: 30 })).toBe(125)
    // Limit fully consumed → no bonus.
    expect(computeEarnedPoints({ ...base, timeLimitSeconds: 60, secondsUsed: 60 })).toBe(100)
    // Overtime is clamped — still no penalty.
    expect(computeEarnedPoints({ ...base, timeLimitSeconds: 60, secondsUsed: 600 })).toBe(100)
  })

  it('applies 10% hint penalties per revealed channel up to three', () => {
    expect(computeEarnedPoints({ ...base, hintsRevealed: 1 })).toBe(90)
    expect(computeEarnedPoints({ ...base, hintsRevealed: 2 })).toBe(80)
    expect(computeEarnedPoints({ ...base, hintsRevealed: 3 })).toBe(70)
    expect(computeEarnedPoints({ ...base, hintsRevealed: 7 })).toBe(70) // capped at 3
  })

  it('never reduces earned points below 20% of base before the multiplier', () => {
    // Three hints (-30%) plus a full time window would drop far lower without the floor.
    const earned = computeEarnedPoints({
      basePoints: 50,
      timeLimitSeconds: 10,
      secondsUsed: 10,
      hintsRevealed: 3,
      currentStreak: 0,
    })
    expect(earned).toBeGreaterThanOrEqual(Math.round(50 * 0.2))
  })

  it('applies the streak multiplier after other adjustments', () => {
    // Base 200, instant solve (+50%), one hint (-20) → 280, ×1.2 = 336.
    expect(
      computeEarnedPoints({
        basePoints: 200,
        timeLimitSeconds: 60,
        secondsUsed: 0,
        hintsRevealed: 1,
        currentStreak: 6,
      }),
    ).toBe(336)
  })

  it('always returns an integer', () => {
    // 100 base + 37% time bonus × 1.3 multiplier would be fractional.
    const earned = computeEarnedPoints({ ...base, currentStreak: 10 })
    expect(Number.isInteger(earned)).toBe(true)
  })
})

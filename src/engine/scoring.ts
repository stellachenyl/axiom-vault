/**
 * Axiom Vault scoring protocol.
 *
 * Earned points for a cleared anomaly are derived from the problem's base
 * value, adjusted by a time bonus (up to +50%), hint penalties (-10% per
 * channel revealed, floored at 20% of base), and a streak multiplier.
 */

export interface ScoreInput {
  /** Base points declared on the problem record. */
  basePoints: number
  /** Declared limit in seconds; omit/0 means no time bonus applies. */
  timeLimitSeconds?: number
  /** Seconds elapsed between trial open and submission. */
  secondsUsed: number
  /** Hint channels revealed before submission. */
  hintsRevealed: number
  /**
   * Streak count at the moment of the correct transmission
   * (i.e. consecutive clears BEFORE this one).
   */
  currentStreak: number
}

const TIME_BONUS_FRACTION = 0.5
const HINT_PENALTY_FRACTION = 0.1
const MIN_EARNED_FRACTION = 0.2

/** Multiplier tiers by consecutive-clear streak. */
export function streakMultiplier(currentStreak: number): number {
  if (currentStreak >= 10) return 1.3
  if (currentStreak >= 6) return 1.2
  if (currentStreak >= 3) return 1.1
  return 1.0
}

/** Fraction of the maximum time bonus retained for the elapsed time. */
function timeBonusFactor(secondsUsed: number, limit: number): number {
  if (limit <= 0) return 0
  const remainingFraction = 1 - secondsUsed / limit
  return Math.min(1, Math.max(0, remainingFraction))
}

/**
 * Computes final earned points as an integer according to the protocol:
 *
 *   earned = clamp(base + timeBonus - hintPenalty, min 20% of base)
 *          × streakMultiplier
 */
export function computeEarnedPoints(input: ScoreInput): number {
  const { basePoints, timeLimitSeconds, secondsUsed, hintsRevealed, currentStreak } = input

  const safeBase = Math.max(0, basePoints)

  const timeBonus =
    timeLimitSeconds !== undefined && timeLimitSeconds > 0
      ? TIME_BONUS_FRACTION * safeBase * timeBonusFactor(secondsUsed, timeLimitSeconds)
      : 0

  const effectiveHints = Math.max(0, Math.floor(hintsRevealed))
  const hintPenalty = HINT_PENALTY_FRACTION * safeBase * Math.min(effectiveHints, 3)

  const floor = MIN_EARNED_FRACTION * safeBase
  const preMultiplier = Math.max(safeBase + timeBonus - hintPenalty, floor)

  return Math.round(preMultiplier * streakMultiplier(currentStreak))
}

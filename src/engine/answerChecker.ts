import type { Problem, ProblemAnswer } from '@/types/problem'

export type AnswerVerdict = 'correct' | 'close' | 'incorrect' | 'unparseable'

export interface AnswerCheckResult {
  verdict: AnswerVerdict
  /** True only for a full match — drives streaks and point awards. */
  isCorrect: boolean
  /** True when the numeric key was within double tolerance ("close signal"). */
  isClose?: boolean
}

/** "Close" feedback shows when the key lands within this multiple of tolerance. */
const CLOSE_TOLERANCE_MULTIPLIER = 2

/**
 * Parses raw user input as a decimal number. Accepts an optional sign and
 * standard decimal notation; rejects anything else (no expressions).
 */
export function parseNumericInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/^\+/, '')
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

function checkNumeric(answer: Extract<ProblemAnswer, { type: 'numeric' }>, raw: string): AnswerCheckResult {
  const parsed = parseNumericInput(raw)
  if (parsed === null) return { verdict: 'unparseable', isCorrect: false }

  const tolerance = answer.tolerance ?? 0
  const distance = Math.abs(parsed - answer.value)

  if (distance <= tolerance) return { verdict: 'correct', isCorrect: true }
  if (distance <= tolerance * CLOSE_TOLERANCE_MULTIPLIER && tolerance > 0) {
    return { verdict: 'close', isCorrect: false, isClose: true }
  }
  return { verdict: 'incorrect', isCorrect: false }
}

function checkChoice(answer: Extract<ProblemAnswer, { type: 'choice' }>, raw: string): AnswerCheckResult {
  return raw.trim() === answer.correctOptionId
    ? { verdict: 'correct', isCorrect: true }
    : { verdict: 'incorrect', isCorrect: false }
}

function checkText(answer: Extract<ProblemAnswer, { type: 'text' }>, raw: string): AnswerCheckResult {
  let candidate = raw
  if (answer.trimWhitespace !== false) candidate = candidate.trim()

  const accepted = answer.acceptedAnswers.map((acceptedValue) =>
    answer.caseSensitive ? acceptedValue : acceptedValue.toLowerCase(),
  )
  const normalized = answer.caseSensitive ? candidate : candidate.toLowerCase()

  return accepted.includes(normalized)
    ? { verdict: 'correct', isCorrect: true }
    : { verdict: 'incorrect', isCorrect: false }
}

/** Evaluates a raw submission against the problem's answer record. */
export function checkAnswer(problem: Problem, rawSubmission: string): AnswerCheckResult {
  switch (problem.answer.type) {
    case 'numeric':
      return checkNumeric(problem.answer, rawSubmission)
    case 'choice':
      return checkChoice(problem.answer, rawSubmission)
    case 'text':
      return checkText(problem.answer, rawSubmission)
  }
}

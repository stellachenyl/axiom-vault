import { describe, expect, it } from 'vitest'
import { checkAnswer, parseNumericInput } from './answerChecker'
import type { Problem } from '@/types/problem'

function makeProblem(overrides: Partial<Problem> & Pick<Problem, 'answer'>): Problem {
  return {
    id: 'test-01',
    kind: overrides.answer.type,
    statementMarkdown: 'Test signal.',
    points: 100,
    hints: [],
    hiddenTags: [],
    ...overrides,
  }
}

describe('parseNumericInput', () => {
  it('accepts integers, decimals and signed values', () => {
    expect(parseNumericInput('42')).toBe(42)
    expect(parseNumericInput(' 3.14 ')).toBe(3.14)
    expect(parseNumericInput('-7')).toBe(-7)
    expect(parseNumericInput('+2.5')).toBe(2.5)
    expect(parseNumericInput('.5')).toBe(null) // strict decimal notation
  })

  it('rejects non-numeric payloads', () => {
    expect(parseNumericInput('abc')).toBe(null)
    expect(parseNumericInput('1+2')).toBe(null)
    expect(parseNumericInput('')).toBe(null)
    expect(parseNumericInput('NaN')).toBe(null)
  })
})

describe('checkAnswer — numeric', () => {
  const problem = makeProblem({
    answer: { type: 'numeric', value: 6, tolerance: 0 },
  })

  it('matches exact values within tolerance', () => {
    expect(checkAnswer(problem, '6').isCorrect).toBe(true)
  })

  it('reports unparseable input without a verdict of correct', () => {
    const result = checkAnswer(problem, 'six')
    expect(result.verdict).toBe('unparseable')
    expect(result.isCorrect).toBe(false)
  })

  it('supports negative and decimal keys', () => {
    const signed = makeProblem({ answer: { type: 'numeric', value: -2.5, tolerance: 0.1 } })
    expect(checkAnswer(signed, '-2.45').isCorrect).toBe(true)
  })

  it('flags close signals inside double tolerance but outside normal tolerance', () => {
    const tolerant = makeProblem({ answer: { type: 'numeric', value: 10, tolerance: 0.5 } })
    const result = checkAnswer(tolerant, '10.9') // > 0.5 but ≤ 1.0
    expect(result.isCorrect).toBe(false)
    expect(result.verdict).toBe('close')
  })

  it('does not flag close when tolerance is zero (exact match only)', () => {
    const result = checkAnswer(problem, '6.001')
    expect(result.verdict).toBe('incorrect')
    expect(result.isClose).toBeUndefined()
  })

  it('rejects keys beyond double tolerance outright', () => {
    const tolerant = makeProblem({ answer: { type: 'numeric', value: 10, tolerance: 0.5 } })
    expect(checkAnswer(tolerant, '12').verdict).toBe('incorrect')
  })
})

describe('checkAnswer — choice', () => {
  const problem = makeProblem({
    answer: {
      type: 'choice',
      options: [
        { id: 'a', labelMarkdown: 'Option A' },
        { id: 'b', labelMarkdown: 'Option B' },
      ],
      correctOptionId: 'b',
    },
  })

  it('matches the correct option id', () => {
    expect(checkAnswer(problem, 'b').isCorrect).toBe(true)
  })

  it('rejects other option ids', () => {
    expect(checkAnswer(problem, 'a').isCorrect).toBe(false)
  })
})

describe('checkAnswer — text', () => {
  it('trims whitespace by default', () => {
    const problem = makeProblem({
      answer: { type: 'text', acceptedAnswers: ['24'] },
    })
    expect(checkAnswer(problem, '  24  ').isCorrect).toBe(true)
  })

  it('respects trimWhitespace: false', () => {
    const problem = makeProblem({
      answer: { type: 'text', acceptedAnswers: ['24'], trimWhitespace: false },
    })
    expect(checkAnswer(problem, ' 24 ').isCorrect).toBe(false)
  })

  it('ignores case by default', () => {
    const problem = makeProblem({
      answer: { type: 'text', acceptedAnswers: ['SIGNAL'] },
    })
    expect(checkAnswer(problem, 'signal').isCorrect).toBe(true)
  })

  it('respects caseSensitive: true', () => {
    const problem = makeProblem({
      answer: { type: 'text', acceptedAnswers: ['Signal'], caseSensitive: true },
    })
    expect(checkAnswer(problem, 'signal').isCorrect).toBe(false)
    expect(checkAnswer(problem, 'Signal').isCorrect).toBe(true)
  })

  it('accepts any of the listed accepted answers', () => {
    const problem = makeProblem({
      answer: { type: 'text', acceptedAnswers: ['alpha', 'beta'] },
    })
    expect(checkAnswer(problem, 'beta').isCorrect).toBe(true)
    expect(checkAnswer(problem, 'gamma').isCorrect).toBe(false)
  })
})

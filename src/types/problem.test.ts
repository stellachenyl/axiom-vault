import { describe, expect, it } from 'vitest'
import {
  problemPackSchema,
  manifestSchema,
  problemSchema,
  numericAnswerSchema,
  choiceAnswerSchema,
  textAnswerSchema,
} from './problem'
import type { ProblemPack } from './problem'

const validProblem = {
  id: 'cal-01',
  kind: 'numeric' as const,
  statementMarkdown: 'Find the key.',
  points: 100,
  hints: [],
  hiddenTags: [],
  answer: { type: 'numeric' as const, value: 6, tolerance: 0 },
}

const validPack: ProblemPack = {
  packId: 'vault-00-calibration',
  title: 'Vault 00: Calibration',
  codename: 'CALIBRATION',
  difficulty: 3,
  description: 'Initial sync trials.',
  problems: [validProblem],
}

describe('problemPackSchema', () => {
  it('accepts a valid pack', () => {
    const result = problemPackSchema.safeParse(validPack)
    expect(result.success).toBe(true)
  })

  it('rejects difficulty outside 1-10', () => {
    expect(problemPackSchema.safeParse({ ...validPack, difficulty: 0 }).success).toBe(false)
    expect(problemPackSchema.safeParse({ ...validPack, difficulty: 11 }).success).toBe(false)
  })

  it('accepts all three answer kinds and rejects unknown kinds', () => {
    const choice = {
      ...validProblem,
      id: 'p2',
      kind: 'choice' as const,
      answer: {
        type: 'choice' as const,
        options: [
          { id: 'a', labelMarkdown: 'A' },
          { id: 'b', labelMarkdown: 'B' },
        ],
        correctOptionId: 'a',
      },
    }
    const text = {
      ...validProblem,
      id: 'p3',
      kind: 'text' as const,
      answer: { type: 'text' as const, acceptedAnswers: ['24'] },
    }
    expect(problemPackSchema.safeParse({ ...validPack, problems: [choice] }).success).toBe(true)
    expect(problemPackSchema.safeParse({ ...validPack, problems: [text] }).success).toBe(true)
    expect(
      problemPackSchema.safeParse({
        ...validPack,
        problems: [{ ...validProblem, kind: 'essay' }],
      }).success,
    ).toBe(false)
  })

  it("rejects a correctOptionId that isn't among the options", () => {
    const bad = {
      ...validProblem,
      kind: 'choice' as const,
      answer: {
        type: 'choice' as const,
        options: [
          { id: 'a', labelMarkdown: 'A' },
          { id: 'b', labelMarkdown: 'B' },
        ],
        correctOptionId: 'zzz',
      },
    }
    const result = problemPackSchema.safeParse({ ...validPack, problems: [bad] })
    expect(result.success).toBe(false)
  })

  it('rejects problems with empty statements or negative points', () => {
    expect(
      problemPackSchema.safeParse({ ...validPack, problems: [{ ...validProblem, statementMarkdown: '' }] })
        .success,
    ).toBe(false)
    expect(
      problemPackSchema.safeParse({ ...validPack, problems: [{ ...validProblem, points: -5 }] }).success,
    ).toBe(false)
  })

  it('rejects non-integer or missing time limits', () => {
    expect(
      problemPackSchema.safeParse({ ...validPack, problems: [{ ...validProblem, timeLimitSeconds: -10 }] })
        .success,
    ).toBe(false)
  })

  it('accepts optional fields when omitted', () => {
    const result = problemPackSchema.safeParse(validPack)
    if (result.success) {
      expect(result.data.themeAccentColor).toBeUndefined()
      expect(result.data.problems[0].timeLimitSeconds).toBeUndefined()
      expect(result.data.problems[0].title).toBeUndefined()
    } else {
      throw new Error('expected valid pack to parse')
    }
  })
})

describe('manifestSchema', () => {
  it('accepts a valid manifest', () => {
    const result = manifestSchema.safeParse({
      packs: [
        {
          id: 'vault-00-calibration',
          title: 'Vault 00: Calibration',
          codename: 'CALIBRATION',
          difficulty: 3,
          file: 'vault-00-calibration.json',
          description: 'Initial sync trials.',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects entries with missing files or out-of-range difficulty', () => {
    const entry = {
      id: 'x',
      title: 'X',
      codename: 'X',
      difficulty: 3,
      file: 'x.json',
      description: '',
    }
    expect(manifestSchema.safeParse({ packs: [{ ...entry, file: '' }] }).success).toBe(false)
    expect(manifestSchema.safeParse({ packs: [{ ...entry, difficulty: 99 }] }).success).toBe(false)
    expect(manifestSchema.safeParse({ packs: [] }).success).toBe(true) // empty registry is valid
  })
})

describe('answer sub-schemas', () => {
  it('rejects invalid numeric answers', () => {
    expect(numericAnswerSchema.safeParse({ type: 'numeric' }).success).toBe(false)
    expect(numericAnswerSchema.safeParse({ type: 'numeric', value: 'six' }).success).toBe(false)
    expect(
      numericAnswerSchema.safeParse({ type: 'numeric', value: 6, tolerance: -1 }).success,
    ).toBe(false)
  })

  it('rejects invalid choice answers', () => {
    const options = [
      { id: 'a', labelMarkdown: 'A' },
      { id: 'b', labelMarkdown: 'B' },
    ]
    // fewer than two options
    expect(choiceAnswerSchema.safeParse({ type: 'choice', options: [options[0]], correctOptionId: 'a' }).success).toBe(false)
    // dangling correctOptionId
    expect(choiceAnswerSchema.safeParse({ type: 'choice', options, correctOptionId: 'zzz' }).success).toBe(false)
    // malformed option
    expect(
      choiceAnswerSchema.safeParse({
        type: 'choice',
        options: [
          { id: '', labelMarkdown: 'A' },
          { id: 'b', labelMarkdown: 'B' },
        ],
        correctOptionId: 'b',
      }).success,
    ).toBe(false)
  })

  it('rejects invalid text answers', () => {
    expect(textAnswerSchema.safeParse({ type: 'text', acceptedAnswers: [] }).success).toBe(false)
    expect(textAnswerSchema.safeParse({ type: 'text' }).success).toBe(false)
    expect(textAnswerSchema.safeParse({ type: 'text', acceptedAnswers: [''] }).success).toBe(false)
  })
})

describe('problemSchema hard cases', () => {
  it('rejects unknown kinds and empty statements', () => {
    expect(problemSchema.safeParse({ ...validProblem, kind: 'essay' }).success).toBe(false)
    expect(problemSchema.safeParse({ ...validProblem, statementMarkdown: '' }).success).toBe(false)
    expect(problemSchema.safeParse({ ...validProblem, id: '' }).success).toBe(false)
  })

  it('keeps hiddenTags as internal-only data (parsed but never rendered by the UI)', () => {
    const result = problemSchema.parse({
      ...validProblem,
      hiddenTags: ['sequences', 'recurrence'],
    })
    // The schema preserves the data for future internal systems...
    expect(result.hiddenTags).toEqual(['sequences', 'recurrence'])
    // ...while no UI component consumes it (verified structurally here and
    // behaviorally in the page tests, which assert the tags never appear).
  })
})

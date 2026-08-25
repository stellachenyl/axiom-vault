import { z } from 'zod'

export const numericAnswerSchema = z.object({
  type: z.literal('numeric'),
  value: z.number(),
  tolerance: z.number().min(0).optional(),
})

export const choiceOptionSchema = z.object({
  id: z.string().min(1),
  labelMarkdown: z.string(),
})

export const choiceAnswerSchema = z
  .object({
    type: z.literal('choice'),
    options: z.array(choiceOptionSchema).min(2),
    correctOptionId: z.string().min(1),
  })
  .refine(
    (answer) => answer.options.some((option) => option.id === answer.correctOptionId),
    {
      error: 'correctOptionId must match one of the option ids',
      path: ['correctOptionId'],
    },
  )

export const textAnswerSchema = z.object({
  type: z.literal('text'),
  acceptedAnswers: z.array(z.string().min(1)).min(1),
  caseSensitive: z.boolean().optional(),
  trimWhitespace: z.boolean().optional(),
})

export const answerSchema = z.discriminatedUnion('type', [
  numericAnswerSchema,
  choiceAnswerSchema,
  textAnswerSchema,
])

export const problemSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['numeric', 'choice', 'text']),
  title: z.string().optional(),
  statementMarkdown: z.string().min(1),
  points: z.number().int().min(0),
  timeLimitSeconds: z.number().int().positive().optional(),
  hints: z.array(z.string()),
  hiddenTags: z.array(z.string()),
  answer: answerSchema,
})

/**
 * A pack as stored on disk: metadata plus an ordered list of problem ids.
 * Each id refers to problems/<id>.json, which the loader resolves into a
 * full ProblemPack at runtime.
 */
export const problemPackFileSchema = z.object({
  packId: z.string().min(1),
  title: z.string().min(1),
  codename: z.string().min(1),
  difficulty: z.number().int().min(1).max(10),
  description: z.string(),
  themeAccentColor: z.string().optional(),
  problems: z.array(z.string().min(1)),
})

/** A fully resolved pack (refs replaced with validated Problem records). */
export const problemPackSchema = z.object({
  packId: z.string().min(1),
  title: z.string().min(1),
  codename: z.string().min(1),
  difficulty: z.number().int().min(1).max(10),
  description: z.string(),
  themeAccentColor: z.string().optional(),
  problems: z.array(problemSchema),
})

export const manifestEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  codename: z.string().min(1),
  difficulty: z.number().int().min(1).max(10),
  file: z.string().min(1),
  description: z.string(),
})

export const manifestSchema = z.object({
  packs: z.array(manifestEntrySchema),
})

export type NumericAnswer = z.infer<typeof numericAnswerSchema>
export type ChoiceOption = z.infer<typeof choiceOptionSchema>
export type ChoiceAnswer = z.infer<typeof choiceAnswerSchema>
export type TextAnswer = z.infer<typeof textAnswerSchema>
export type ProblemAnswer = z.infer<typeof answerSchema>
export type Problem = z.infer<typeof problemSchema>
export type ProblemPack = z.infer<typeof problemPackSchema>
export type ProblemPackFile = z.infer<typeof problemPackFileSchema>
export type ManifestEntry = z.infer<typeof manifestEntrySchema>
export type ContentManifest = z.infer<typeof manifestSchema>

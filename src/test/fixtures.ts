import type { LoadedPack } from '@/engine/contentLoader'
import type {
  ContentManifest,
  ManifestEntry,
  Problem,
  ProblemPack,
  ProblemPackFile,
} from '@/types/problem'

export const VALID_NUMERIC_PROBLEM: Problem = {
  id: 'fx-01-signal-check',
  kind: 'numeric',
  title: 'Signal Check',
  statementMarkdown: 'Find the pulse index $n$ where $f(n) > 1000$.',
  points: 120,
  timeLimitSeconds: 180,
  hints: ['Compute the first few pulses.', 'Check the boundary.'],
  hiddenTags: ['sequences'],
  answer: { type: 'numeric', value: 6, tolerance: 0 },
}

export const VALID_CHOICE_PROBLEM: Problem = {
  id: 'fx-02-broken-relay',
  kind: 'choice',
  title: 'Broken Relay',
  statementMarkdown: 'Which state does the relay rest in?',
  points: 150,
  hints: [],
  hiddenTags: [],
  answer: {
    type: 'choice',
    options: [
      { id: 'opt-a', labelMarkdown: '$S_0$' },
      { id: 'opt-b', labelMarkdown: '$S_1$' },
    ],
    correctOptionId: 'opt-a',
  },
}

export const VALID_TEXT_PROBLEM: Problem = {
  id: 'fx-03-core-alignment',
  kind: 'text',
  title: 'Core Alignment',
  statementMarkdown: 'Transmit the trailing-zero key of $100!$.',
  points: 200,
  hints: ['Count factors of five.'],
  hiddenTags: [],
  answer: { type: 'text', acceptedAnswers: ['24'], trimWhitespace: true },
}

export function makeValidPack(overrides: Partial<ProblemPack> = {}): ProblemPack {
  return {
    packId: 'vault-00-calibration',
    title: 'Vault 00: Calibration',
    codename: 'CALIBRATION',
    difficulty: 3,
    description: 'Initial sync trials.',
    problems: [VALID_NUMERIC_PROBLEM, VALID_CHOICE_PROBLEM, VALID_TEXT_PROBLEM],
    ...overrides,
  }
}

/** The on-disk pack format: metadata + ordered problem id refs. */
export function makeValidPackFile(overrides: Partial<ProblemPackFile> = {}): ProblemPackFile {
  return {
    packId: 'vault-00-calibration',
    title: 'Vault 00: Calibration',
    codename: 'CALIBRATION',
    difficulty: 3,
    description: 'Initial sync trials.',
    problems: [
      VALID_NUMERIC_PROBLEM.id,
      VALID_CHOICE_PROBLEM.id,
      VALID_TEXT_PROBLEM.id,
    ],
    ...overrides,
  }
}

/**
 * Fetch handler serving a manifest, one pack file and that pack's problem
 * files — mirrors the URL layout the content loader expects.
 */
export function makeFetchHandler(manifest: ContentManifest, packFile?: ProblemPackFile) {
  const problems = [VALID_NUMERIC_PROBLEM, VALID_CHOICE_PROBLEM, VALID_TEXT_PROBLEM]
  return (url: string): Response => {
    const ok = (body: unknown, status = 200): Response =>
      ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response
    if (url.endsWith('/manifest.json')) return ok(manifest)
    if (url.includes('/packs/')) return ok(packFile ?? makeValidPackFile())
    if (url.includes('/problems/')) {
      const id = url.split('/').pop()!.replace(/\.json$/, '')
      const problem = problems.find((p) => p.id === id)
      return problem ? ok(problem) : ok({}, 404)
    }
    return ok({}, 404)
  }
}

export function makeValidManifest(entries = 1): ContentManifest {
  return {
    packs: Array.from({ length: entries }, (_, i) => ({
      // The default single entry matches makeValidPack()'s packId so
      // loader tests can assert a warning-free happy path.
      id: `vault-${String(i).padStart(2, '0')}-calibration`,
      title: `Vault ${String(i).padStart(2, '0')}: Calibration`,
      codename: `SECTOR-${String(i).padStart(2, '0')}`,
      difficulty: 3,
      file: `vault-${String(i).padStart(2, '0')}-calibration.json`,
      description: 'Demo sector.',
    })),
  }
}

export function makeEntry(pack: ProblemPack): ManifestEntry {
  return {
    id: pack.packId,
    title: pack.title,
    codename: pack.codename,
    difficulty: pack.difficulty,
    file: `${pack.packId}.json`,
    description: pack.description,
  }
}

/** A LoadedPack whose manifest entry matches the given pack. */
export function makeLoadedPack(pack: ProblemPack): LoadedPack {
  return { entry: makeEntry(pack), pack }
}

/**
 * Validates all problem content under problem-packs/ against the Zod
 * schemas in src/types/problem.ts:
 *
 *   - manifest.json
 *   - packs/*.json          (pack metadata + ordered problem id refs)
 *   - problems/*.json       (one Problem per file)
 *
 * Also cross-checks refs: dangling references, orphaned problem files and
 * duplicate problem ids are all reported.
 *
 * Usage: npm run validate:problems
 * Exits with a non-zero code if anything fails validation.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  manifestSchema,
  problemPackFileSchema,
  problemSchema,
} from '../src/types/problem'
import type { Problem } from '../src/types/problem'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const packsDir = join(repoRoot, 'problem-packs', 'packs')
const problemsDir = join(repoRoot, 'problem-packs', 'problems')
const manifestPath = join(repoRoot, 'problem-packs', 'manifest.json')

let failed = false

/** Returns duplicated entries in a list of ids (empty when all unique). */
export function findDuplicateIds(ids: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id)
    seen.add(id)
  }
  return [...duplicates]
}

function fail(message: string): void {
  failed = true
  console.error(`  ✗ ${message}`)
}

function formatIssues(issues: { path: (string | number | symbol)[]; message: string }[]): string[] {
  return issues.map((issue) => `${issue.path.join('.') || '(root)'} — ${issue.message}`)
}

function loadJson(path: string): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(readFileSync(path, 'utf-8')) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

console.log('Validating problem content...\n')

// --- manifest ------------------------------------------------------------
if (!existsSync(manifestPath)) {
  fail(`manifest not found at ${manifestPath}`)
  process.exit(1)
}

const referencedProblemIds = new Set<string>()

const manifestLoaded = loadJson(manifestPath)
const manifestResult = manifestLoaded.ok
  ? manifestSchema.safeParse(manifestLoaded.data)
  : { success: false, error: { issues: [{ path: [], message: manifestLoaded.error }] } }
if (!manifestResult.success) {
  console.error('manifest.json:')
  for (const detail of formatIssues(manifestResult.error.issues)) fail(detail)
} else {
  console.log(`✓ manifest.json (${manifestResult.data.packs.length} entries)`)
  const duplicatePackIds = findDuplicateIds(manifestResult.data.packs.map((p) => p.id))
  if (duplicatePackIds.length > 0)
    fail(`manifest.json: contains duplicate pack id(s): ${duplicatePackIds.join(', ')}`)
}

// --- individual problems ---------------------------------------------------
const problemFilesById = new Map<string, string>()
const parsedProblems = new Map<string, Problem>()

if (!existsSync(problemsDir)) {
  fail(`problems directory not found at ${problemsDir}`)
} else {
  for (const file of readdirSync(problemsDir).filter((f) => f.endsWith('.json')).sort()) {
    const loaded = loadJson(join(problemsDir, file))
    if (!loaded.ok) {
      fail(`${file}: invalid JSON (${loaded.error})`)
      continue
    }
    const result = problemSchema.safeParse(loaded.data)
    if (!result.success) {
      console.error(`problems/${file}:`)
      for (const detail of formatIssues(result.error.issues)) fail(detail)
      continue
    }
    const problem = result.data
    if (problemFilesById.has(problem.id)) {
      fail(`problems/${file}: duplicate problem id "${problem.id}" (also in ${problemFilesById.get(problem.id)})`)
      continue
    }
    problemFilesById.set(problem.id, `problems/${file}`)
    parsedProblems.set(problem.id, problem)
  }
  console.log(
    `✓ ${problemFilesById.size} problem file(s) validated (${readdirSync(problemsDir).filter((f) => f.endsWith('.json')).length} on disk)`,
  )
}

// --- packs -----------------------------------------------------------------
if (!existsSync(packsDir)) {
  fail(`packs directory not found at ${packsDir}`)
} else {
  for (const file of readdirSync(packsDir).filter((f) => f.endsWith('.json')).sort()) {
    const loaded = loadJson(join(packsDir, file))
    if (!loaded.ok) {
      fail(`${file}: invalid JSON (${loaded.error})`)
      continue
    }

    const result = problemPackFileSchema.safeParse(loaded.data)
    if (!result.success) {
      console.error(`${file}:`)
      for (const detail of formatIssues(result.error.issues)) fail(`  ${detail}`)
      continue
    }

    const pack = result.data
    console.log(
      `✓ ${file} — "${pack.packId}" · difficulty ${pack.difficulty} · ${pack.problems.length} problem ref(s)`,
    )

    const duplicateRefs = findDuplicateIds(pack.problems)
    if (duplicateRefs.length > 0)
      fail(`${file}: contains duplicate problem ref(s): ${duplicateRefs.join(', ')}`)

    for (const ref of pack.problems) {
      referencedProblemIds.add(ref)
      if (!parsedProblems.has(ref)) {
        fail(`${file}: references missing or invalid problem "${ref}"`)
      }
    }
  }
}

// --- orphaned problems -------------------------------------------------------
for (const [id, origin] of problemFilesById) {
  if (!referencedProblemIds.has(id)) {
    fail(`${origin}: problem "${id}" is not referenced by any pack`)
  }
}

console.log('')
if (failed) {
  console.error('Validation FAILED.')
  process.exit(1)
}
console.log('All problem content is valid.')

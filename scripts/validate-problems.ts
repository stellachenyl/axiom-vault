/**
 * Validates all problem pack JSON files under problem-packs/ against the
 * Zod schemas in src/types/problem.ts.
 *
 * Usage: npm run validate:problems
 * Exits with a non-zero code if the manifest or any pack fails validation.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { manifestSchema, problemPackSchema } from '../src/types/problem'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const packsDir = join(repoRoot, 'problem-packs', 'packs')
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

console.log('Validating problem content...\n')

if (!existsSync(manifestPath)) {
  fail(`manifest not found at ${manifestPath}`)
  process.exit(1)
}

const manifestResult = manifestSchema.safeParse(
  JSON.parse(readFileSync(manifestPath, 'utf-8')),
)
if (!manifestResult.success) {
  console.error(`manifest.json:`)
  for (const detail of formatIssues(manifestResult.error.issues)) fail(detail)
} else {
  console.log(`✓ manifest.json (${manifestResult.data.packs.length} entries)`)
  const duplicatePackIds = findDuplicateIds(manifestResult.data.packs.map((p) => p.id))
  if (duplicatePackIds.length > 0)
    fail(`manifest.json: contains duplicate pack id(s): ${duplicatePackIds.join(', ')}`)
}

if (!existsSync(packsDir)) {
  fail(`packs directory not found at ${packsDir}`)
  process.exit(1)
}

const files = readdirSync(packsDir).filter((f) => f.endsWith('.json')).sort()

for (const file of files) {
  const path = join(packsDir, file)
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(path, 'utf-8'))
  } catch (error) {
    fail(`${file}: invalid JSON (${error instanceof Error ? error.message : String(error)})`)
    continue
  }

  const result = problemPackSchema.safeParse(raw)
  if (!result.success) {
    console.error(`${file}:`)
    for (const detail of formatIssues(result.error.issues)) fail(`  ${detail}`)
    continue
  }

  const pack = result.data
  const duplicateProblemIds = findDuplicateIds(pack.problems.map((p) => p.id))
  console.log(
    `✓ ${file} — "${pack.packId}" · difficulty ${pack.difficulty} · ${pack.problems.length} problems`,
  )
  if (duplicateProblemIds.length > 0)
    fail(`${file}: contains duplicate problem id(s): ${duplicateProblemIds.join(', ')}`)
}

console.log('')
if (failed) {
  console.error('Validation FAILED.')
  process.exit(1)
}
console.log('All problem content is valid.')

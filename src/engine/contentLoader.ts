import type { z } from 'zod'
import {
  manifestSchema,
  problemPackFileSchema,
  problemSchema,
} from '@/types/problem'
import type { ContentManifest, ManifestEntry, Problem, ProblemPack } from '@/types/problem'

export interface ContentSource {
  /** Base URL problem content is fetched from (no trailing slash). */
  baseUrl: string
  /** True when VITE_PROBLEM_BASE_URL is set, false for the local fallback. */
  remote: boolean
}

export interface LoadedPack {
  entry: ManifestEntry
  pack: ProblemPack
}

export interface ContentLoadResult {
  source: ContentSource
  packs: LoadedPack[]
  warnings: string[]
}

export function getContentSource(): ContentSource {
  const envBase = import.meta.env.VITE_PROBLEM_BASE_URL as string | undefined
  if (envBase && envBase.trim()) {
    return { baseUrl: envBase.trim().replace(/\/+$/, ''), remote: true }
  }
  return { baseUrl: '/problem-packs', remote: false }
}

let cachedLoad: Promise<ContentLoadResult> | null = null

export function loadProblemContent(
  options: { fresh?: boolean } = {},
): Promise<ContentLoadResult> {
  if (options.fresh) cachedLoad = null
  cachedLoad ??= loadContent().catch((error) => {
    cachedLoad = null
    throw error
  })
  return cachedLoad
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`)
  }
  return response.json()
}

function formatZodIssues(scope: string, issues: z.ZodError['issues']): string[] {
  return issues.map((issue) => `${scope}: ${issue.path.join('.')} — ${issue.message}`)
}

/**
 * Resolves a pack's ordered list of problem ids into validated Problem
 * records. A missing or invalid problem file is skipped with a warning so
 * one bad anomaly cannot take down the vault; order is preserved.
 */
async function resolvePackProblems(
  scope: string,
  ids: readonly string[],
  source: ContentSource,
): Promise<{ problems: Problem[]; warnings: string[] }> {
  const warnings: string[] = []
  const seen = new Set<string>()

  const results = await Promise.all(
    ids.map(async (id) => {
      if (seen.has(id)) {
        warnings.push(`${scope}: duplicate reference to problem "${id}" — skipped`)
        return null
      }
      seen.add(id)
      try {
        const raw = await fetchJson(`${source.baseUrl}/problems/${id}.json`)
        const parsed = problemSchema.safeParse(raw)
        if (!parsed.success) {
          warnings.push(...formatZodIssues(`${scope} -> problems/${id}.json`, parsed.error.issues))
          return null
        }
        return parsed.data
      } catch (error) {
        warnings.push(
          `${scope} -> problems/${id}.json: failed to load (${error instanceof Error ? error.message : String(error)})`,
        )
        return null
      }
    }),
  )

  return { problems: results.filter((p): p is Problem => p !== null), warnings }
}

async function loadContent(): Promise<ContentLoadResult> {
  const source = getContentSource()
  const warnings: string[] = []
  const packs: LoadedPack[] = []

  const rawManifest = await fetchJson(`${source.baseUrl}/manifest.json`)
  const parsedManifest = manifestSchema.safeParse(rawManifest)
  if (!parsedManifest.success) {
    const details = formatZodIssues('manifest.json', parsedManifest.error.issues)
    throw new Error(`Invalid content manifest:\n${details.join('\n')}`)
  }

  const manifest: ContentManifest = parsedManifest.data

  await Promise.all(
    manifest.packs.map(async (entry) => {
      const url = `${source.baseUrl}/packs/${entry.file}`
      try {
        const rawPack = await fetchJson(url)
        const parsedPack = problemPackFileSchema.safeParse(rawPack)
        if (!parsedPack.success) {
          warnings.push(...formatZodIssues(entry.file, parsedPack.error.issues))
          return
        }
        const filePack = parsedPack.data
        if (filePack.packId !== entry.id) {
          warnings.push(
            `${entry.file}: packId "${filePack.packId}" does not match manifest id "${entry.id}"`,
          )
        }

        const { problems, warnings: problemWarnings } = await resolvePackProblems(
          entry.file,
          filePack.problems,
          source,
        )
        warnings.push(...problemWarnings)

        packs.push({
          entry,
          pack: {
            ...filePack,
            problems,
          },
        })
      } catch (error) {
        warnings.push(`${entry.file}: failed to load (${error instanceof Error ? error.message : String(error)})`)
      }
    }),
  )

  return { source, packs, warnings }
}

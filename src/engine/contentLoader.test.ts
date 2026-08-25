import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  makeFetchHandler,
  makeValidManifest,
  makeValidPackFile,
  VALID_NUMERIC_PROBLEM,
} from '@/test/fixtures'

/**
 * The loader caches per module instance, so each test gets a fresh module
 * via resetModules + dynamic import.
 */
async function importLoader() {
  vi.resetModules()
  return await import('./contentLoader')
}

function mockFetch(handler: (url: string) => Response | Promise<Response>) {
  const fetchMock = vi.fn(async (url: string) => handler(url))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

const BASE = 'https://raw.example.test/content'

beforeEach(() => {
  vi.unstubAllEnvs()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('contentLoader', () => {
  it('loads from VITE_PROBLEM_BASE_URL when set and resolves problem refs', async () => {
    vi.stubEnv('VITE_PROBLEM_BASE_URL', BASE)
    const packFile = makeValidPackFile()
    const manifest = makeValidManifest(1)
    const fetchMock = mockFetch(makeFetchHandler(manifest, packFile))

    const { loadProblemContent } = await importLoader()
    const result = await loadProblemContent({ fresh: true })

    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/manifest.json`)
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/packs/${manifest.packs[0].file}`)
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/problems/${VALID_NUMERIC_PROBLEM.id}.json`)
    expect(result.source.remote).toBe(true)
    expect(result.source.baseUrl).toBe(BASE)
    expect(result.packs).toHaveLength(1)
    // Refs are resolved into full problem records, in manifest order.
    expect(result.packs[0].pack.problems.map((p) => p.id)).toEqual(packFile.problems)
    expect(result.warnings).toEqual([])
  })

  it('falls back to local /problem-packs when the env variable is absent', async () => {
    const manifest = makeValidManifest(1)
    mockFetch(makeFetchHandler(manifest, makeValidPackFile()))

    const { loadProblemContent } = await importLoader()
    const result = await loadProblemContent({ fresh: true })

    expect(result.source.remote).toBe(false)
    expect(result.source.baseUrl).toBe('/problem-packs')
    expect(result.packs).toHaveLength(1)
    expect(result.packs[0].pack.problems).toHaveLength(3)
  })

  it('trailing slashes in the base URL are stripped', async () => {
    vi.stubEnv('VITE_PROBLEM_BASE_URL', `${BASE}///`)
    mockFetch((url) =>
      url.endsWith('manifest.json') ? jsonResponse(makeValidManifest(0)) : jsonResponse({}, 404),
    )
    const { loadProblemContent } = await importLoader()
    const result = await loadProblemContent({ fresh: true })
    expect(result.source.baseUrl).toBe(BASE)
  })

  it('surfaces a safe error when the manifest fetch returns non-200', async () => {
    mockFetch(() => jsonResponse({}, 404))
    const { loadProblemContent } = await importLoader()
    await expect(loadProblemContent({ fresh: true })).rejects.toThrow(/404.*manifest\.json/)
  })

  it('surfaces a safe error when the network rejects', async () => {
    mockFetch(() => {
      throw new TypeError('network down')
    })
    const { loadProblemContent } = await importLoader()
    await expect(loadProblemContent({ fresh: true })).rejects.toThrow('network down')
  })

  it('rejects cleanly when the manifest fails schema validation', async () => {
    mockFetch(() => jsonResponse({ packs: 'not-an-array' }))
    const { loadProblemContent } = await importLoader()
    await expect(loadProblemContent({ fresh: true })).rejects.toThrow(/Invalid content manifest/)
  })

  it('handles an empty manifest without warnings or packs', async () => {
    mockFetch(() => jsonResponse(makeValidManifest(0)))
    const { loadProblemContent } = await importLoader()
    const result = await loadProblemContent({ fresh: true })
    expect(result.packs).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('warns and continues when a pack file is missing (unknown file)', async () => {
    const manifest = makeValidManifest(1)
    mockFetch((url) =>
      url.endsWith('manifest.json') ? jsonResponse(manifest) : jsonResponse({}, 404),
    )
    const { loadProblemContent } = await importLoader()
    const result = await loadProblemContent({ fresh: true })
    expect(result.packs).toEqual([])
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toMatch(/failed to load/)
  })

  it('warns and skips a pack that fails Zod validation', async () => {
    const manifest = makeValidManifest(1)
    const badPack = makeValidPackFile()
    badPack.difficulty = 42
    mockFetch((url) =>
      url.endsWith('manifest.json') ? jsonResponse(manifest) : jsonResponse(badPack),
    )
    const { loadProblemContent } = await importLoader()
    const result = await loadProblemContent({ fresh: true })
    expect(result.packs).toHaveLength(0)
    expect(result.warnings.join('\n')).toContain('difficulty')
  })

  it('warns and skips an individual problem file that is missing or invalid', async () => {
    const manifest = makeValidManifest(1)
    const brokenProblem = { ...VALID_NUMERIC_PROBLEM, points: -5 }
    mockFetch((url) => {
      if (url.endsWith('manifest.json')) return jsonResponse(manifest)
      if (url.includes('/packs/')) return jsonResponse(makeValidPackFile())
      if (url.includes(`/${VALID_NUMERIC_PROBLEM.id}.json`)) return jsonResponse(brokenProblem)
      if (url.includes('/fx-02-broken-relay.json')) return jsonResponse({}, 404)
      // fx-03's slot returns a valid record with its own id.
      return jsonResponse({ ...VALID_NUMERIC_PROBLEM, id: 'fx-03-core-alignment' })
    })
    const { loadProblemContent } = await importLoader()
    const result = await loadProblemContent({ fresh: true })

    // The vault still loads with its surviving anomalies.
    expect(result.packs).toHaveLength(1)
    expect(result.packs[0].pack.problems.map((p) => p.id)).toEqual(['fx-03-core-alignment'])
    expect(result.warnings).toHaveLength(2)
    expect(result.warnings.join('\n')).toContain('points')
    expect(result.warnings.join('\n')).toContain('fx-02-broken-relay')
  })

  it('warns on duplicate refs inside a pack but keeps one copy in order', async () => {
    const manifest = makeValidManifest(1)
    const packFile = makeValidPackFile({
      problems: [VALID_NUMERIC_PROBLEM.id, VALID_NUMERIC_PROBLEM.id],
    })
    mockFetch(makeFetchHandler(manifest, packFile))
    const { loadProblemContent } = await importLoader()
    const result = await loadProblemContent({ fresh: true })
    expect(result.packs[0].pack.problems.map((p) => p.id)).toEqual([VALID_NUMERIC_PROBLEM.id])
    expect(result.warnings.join('\n')).toMatch(/duplicate reference/)
  })

  it('preserves ref order even when problems resolve out of network order', async () => {
    const manifest = makeValidManifest(1)
    const packFile = makeValidPackFile({
      problems: ['fx-03-core-alignment', 'fx-01-signal-check'],
    })
    // Stagger response times so later refs would finish first without
    // Promise.all's order preservation.
    const handler = makeFetchHandler(manifest, packFile)
    mockFetch(async (url) => {
      const response = handler(url)
      if (url.includes('fx-03')) await new Promise((r) => setTimeout(r, 20))
      return response
    })
    const { loadProblemContent } = await importLoader()
    const result = await loadProblemContent({ fresh: true })
    expect(result.packs[0].pack.problems.map((p) => p.id)).toEqual([
      'fx-03-core-alignment',
      'fx-01-signal-check',
    ])
  })

  it('warns when packId does not match the manifest entry id', async () => {
    const manifest = makeValidManifest(1)
    const mismatchedPack = makeValidPackFile({ packId: 'some-other-vault' })
    mockFetch(makeFetchHandler(manifest, mismatchedPack))
    const { loadProblemContent } = await importLoader()
    const result = await loadProblemContent({ fresh: true })
    expect(result.packs).toHaveLength(1) // still usable
    expect(result.warnings.join('\n')).toContain('does not match manifest id')
  })

  it('caches results until a fresh load is requested', async () => {
    const manifest = makeValidManifest(1)
    let calls = 0
    mockFetch((url) => {
      if (!url.endsWith('manifest.json')) return jsonResponse({})
      calls += 1
      return jsonResponse(manifest)
    })
    const { loadProblemContent } = await importLoader()

    await loadProblemContent({ fresh: true })
    await loadProblemContent() // served from cache
    expect(calls).toBe(1)

    await loadProblemContent({ fresh: true }) // bypasses cache
    expect(calls).toBe(2)
  })
})

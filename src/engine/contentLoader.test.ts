import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeValidManifest, makeValidPack } from '@/test/fixtures'

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
  it('loads from VITE_PROBLEM_BASE_URL when set and fetch succeeds', async () => {
    vi.stubEnv('VITE_PROBLEM_BASE_URL', BASE)
    const pack = makeValidPack()
    const manifest = makeValidManifest(1)
    const fetchMock = mockFetch((url) => {
      if (url === `${BASE}/manifest.json`) return jsonResponse(manifest)
      if (url === `${BASE}/packs/${manifest.packs[0].file}`) return jsonResponse(pack)
      throw new Error(`unexpected url ${url}`)
    })

    const { loadProblemContent } = await importLoader()
    const result = await loadProblemContent({ fresh: true })

    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/manifest.json`)
    expect(result.source.remote).toBe(true)
    expect(result.source.baseUrl).toBe(BASE)
    expect(result.packs).toHaveLength(1)
    expect(result.packs[0].pack.packId).toBe(pack.packId)
    expect(result.warnings).toEqual([])
  })

  it('falls back to local /problem-packs when the env variable is absent', async () => {
    const pack = makeValidPack()
    const manifest = makeValidManifest(1)
    const fetchMock = mockFetch((url) => {
      if (url === '/problem-packs/manifest.json') return jsonResponse(manifest)
      if (url === `/problem-packs/packs/${manifest.packs[0].file}`) return jsonResponse(pack)
      throw new Error(`unexpected url ${url}`)
    })

    const { loadProblemContent } = await importLoader()
    const result = await loadProblemContent({ fresh: true })

    expect(fetchMock).toHaveBeenCalledWith('/problem-packs/manifest.json')
    expect(result.source.remote).toBe(false)
    expect(result.source.baseUrl).toBe('/problem-packs')
    expect(result.packs).toHaveLength(1)
  })

  it('trailing slashes in the base URL are stripped', async () => {
    vi.stubEnv('VITE_PROBLEM_BASE_URL', `${BASE}///`)
    mockFetch(() => jsonResponse(makeValidManifest(0)))
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
    const badPack = makeValidPack()
    badPack.difficulty = 42
    mockFetch((url) =>
      url.endsWith('manifest.json')
        ? jsonResponse(manifest)
        : jsonResponse(badPack),
    )
    const { loadProblemContent } = await importLoader()
    const result = await loadProblemContent({ fresh: true })
    expect(result.packs).toHaveLength(0)
    expect(result.warnings.join('\n')).toContain('difficulty')
  })

  it('warns when packId does not match the manifest entry id', async () => {
    const manifest = makeValidManifest(1)
    const mismatchedPack = makeValidPack({ packId: 'some-other-vault' })
    mockFetch((url) =>
      url.endsWith('manifest.json') ? jsonResponse(manifest) : jsonResponse(mismatchedPack),
    )
    const { loadProblemContent } = await importLoader()
    const result = await loadProblemContent({ fresh: true })
    expect(result.packs).toHaveLength(1) // still usable
    expect(result.warnings.join('\n')).toContain('does not match manifest id')
  })

  it('caches results until a fresh load is requested', async () => {
    const manifest = makeValidManifest(1)
    let calls = 0
    mockFetch((url) => {
      if (!url.endsWith('manifest.json')) return jsonResponse(makeValidPack())
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

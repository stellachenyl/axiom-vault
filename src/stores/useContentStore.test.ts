import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useContentStore } from './useContentStore'
import { makeLoadedPack, makeValidManifest, makeValidPack } from '@/test/fixtures'

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

function mockFetch(handler: (url: string) => Response) {
  const fetchMock = vi.fn(async (url: string) => handler(url))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  useContentStore.setState({ status: 'idle', source: null, packs: [], warnings: [], error: null })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useContentStore.load', () => {
  it('transitions to ready and stores packs on a successful load', async () => {
    const pack = makeValidPack()
    const manifest = makeValidManifest(1)
    mockFetch((url) =>
      url.endsWith('manifest.json') ? jsonResponse(manifest) : jsonResponse(pack),
    )

    await useContentStore.getState().load({ fresh: true })

    const s = useContentStore.getState()
    expect(s.status).toBe('ready')
    expect(s.source?.remote).toBe(false)
    expect(s.packs).toHaveLength(1)
    expect(s.packs[0].pack.packId).toBe(pack.packId)
    expect(s.error).toBeNull()
  })

  it('transitions to a safe error state when the manifest cannot be fetched', async () => {
    mockFetch(() => jsonResponse({}, 500))

    await useContentStore.getState().load({ fresh: true })

    const s = useContentStore.getState()
    expect(s.status).toBe('error')
    expect(s.error).toMatch(/500/)
    expect(s.packs).toEqual([])
  })

  it('collects validation warnings without failing the whole load', async () => {
    const badPack = makeValidPack()
    badPack.difficulty = 99
    mockFetch((url) =>
      url.endsWith('manifest.json')
        ? jsonResponse(makeValidManifest(1))
        : jsonResponse(badPack),
    )

    await useContentStore.getState().load({ fresh: true })

    const s = useContentStore.getState()
    expect(s.status).toBe('ready')
    expect(s.packs).toHaveLength(0)
    expect(s.warnings.join(' ')).toContain('difficulty')
  })

  it('ignores duplicate load calls while a load is already running', async () => {
    const fetchMock = mockFetch((url) =>
      url.endsWith('manifest.json')
        ? jsonResponse(makeValidManifest(1))
        : jsonResponse(makeValidPack()),
    )

    const first = useContentStore.getState().load({ fresh: true })
    // Second call arrives while the first is still in flight.
    await Promise.all([first, useContentStore.getState().load()])
    await vi.waitFor(() => {
      expect(useContentStore.getState().status).toBe('ready')
    })

    // The loader serves the second call from cache — only one manifest hit.
    const manifestCalls = fetchMock.mock.calls.filter(([u]) =>
      String(u).endsWith('manifest.json'),
    )
    expect(manifestCalls.length).toBeLessThanOrEqual(1)
    expect(useContentStore.getState().packs).toHaveLength(1)
  })

  it('exposes findLoadedPack by id', async () => {
    const loaded = makeLoadedPack(makeValidPack())
    const { findLoadedPack } = await import('./useContentStore')
    expect(findLoadedPack([loaded], 'vault-00-calibration')).toBe(loaded)
    expect(findLoadedPack([loaded], 'unknown')).toBeUndefined()
    expect(findLoadedPack([loaded], undefined)).toBeUndefined()
  })
})

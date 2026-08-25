import { useEffect } from 'react'
import { create } from 'zustand'
import { loadProblemContent } from '@/engine/contentLoader'
import type { ContentLoadResult, LoadedPack } from '@/engine/contentLoader'

export type ContentStatus = 'idle' | 'loading' | 'ready' | 'error'

interface ContentState {
  status: ContentStatus
  source: ContentLoadResult['source'] | null
  packs: LoadedPack[]
  warnings: string[]
  error: string | null
  load: (options?: { fresh?: boolean }) => Promise<void>
}

export const useContentStore = create<ContentState>()((set) => ({
  status: 'idle',
  source: null,
  packs: [],
  warnings: [],
  error: null,

  load: async ({ fresh = false }: { fresh?: boolean } = {}) => {
    const current = useContentStore.getState()
    if (current.status === 'loading') return
    set({ status: 'loading', error: null })
    try {
      const result = await loadProblemContent({ fresh })
      set({
        status: 'ready',
        source: result.source,
        packs: result.packs,
        warnings: result.warnings,
        error: null,
      })
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
}))

export function findLoadedPack(packs: LoadedPack[], packId: string | undefined): LoadedPack | undefined {
  return packId ? packs.find((p) => p.entry.id === packId) : undefined
}

/** Kicks off the content load once on mount and returns the full store. */
export function useContentLoaded() {
  const status = useContentStore((s) => s.status)
  const load = useContentStore((s) => s.load)

  useEffect(() => {
    if (status === 'idle') void load()
  }, [status, load])

  return useContentStore()
}

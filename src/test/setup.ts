import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { useGameStore } from '@/stores/useGameStore'

// React 19 expects this flag so act() warnings are wired correctly.
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  // Reset the singleton game store so tests never leak progress into
  // each other.
  useGameStore.getState().resetRun()
})

// jsdom lacks matchMedia; components and libraries occasionally probe it.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

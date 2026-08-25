import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ResultsPage } from './ResultsPage'
import { DevPage } from './DevPage'
import { useContentStore } from '@/stores/useContentStore'
import { useGameStore, type AttemptRecord } from '@/stores/useGameStore'
import { makeLoadedPack, makeValidPack } from '@/test/fixtures'

const PACK_ID = 'vault-00-calibration'

function seedContent() {
  useContentStore.setState({
    status: 'ready',
    source: { baseUrl: '/problem-packs', remote: false },
    packs: [makeLoadedPack(makeValidPack())],
    warnings: [],
    error: null,
  })
}

// The module-level content store leaks across tests; restore pristine idle state.
beforeEach(() => {
  useContentStore.setState({ status: 'idle', source: null, packs: [], warnings: [], error: null })
})

afterEach(() => {
  vi.restoreAllMocks()
})

function attempt(overrides: Partial<AttemptRecord>): AttemptRecord {
  return {
    problemId: 'fx-01-signal-check',
    packId: PACK_ID,
    correct: false,
    pointsAwarded: 0,
    hintsUsed: 0,
    ...overrides,
  }
}

function renderResults(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/results/:packId" element={<ResultsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResultsPage', () => {
  it('handles a missing pack safely', () => {
    seedContent()
    renderResults('/results/unknown-vault')
    expect(screen.getByText('RUN NOT FOUND')).toBeInTheDocument()
  })

  it('renders the debrief stats after a completed run', () => {
    seedContent()
    useGameStore.setState({
      bestStreak: 4,
      hintsUsed: 3,
      attemptLog: [
        attempt({ problemId: 'fx-01-signal-check', correct: true, pointsAwarded: 180 }),
        attempt({ problemId: 'fx-02-broken-relay', correct: true, pointsAwarded: 150 }),
        attempt({
          problemId: 'fx-03-core-alignment',
          correct: false,
          pointsAwarded: 0,
          hintsUsed: 2,
        }),
      ],
    })
    renderResults(`/results/${PACK_ID}`)

    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(screen.getByText('67% contained')).toBeInTheDocument()
    expect(screen.getByText(/sync stable/i)).toBeInTheDocument()
    // Two correct rows in the telemetry table (plus rank label differs).
    expect(screen.getAllByText('CONTAINED')).toHaveLength(2)
    expect(screen.getAllByText('REJECTED').length).toBeGreaterThan(0)
    expect(screen.getByText(/hint channels pulled/i)).toBeInTheDocument()
  })

  it('grants clearance rank for a perfect run', () => {
    seedContent()
    useGameStore.setState({
      attemptLog: [
        attempt({ problemId: 'fx-01-signal-check', correct: true, pointsAwarded: 180 }),
        attempt({ problemId: 'fx-02-broken-relay', correct: true, pointsAwarded: 165 }),
        attempt({ problemId: 'fx-03-core-alignment', correct: true, pointsAwarded: 220 }),
      ],
    })
    renderResults(`/results/${PACK_ID}`)
    expect(screen.getByText(/clearance granted/i)).toBeInTheDocument()
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
  })

  it('shows an empty telemetry note when no transmissions exist', () => {
    seedContent()
    renderResults(`/results/${PACK_ID}`)
    expect(screen.getByText(/no transmissions recorded/i)).toBeInTheDocument()
    expect(screen.getByText(/signal lost/i)).toBeInTheDocument()
  })
})

describe('DevPage', () => {
  function renderDev() {
    return render(
      <MemoryRouter initialEntries={['/dev']}>
        <DevPage />
      </MemoryRouter>,
    )
  }

  it('shows the content source mode, base URL and loaded counts', async () => {
    const loadSpy = vi.spyOn(useContentStore.getState(), 'load').mockImplementation(async () => {
      useContentStore.setState({
        status: 'ready',
        source: { baseUrl: '/problem-packs', remote: false },
        packs: [makeLoadedPack(makeValidPack())],
        warnings: [],
        error: null,
      })
    })
    renderDev()

    await vi.waitFor(() => expect(loadSpy).toHaveBeenCalledOnce())
    expect(await screen.findByText('LOCAL FALLBACK')).toBeInTheDocument()
    expect(screen.getByText('/problem-packs')).toBeInTheDocument()
    expect(screen.getByText(/✓ LOADED/)).toBeInTheDocument()
    expect(screen.getByText(/1 packs · 3 problems/i)).toBeInTheDocument()
    loadSpy.mockRestore()
  })

  it('shows a remote source mode when VITE_PROBLEM_BASE_URL drives loading', async () => {
    vi.spyOn(useContentStore.getState(), 'load').mockImplementation(async () => {
      useContentStore.setState({
        status: 'ready',
        source: {
          baseUrl: 'https://raw.example.test/content',
          remote: true,
        },
        packs: [makeLoadedPack(makeValidPack())],
        warnings: ['vault-bad.json: difficulty — too big'],
        error: null,
      })
    })
    renderDev()

    expect(await screen.findByText('REMOTE (VITE_PROBLEM_BASE_URL)')).toBeInTheDocument()
    expect(screen.getByText(/vault-bad\.json: difficulty — too big/)).toBeInTheDocument()
  })

  it('force reload bypasses the loader cache', async () => {
    const loadSpy = vi.spyOn(useContentStore.getState(), 'load').mockImplementation(async () => {
      // Mimic the real action: flips the store out of 'loading'.
      useContentStore.setState({ status: 'ready' })
    })
    renderDev()
    await vi.waitFor(() => expect(loadSpy.mock.calls.length).toBeGreaterThan(0))
    const callsBeforeClick = loadSpy.mock.calls.length
    await userEvent.click(await screen.findByRole('button', { name: /force reload/i }))
    expect(loadSpy.mock.calls.length).toBeGreaterThan(callsBeforeClick)
    // The click must pass the fresh flag so the engine bypasses its cache.
    expect(loadSpy).toHaveBeenLastCalledWith({ fresh: true })
  })

  it('purges local progress via the danger zone', async () => {
    vi.spyOn(useContentStore.getState(), 'load').mockImplementation(async () => {
      useContentStore.setState({
        status: 'ready',
        source: { baseUrl: '/problem-packs', remote: false },
        packs: [],
        warnings: [],
        error: null,
      })
    })
    useGameStore.setState({ totalPoints: 500, currentStreak: 2, hintsUsed: 4 })
    renderDev()

    await userEvent.click(await screen.findByRole('button', { name: /purge progress/i }))
    const s = useGameStore.getState()
    expect(s.totalPoints).toBe(0)
    expect(s.currentStreak).toBe(0)
    expect(s.hintsUsed).toBe(0)
    expect(s.attemptLog).toEqual([])
  })
})

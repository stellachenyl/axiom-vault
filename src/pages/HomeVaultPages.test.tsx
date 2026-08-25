import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './HomePage'
import { VaultPage } from './VaultPage'
import { useContentStore } from '@/stores/useContentStore'
import { useGameStore } from '@/stores/useGameStore'
import { makeLoadedPack, makeValidPack } from '@/test/fixtures'

function seedContent(
  status: 'loading' | 'ready' | 'error',
  opts: { packs?: ReturnType<typeof makeLoadedPack>[]; error?: string; warnings?: string[] } = {},
) {
  useContentStore.setState({
    status,
    source: status === 'ready' ? { baseUrl: '/problem-packs', remote: false } : null,
    packs: opts.packs ?? [],
    warnings: opts.warnings ?? [],
    error: opts.error ?? null,
  })
}

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('shows the loading state while content syncs', () => {
    seedContent('loading')
    renderHome()
    expect(screen.getByText(/syncing vault registry/i)).toBeInTheDocument()
  })

  it('shows the error state when the manifest fails and offers retry', async () => {
    seedContent('error', { error: 'HTTP 500 while fetching /problem-packs/manifest.json' })
    const loadSpy = vi.spyOn(useContentStore.getState(), 'load').mockResolvedValue(undefined)
    renderHome()
    expect(screen.getByText('CONTENT LINK DOWN')).toBeInTheDocument()
    expect(screen.getByText(/http 500/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /retry uplink/i }))
    expect(loadSpy).toHaveBeenCalledOnce()
    loadSpy.mockRestore()
  })

  it('renders vault cards from the manifest when packs load', () => {
    seedContent('ready', { packs: [makeLoadedPack(makeValidPack())] })
    useGameStore.setState({ totalPoints: 1250, currentStreak: 3, bestStreak: 5 })
    renderHome()
    expect(screen.getByText('AXIOM VAULT')).toBeInTheDocument()
    expect(screen.getByText('CALIBRATION')).toBeInTheDocument()
    // Player stats panel
    expect(screen.getByText(/1,250 ap/i)).toBeInTheDocument()
    // 1,250 AP lands in the ANALYST clearance band.
    expect(screen.getByText(/cleared · analyst/i)).toBeInTheDocument()
  })

  it('shows the empty state when the manifest contains no packs', () => {
    seedContent('ready')
    renderHome()
    expect(screen.getByText(/no vaults registered/i)).toBeInTheDocument()
  })
})

describe('VaultPage', () => {
  function renderVault(packId: string) {
    return render(
      <MemoryRouter initialEntries={[`/vault/${packId}`]}>
        <Routes>
          <Route path="/vault/:packId" element={<VaultPage />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('renders the selected pack with its anomalies', () => {
    seedContent('ready', { packs: [makeLoadedPack(makeValidPack())] })
    renderVault('vault-00-calibration')
    // Codename appears in both breadcrumb and heading.
    expect(screen.getAllByText('CALIBRATION').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Signal Check').length).toBeGreaterThan(0)
    expect(screen.getByText(/anomalies \(3\)/i)).toBeInTheDocument()
    expect(screen.getByText(/view run results/i)).toBeInTheDocument()
  })

  it('shows an error for an unknown packId', () => {
    seedContent('ready', { packs: [makeLoadedPack(makeValidPack())] })
    renderVault('vault-99-unknown')
    expect(screen.getByText('VAULT NOT FOUND')).toBeInTheDocument()
    expect(screen.getByText(/vault-99-unknown/)).toBeInTheDocument()
  })

  it('marks cleared nodes on load', () => {
    useGameStore.setState({ completedProblems: ['fx-01-signal-check'] })
    seedContent('ready', { packs: [makeLoadedPack(makeValidPack())] })
    renderVault('vault-00-calibration')
    expect(screen.getByText('CLEARED')).toBeInTheDocument()
  })
})

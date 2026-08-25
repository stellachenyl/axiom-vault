import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { VaultCard } from './VaultCard'
import { ProblemCard } from './ProblemCard'
import { makeValidPack, VALID_NUMERIC_PROBLEM } from '@/test/fixtures'

function renderWithRouter(ui: React.ReactElement, initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/vault/:packId/*" element={<div data-testid="runner-route">RUNNER</div>} />
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('VaultCard', () => {
  it('shows codename, difficulty, sync and AP total', () => {
    const pack = makeValidPack()
    renderWithRouter(<VaultCard pack={pack} completedCount={1} />)
    expect(screen.getByText('CALIBRATION')).toBeInTheDocument()
    expect(screen.getByText(/CLR-3/)).toBeInTheDocument()
    expect(screen.getByText(/470 ap/i)).toBeInTheDocument() // 120+150+200
    expect(screen.getByText('33%')).toBeInTheDocument()
  })

  it('navigates to the vault route via the card link', async () => {
    const pack = makeValidPack()
    renderWithRouter(<VaultCard pack={pack} completedCount={0} />)
    await userEvent.click(screen.getByLabelText(/enter calibration/i))
    expect(screen.getByTestId('runner-route')).toBeInTheDocument()
  })

  it('is operable by keyboard (Enter activates navigation)', async () => {
    const pack = makeValidPack()
    renderWithRouter(<VaultCard pack={pack} completedCount={0} />)
    const card = screen.getByText('CALIBRATION').closest('[role="link"]')
    expect(card).not.toBeNull()
    ;(card as HTMLElement).focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByTestId('runner-route')).toBeInTheDocument()
  })
})

describe('ProblemCard', () => {
  it('shows the problem title and points, never hiddenTags', () => {
    renderWithRouter(
      <ProblemCard problem={VALID_NUMERIC_PROBLEM} index={0} packId="vault-00-calibration" />,
    )
    expect(screen.getByText('Signal Check')).toBeInTheDocument()
    expect(screen.queryByText(/^sequences$/i)).not.toBeInTheDocument()
    expect(screen.getByText(/120 ap/i)).toBeInTheDocument()
  })

  it('falls back to a NODE-xxx codename when untitled', () => {
    const untitled = { ...VALID_NUMERIC_PROBLEM, title: undefined }
    renderWithRouter(<ProblemCard problem={untitled} index={2} packId="p" />)
    expect(screen.getByText('NODE-003')).toBeInTheDocument()
  })

  it('navigates to the runner route on click', async () => {
    renderWithRouter(
      <ProblemCard
        problem={VALID_NUMERIC_PROBLEM}
        index={0}
        packId="vault-00-calibration"
      />,
    )
    await userEvent.click(screen.getByText('Signal Check'))
    expect(screen.getByTestId('runner-route')).toBeInTheDocument()
  })

  it('reflects cleared status', () => {
    renderWithRouter(
      <>
        <ProblemCard problem={VALID_NUMERIC_PROBLEM} index={0} packId="p" status="cleared" />
        <ProblemCard problem={VALID_NUMERIC_PROBLEM} index={1} packId="p2" status="pending" />
      </>,
    )
    expect(screen.getByText('CLEARED')).toBeInTheDocument()
    expect(screen.getByText('AWAITING ENTRY')).toBeInTheDocument()
  })
})

import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProblemPage } from './ProblemPage'
import { useContentStore } from '@/stores/useContentStore'
import { useGameStore } from '@/stores/useGameStore'
import { makeLoadedPack, makeValidPack } from '@/test/fixtures'
import type { ProblemPack } from '@/types/problem'

function seed(packOverrides: Partial<ProblemPack> = {}) {
  const pack = makeValidPack(packOverrides)
  useContentStore.setState({
    status: 'ready',
    source: { baseUrl: '/problem-packs', remote: false },
    packs: [makeLoadedPack(pack)],
    warnings: [],
    error: null,
  })
  return pack
}

function renderProblem(packId: string, problemId: string) {
  return render(
    <MemoryRouter initialEntries={[`/vault/${packId}/problem/${problemId}`]}>
      <Routes>
        <Route
          path="/results/:packId"
          element={<div data-testid="results-route">DEBRIEF</div>}
        />
        <Route
          path="/vault/:packId/problem/:problemId"
          element={<ProblemPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('ProblemPage — routing errors', () => {
  it('shows an error for an unknown packId', () => {
    seed()
    renderProblem('nope', 'fx-01-signal-check')
    expect(screen.getByText('NODE NOT FOUND')).toBeInTheDocument()
  })

  it('shows an error for an unknown problemId', () => {
    seed()
    renderProblem('vault-00-calibration', 'fx-99-ghost')
    expect(screen.getByText('NODE NOT FOUND')).toBeInTheDocument()
  })
})

describe('ProblemPage — input rendering per kind', () => {
  it('renders a numeric field for numeric problems', () => {
    seed()
    renderProblem('vault-00-calibration', 'fx-01-signal-check')
    expect(screen.getByPlaceholderText(/enter numeric key/i)).toBeInTheDocument()
  })

  it('renders radio options for choice problems (keyboard selectable)', async () => {
    seed({ problems: [{ ...makeValidPack().problems[1] }] })
    renderProblem('vault-00-calibration', 'fx-02-broken-relay')
    const options = screen.getAllByRole('radio')
    expect(options).toHaveLength(2)
    // LaTeX in option labels renders via KaTeX without crashing.
    expect(document.querySelector('.katex')).not.toBeNull()
    await userEvent.click(options[0])
    expect(options[0]).toBeChecked()
    // Keyboard operability: arrow keys move the radio selection.
    await userEvent.keyboard('{ArrowDown}')
    expect(options[1]).toBeChecked()
  })

  it('renders a text field for text problems with a labelled control', () => {
    seed({ problems: [{ ...makeValidPack().problems[2] }] })
    renderProblem('vault-00-calibration', 'fx-03-core-alignment')
    expect(screen.getByPlaceholderText(/enter resolution key/i)).toBeInTheDocument()
  })
})

describe('ProblemPage — statement rendering', () => {
  it('renders markdown safely (bold survives, raw HTML does not)', () => {
    const problem = {
      ...makeValidPack().problems[0],
      statementMarkdown:
        'Pulse **strength** matters.\n\n<script>window.__pwned = true</script>\n\nSolve $f(n)$.',
    }
    seed({ problems: [problem] })
    renderProblem('vault-00-calibration', 'fx-01-signal-check')
    expect(screen.getByText('strength').tagName).toBe('STRONG')
    expect(document.querySelector('script')).toBeNull()
    expect(window).not.toHaveProperty('__pwned')
    expect(document.querySelector('.katex')).not.toBeNull()
  })

  it('renders malformed statements and hints without crashing', () => {
    const problem = {
      ...makeValidPack().problems[0],
      statementMarkdown: '$unclosed math and [[broken]] links',
      hints: [''],
    }
    seed({ problems: [problem] })
    expect(() =>
      renderProblem('vault-00-calibration', 'fx-01-signal-check'),
    ).not.toThrow()
  })
})

describe('ProblemPage — submission flow', () => {
  it('disables submit until input exists, then awards points on a correct key', async () => {
    seed()
    renderProblem('vault-00-calibration', 'fx-01-signal-check')
    const input = screen.getByPlaceholderText(/enter numeric key/i)
    const submit = screen.getByRole('button', { name: /submit key/i })
    expect(submit).toBeDisabled()

    await userEvent.type(input, '6')
    expect(submit).toBeEnabled()
    await userEvent.click(submit)
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))

    expect(await screen.findByText(/signal locked/i)).toBeInTheDocument()

    // base 120 + full time bonus (instant solve, 180s window) = 180.
    const s = useGameStore.getState()
    expect(s.totalPoints).toBe(180)
    expect(s.currentStreak).toBe(1)
    expect(s.completedProblems).toContain('fx-01-signal-check')

    // Double submission is impossible: transmit controls are replaced.
    expect(screen.queryByRole('button', { name: /submit key/i })).not.toBeInTheDocument()
    expect(s.attemptLog).toHaveLength(1)
  })

  it('rejects a wrong numeric key, resets streak and awards nothing', async () => {
    seed()
    useGameStore.setState({ currentStreak: 4, bestStreak: 6 })
    renderProblem('vault-00-calibration', 'fx-01-signal-check')
    await userEvent.type(screen.getByPlaceholderText(/enter numeric key/i), '999')
    await userEvent.click(screen.getByRole('button', { name: /submit key/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))

    expect(await screen.findByText(/no sync/i)).toBeInTheDocument()
    const s = useGameStore.getState()
    expect(s.totalPoints).toBe(0)
    expect(s.currentStreak).toBe(0)
    // bestStreak is preserved after a miss.
    expect(s.bestStreak).toBe(6)
  })

  it('rejects unparseable numeric keys with dedicated feedback', async () => {
    seed()
    renderProblem('vault-00-calibration', 'fx-01-signal-check')
    await userEvent.type(screen.getByPlaceholderText(/enter numeric key/i), 'six!')
    await userEvent.click(screen.getByRole('button', { name: /submit key/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(await screen.findByText(/key rejected/i)).toBeInTheDocument()
  })

  it('gives close feedback inside double tolerance but awards nothing', async () => {
    const problem = {
      ...makeValidPack().problems[0],
      answer: { type: 'numeric' as const, value: 10, tolerance: 0.5 },
    }
    seed({ problems: [problem] })
    renderProblem('vault-00-calibration', 'fx-01-signal-check')
    await userEvent.type(screen.getByPlaceholderText(/enter numeric key/i), '10.9')
    await userEvent.click(screen.getByRole('button', { name: /submit key/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(await screen.findByText(/close signal/i)).toBeInTheDocument()
    expect(useGameStore.getState().totalPoints).toBe(0)
  })

  it('accepts a correct choice selection', async () => {
    seed({ problems: [{ ...makeValidPack().problems[1] }] })
    renderProblem('vault-00-calibration', 'fx-02-broken-relay')
    await userEvent.click(screen.getAllByRole('radio')[0]) // opt-a is correct
    await userEvent.click(screen.getByRole('button', { name: /submit key/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(await screen.findByText(/signal locked/i)).toBeInTheDocument()
    expect(useGameStore.getState().totalPoints).toBe(150)
  })

  it('applies the hint penalty to earned points', async () => {
    seed()
    renderProblem('vault-00-calibration', 'fx-01-signal-check')
    // Reveal one hint channel through the drawer.
    await userEvent.click(screen.getByRole('button', { name: /hints \(0\/2\)/i }))
    await userEvent.click(screen.getByRole('button', { name: /reveal next channel/i }))
    expect(useGameStore.getState().hintsUsed).toBe(1)

    await userEvent.type(screen.getByPlaceholderText(/enter numeric key/i), '6')
    await userEvent.click(screen.getByRole('button', { name: /submit key/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))

    expect(await screen.findByText(/signal locked/i)).toBeInTheDocument()
    // base 120 + 60 time bonus − 12 hint penalty (10%) = 168.
    expect(useGameStore.getState().totalPoints).toBe(168)
  })

  it('cancelling the confirm modal does not record an attempt', async () => {
    seed()
    renderProblem('vault-00-calibration', 'fx-01-signal-check')
    await userEvent.type(screen.getByPlaceholderText(/enter numeric key/i), '6')
    await userEvent.click(screen.getByRole('button', { name: /submit key/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(useGameStore.getState().attemptLog).toHaveLength(0)
    // Modal closed; runner still active.
    expect(screen.getByRole('button', { name: /submit key/i })).toBeInTheDocument()
  })

  it('navigates to the next node after clearing, and results after the last node', async () => {
    const pack = seed({
      problems: [
        { ...makeValidPack().problems[0], id: 'a-first' },
        { ...makeValidPack().problems[2], id: 'z-last', kind: 'text', answer: { type: 'text', acceptedAnswers: ['24'] } },
      ],
    })
    void pack
    renderProblem('vault-00-calibration', 'a-first')
    await userEvent.type(screen.getByPlaceholderText(/enter numeric key/i), '6')
    await userEvent.click(screen.getByRole('button', { name: /submit key/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    await userEvent.click(await screen.findByRole('button', { name: /next node/i }))
    // Now on the second (last) problem — its title appears in both the
    // breadcrumb and the heading, so scope to the heading.
    expect(screen.getAllByText(/core alignment/i).length).toBeGreaterThan(0)
    await userEvent.type(screen.getByPlaceholderText(/enter resolution key/i), '24')
    await userEvent.click(screen.getByRole('button', { name: /submit key/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    await userEvent.click(await screen.findByRole('button', { name: /run debrief/i }))
    expect(screen.getByTestId('results-route')).toBeInTheDocument()
  })
})

describe('ProblemPage — timer expiry', () => {
  it('locks the window and records a failed attempt when time runs out', async () => {
    vi.useFakeTimers()
    seed()
    renderProblem('vault-00-calibration', 'fx-01-signal-check')
    expect(screen.getByRole('timer')).toHaveTextContent('T-03:00')

    await act(async () => {
      vi.advanceTimersByTime(181000)
    })

    // The window is closed; transmit is replaced by move-on controls.
    expect(screen.queryByRole('button', { name: /submit key/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next node/i })).toBeInTheDocument()
    const s = useGameStore.getState()
    expect(s.attemptLog).toHaveLength(1)
    expect(s.attemptLog[0].correct).toBe(false)
    expect(s.currentStreak).toBe(0)
  }, 15000)
})

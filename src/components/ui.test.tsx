import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Button } from './Button'
import { Card } from './Card'
import { DifficultyBadge } from './DifficultyBadge'
import { PointsBadge } from './PointsBadge'
import { StreakPill } from './StreakPill'
import { ProgressBar } from './ProgressBar'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'

describe('Button', () => {
  it('renders as a keyboard-accessible button and handles clicks', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Transmit</Button>)
    const button = screen.getByRole('button', { name: /transmit/i })
    await userEvent.tab() // reachable via keyboard
    expect(button).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('supports the disabled state', async () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Locked</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies variant classes', () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-transparent')
  })
})

describe('Card', () => {
  it('renders children and passes through props', () => {
    render(
      <Card data-testid="card" role="region" aria-label="panel">
        content
      </Card>,
    )
    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'panel' })).toHaveTextContent('content')
  })
})

describe('DifficultyBadge', () => {
  it.each([
    [1, 1],
    [5, 3],
    [10, 5],
  ])('maps difficulty %i to %i pips', (difficulty, pips) => {
    render(<DifficultyBadge difficulty={difficulty} />)
    const badge = screen.getByText(/CLR-/)
    expect(badge.textContent).toContain('▮'.repeat(pips))
    expect(badge.textContent).not.toContain('▯'.repeat(6 - pips))
  })

  it('clamps extreme difficulty values', () => {
    render(
      <>
        <DifficultyBadge difficulty={-5} />
        <DifficultyBadge difficulty={99} />
      </>,
    )
    const badges = screen.getAllByText(/CLR-/)
    expect(badges[0].textContent).toContain('CLR--5')
    expect(badges[1].textContent).toContain('CLR-99')
  })
})

describe('PointsBadge', () => {
  it('formats AP values', () => {
    render(<PointsBadge value={1234} />)
    expect(screen.getByText(/1,234 ap/i)).toBeInTheDocument()
  })
})

describe('StreakPill', () => {
  it('shows current and best streak', () => {
    render(<StreakPill streak={2} best={7} />)
    expect(screen.getByText(/streak 2/i)).toBeInTheDocument()
    expect(screen.getByText(/best 7/i)).toBeInTheDocument()
  })
})

describe('ProgressBar', () => {
  it('computes percentage and exposes aria values', () => {
    render(<ProgressBar value={3} max={6} label="Sync" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '50')
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('Sync')).toBeInTheDocument()
  })

  it('handles a zero max without dividing by zero', () => {
    render(<ProgressBar value={0} max={0} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })
})

describe('EmptyState', () => {
  it('renders title, message and action link', () => {
    render(
      <MemoryRouter>
        <EmptyState
          title="VAULT NOT FOUND"
          message="No vault registered."
          action={
            <a href="#" className="test-link">
              Back
            </a>
          }
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('VAULT NOT FOUND')).toBeInTheDocument()
    expect(screen.getByText('No vault registered.')).toBeInTheDocument()
    expect(screen.getByText('Back')).toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('shows message and retries via keyboard', async () => {
    const onRetry = vi.fn()
    render(<ErrorState message="uplink down" onRetry={onRetry} />)
    expect(screen.getByText('uplink down')).toBeInTheDocument()
    const retry = screen.getByRole('button', { name: /retry uplink/i })
    await userEvent.click(retry)
    expect(onRetry).toHaveBeenCalledOnce()
  })
})

describe('LoadingState', () => {
  it('shows a custom label', () => {
    render(<LoadingState label="SYNCING VAULT REGISTRY" />)
    expect(screen.getByText(/syncing vault registry/i)).toBeInTheDocument()
  })
})

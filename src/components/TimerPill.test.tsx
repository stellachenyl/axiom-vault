import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimerPill } from './TimerPill'
import { timerPhase } from '@/lib/tension'

afterEach(() => {
  vi.useRealTimers()
})

describe('timerPhase mapping', () => {
  it('is idle without a limit regardless of fraction', () => {
    expect(timerPhase(false, 1)).toBe('idle')
    expect(timerPhase(false, 0)).toBe('idle')
  })

  it('stays elevated above 20% remaining', () => {
    expect(timerPhase(true, 1)).toBe('elevated')
    expect(timerPhase(true, 0.5)).toBe('elevated')
    expect(timerPhase(true, 0.25)).toBe('elevated')
  })

  it('goes critical under 20% remaining', () => {
    expect(timerPhase(true, 0.19)).toBe('critical')
    expect(timerPhase(true, 0)).toBe('critical')
  })
})

describe('TimerPill phase callbacks', () => {
  it('reports idle for unlimited timers', async () => {
    vi.useFakeTimers()
    const onPhaseChange = vi.fn()
    render(<TimerPill onPhaseChange={onPhaseChange} />)
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    expect(onPhaseChange).toHaveBeenCalledWith('idle')
  })

  it('walks elevated → critical as the window drains, and back to idle when stopped', async () => {
    vi.useFakeTimers()
    const onPhaseChange = vi.fn()
    const { rerender } = render(
      <TimerPill limitSeconds={100} running onPhaseChange={onPhaseChange} />,
    )

    // >50% remaining.
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(onPhaseChange).toHaveBeenCalledWith('elevated')

    // Drain to just under 20% (81s elapsed of 100).
    await act(async () => {
      vi.advanceTimersByTime(80000)
    })
    expect(onPhaseChange).toHaveBeenCalledWith('critical')

    // Submission locks the clock — tension releases to idle.
    rerender(<TimerPill limitSeconds={100} running={false} onPhaseChange={onPhaseChange} />)
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(onPhaseChange).toHaveBeenLastCalledWith('idle')
  })

  it('does not repeat the same phase callback every tick', async () => {
    vi.useFakeTimers()
    const onPhaseChange = vi.fn()
    render(<TimerPill limitSeconds={100} running onPhaseChange={onPhaseChange} />)
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })
    // Only the initial transition should have fired.
    expect(onPhaseChange).toHaveBeenCalledTimes(1)
  })

  it('still renders the countdown clock text', async () => {
    vi.useFakeTimers()
    render(<TimerPill limitSeconds={90} />)
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('T-01:28')
  })
})

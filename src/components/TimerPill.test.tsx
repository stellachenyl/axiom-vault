import { act } from 'react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimerPill } from './TimerPill'

afterEach(() => {
  vi.useRealTimers()
})

describe('TimerPill — countdown mode', () => {
  it('counts down when a limit is set', async () => {
    vi.useFakeTimers()
    render(<TimerPill limitSeconds={90} />)
    expect(screen.getByRole('timer')).toHaveTextContent('T-01:30')
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('T-01:25')
  })

  it('fires onExpire exactly once when the window closes', async () => {
    vi.useFakeTimers()
    const onExpire = vi.fn()
    render(<TimerPill limitSeconds={3} running onExpire={onExpire} />)
    await act(async () => {
      vi.advanceTimersByTime(3100)
    })
    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('timer')).toHaveTextContent('T-00:00')
  })

  it('stops counting when running=false', async () => {
    vi.useFakeTimers()
    const onExpire = vi.fn()
    render(<TimerPill limitSeconds={5} running={false} onExpire={onExpire} />)
    await act(async () => {
      vi.advanceTimersByTime(10000)
    })
    expect(onExpire).not.toHaveBeenCalled()
    expect(screen.getByRole('timer')).toHaveTextContent('T-00:05')
  })

  it('never shows a negative remaining time', async () => {
    vi.useFakeTimers()
    render(<TimerPill limitSeconds={2} />)
    await act(async () => {
      vi.advanceTimersByTime(60000)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('T-00:00')
  })
})

describe('TimerPill — elapsed mode', () => {
  it('counts up when no limit is set', async () => {
    vi.useFakeTimers()
    render(<TimerPill />)
    expect(screen.getByRole('timer')).toHaveTextContent('T+00:00')
    await act(async () => {
      vi.advanceTimersByTime(65000)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('T+01:05')
  })
})

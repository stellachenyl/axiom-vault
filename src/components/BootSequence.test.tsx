import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BootSequence } from './BootSequence'
import { hasBootedThisSession } from '@/lib/bootSession'

beforeEach(() => {
  window.sessionStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

function renderBoot(onComplete = vi.fn()) {
  return { onComplete, ...render(<BootSequence onComplete={onComplete} />) }
}

describe('BootSequence', () => {
  it('renders boot lines progressively over ~3 seconds', async () => {
    vi.useFakeTimers()
    renderBoot()

    // First line appears almost immediately.
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.getByText(/BIOS v0.4/)).toBeInTheDocument()
    expect(screen.queryByText(/Clearance granted/i)).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText(/Initializing containment grid/i)).toBeInTheDocument()
    expect(screen.getByText(/Verifying Zod schemas/i)).toBeInTheDocument()
    expect(screen.getByText(/Syncing GitHub manifest/i)).toBeInTheDocument()
    expect(screen.getByText(/Clearance granted/i)).toBeInTheDocument()
  })

  it('calls onComplete after the full sequence and marks the session', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    renderBoot(onComplete)

    await act(async () => {
      vi.advanceTimersByTime(3100)
    })
    expect(onComplete).toHaveBeenCalledOnce()
    expect(hasBootedThisSession()).toBe(true)
  })

  it('adds a fade-out class before completing', async () => {
    vi.useFakeTimers()
    renderBoot()
    await act(async () => {
      vi.advanceTimersByTime(2700)
    })
    expect(screen.getByTestId('boot-sequence').className).toContain('opacity-0')
  })

  it('can be skipped with a key press', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    renderBoot(onComplete)
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Enter' })
    })
    expect(onComplete).toHaveBeenCalledOnce()
    expect(hasBootedThisSession()).toBe(true)
  })

  it('can be skipped with a click', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<BootSequence onComplete={onComplete} />)
    await act(async () => {
      vi.advanceTimersByTime(100)
    })
    // Real clicks begin with a pointerdown — that is what the listener uses.
    await act(async () => {
      fireEvent.pointerDown(window)
    })
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('does not replay when the session flag is already set', () => {
    window.sessionStorage.setItem('axiom-vault-booted', '1')
    expect(hasBootedThisSession()).toBe(true)
    // App-level guard (App.tsx) uses this to skip rendering BootSequence.
  })

  it('survives unavailable sessionStorage without trapping users', () => {
    const original = window.sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem() {
          throw new Error('blocked')
        },
        setItem() {
          throw new Error('blocked')
        },
      },
      configurable: true,
    })
    try {
      // Treated as "already booted" so users are never stuck behind the overlay.
      expect(hasBootedThisSession()).toBe(true)
    } finally {
      Object.defineProperty(window, 'sessionStorage', { value: original, configurable: true })
    }
  })

  it('completes asynchronously even when timers are real', async () => {
    const onComplete = vi.fn()
    render(<BootSequence onComplete={onComplete} />)
    fireEvent.pointerDown(window)
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledOnce())
  })
})

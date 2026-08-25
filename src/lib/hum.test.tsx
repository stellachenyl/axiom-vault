import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { humEngine } from './hum'
import { SystemHumToggle } from '@/components/SystemHumToggle'

// jsdom has no Web Audio — the engine must no-op gracefully without it.
beforeEach(() => {
  window.localStorage.clear()
  humEngine.resetForTest()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('humEngine (no AudioContext available)', () => {
  it('reports preference persistence', () => {
    expect(humEngine.preferred).toBe(false)
    humEngine.setPreference(true)
    expect(humEngine.preferred).toBe(true)
    humEngine.setPreference(false)
    expect(humEngine.preferred).toBe(false)
  })

  it('setEnabled resolves safely without a Web Audio context', async () => {
    // Graceful degradation: the preference is kept, no audio graph is built.
    await expect(humEngine.setEnabled(true)).resolves.toBeUndefined()
    expect(humEngine.isEnabled).toBe(true)
    await expect(humEngine.setEnabled(false)).resolves.toBeUndefined()
    expect(humEngine.isEnabled).toBe(false)
  })

  it('setPhase is safe to call at any time', () => {
    expect(() => {
      humEngine.setPhase('elevated')
      humEngine.setPhase('critical')
      humEngine.setPhase('idle')
    }).not.toThrow()
  })
})

describe('SystemHumToggle', () => {
  it('renders an off-by-default accessible switch', () => {
    render(<SystemHumToggle />)
    const toggle = screen.getByRole('switch', { name: /system hum/i })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText(/hum off/i)).toBeInTheDocument()
  })

  it('toggles on click and persists the preference', async () => {
    render(<SystemHumToggle />)
    const toggle = screen.getByRole('switch', { name: /system hum/i })

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(humEngine.preferred).toBe(true)

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(humEngine.preferred).toBe(false)
  })
})

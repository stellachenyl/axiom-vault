import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DevAccess } from './DevAccess'
import { isDevUnlocked, lockDev, unlockDev } from '@/lib/devAccess'

describe('DevAccess gate', () => {
  it('blocks the console for normal visitors', () => {
    lockDev()
    render(
      <MemoryRouter>
        <DevAccess>
          <div data-testid="console">DEV CONSOLE</div>
        </DevAccess>
      </MemoryRouter>,
    )
    expect(screen.queryByTestId('console')).not.toBeInTheDocument()
    expect(screen.getByText('SECTOR OFFLINE')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /return to mission select/i }),
    ).toHaveAttribute('href', '/')
  })

  it('renders the console once unlocked', () => {
    unlockDev()
    render(
      <MemoryRouter>
        <DevAccess>
          <div data-testid="console">DEV CONSOLE</div>
        </DevAccess>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('console')).toBeInTheDocument()
    lockDev()
  })

  it('reflects flag state through isDevUnlocked', () => {
    lockDev()
    expect(isDevUnlocked()).toBe(false)
    unlockDev()
    expect(isDevUnlocked()).toBe(true)
    lockDev()
    expect(isDevUnlocked()).toBe(false)
  })
})

describe('secret operator code', () => {
  it('typing "axiom" outside a field unlocks and navigates to /dev', async () => {
    lockDev()
    const { AppShell } = await import('./AppShell')
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/dev" element={<div data-testid="dev-route">CONSOLE</div>} />
            <Route path="*" element={<div data-testid="home">HOME</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('home')).toBeInTheDocument()
    await userEvent.keyboard('axiom')
    expect(isDevUnlocked()).toBe(true)
    expect(screen.getByTestId('dev-route')).toBeInTheDocument()
    lockDev()
  })

  it('never triggers while typing inside an input field', async () => {
    lockDev()
    const { AppShell } = await import('./AppShell')
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              path="*"
              element={<input type="text" aria-label="answer field" />}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    const input = screen.getByLabelText('answer field')
    input.focus()
    await userEvent.type(input, 'axiom')
    expect(isDevUnlocked()).toBe(false)
    expect(screen.queryByTestId('dev-route')).not.toBeInTheDocument()
  })
})

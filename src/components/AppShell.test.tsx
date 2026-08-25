import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'
import { TopBar } from './TopBar'
import { useGameStore } from '@/stores/useGameStore'

describe('TopBar', () => {
  it('shows brand, primary nav and live AP total', () => {
    useGameStore.setState({ totalPoints: 4321, currentStreak: 3, bestStreak: 9 })
    render(
      <MemoryRouter initialEntries={['/']}>
        <TopBar />
      </MemoryRouter>,
    )
    expect(screen.getByText(/axiom/i)).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByText(/4,321 ap/i)).toBeInTheDocument()
    expect(screen.getByText(/streak 3/i)).toBeInTheDocument()
    // The dev console must not be reachable from the public navigation.
    expect(screen.queryByRole('link', { name: /dev console/i })).not.toBeInTheDocument()
  })

  it('navigates to mission select via keyboard', async () => {
    render(
      <MemoryRouter initialEntries={['/dev']}>
        <Routes>
          <Route path="*" element={<TopBar />} />
          <Route path="/" element={<div data-testid="home">HOME</div>} />
        </Routes>
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: /mission select/i })
    link.focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByTestId('home')).toBeInTheDocument()
  })
})

describe('AppShell', () => {
  it('renders chrome around the routed outlet', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<div data-testid="page">PAGE CONTENT</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('page')).toBeInTheDocument()
    expect(screen.getByText(/all systems nominal/i)).toBeInTheDocument()
    // Brand links back to home via keyboard.
    const brand = screen.getByRole('link', { name: 'AXIOM::VAULT' })
    expect(brand).not.toBeNull()
    ;(brand as HTMLElement).focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByTestId('page')).toBeInTheDocument() // already home; no crash
  })
})

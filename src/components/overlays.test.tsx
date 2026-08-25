import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HintDrawer } from './HintDrawer'
import { Modal } from './Modal'

describe('HintDrawer', () => {
  const hints = ['Channel alpha hint.', 'Channel beta hint.']

  function setup(overrides: Partial<Parameters<typeof HintDrawer>[0]> = {}) {
    const props = {
      open: true,
      hints,
      revealedCount: 0,
      onReveal: vi.fn(),
      onClose: vi.fn(),
      ...overrides,
    }
    render(<HintDrawer {...props} />)
    return props
  }

  it('reveals channels one at a time with a penalty note', async () => {
    const props = setup({ revealedCount: 1 })
    expect(screen.getByText('Channel alpha hint.')).toBeInTheDocument()
    expect(screen.queryByText('Channel beta hint.')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /reveal next channel/i }))
    expect(props.onReveal).toHaveBeenCalledOnce()
    // Penalty preview is shown for the NEXT channel (B = 2nd → 50 AP).
    expect(screen.getByText(/50 ap penalty/i)).toBeInTheDocument()
  })

  it('closes via the close button', async () => {
    const props = setup()
    await userEvent.click(screen.getByRole('button', { name: /close hints/i }))
    expect(props.onClose).toHaveBeenCalledOnce()
  })

  it('closes via the Escape key', async () => {
    const props = setup()
    await userEvent.keyboard('{Escape}')
    expect(props.onClose).toHaveBeenCalledOnce()
  })

  it('shows a fallback when a node has no hint channels', () => {
    setup({ hints: [] })
    expect(screen.getByText(/no hint channels/i)).toBeInTheDocument()
  })

  it('hides the reveal button once every channel is out', () => {
    setup({ revealedCount: 2 })
    expect(screen.queryByRole('button', { name: /reveal next channel/i })).not.toBeInTheDocument()
  })
})

describe('Modal', () => {
  function setup(open = true) {
    const onClose = vi.fn()
    render(
      <Modal open={open} title="Transmit resolution key?" onClose={onClose}>
        <p>modal body</p>
      </Modal>,
    )
    return { onClose }
  }

  it('renders title and body when open', () => {
    setup()
    expect(screen.getByRole('heading', { name: /transmit resolution key/i })).toBeInTheDocument()
    expect(screen.getByText('modal body')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    setup(false)
    expect(screen.queryByText('modal body')).not.toBeInTheDocument()
  })

  it('closes on backdrop click and Escape', async () => {
    const { onClose } = setup()
    await userEvent.click(screen.getByTestId('modal-backdrop'))
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

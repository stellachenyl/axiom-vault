import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MathText } from './MathText'

function renderedHtml(source: string): string {
  const { container } = render(<MathText source={source} />)
  return container.innerHTML
}

describe('MathText — markdown', () => {
  it('renders basic markdown formatting', () => {
    render(<MathText source={'**bold** and *italic*'} />)
    expect(screen.getByText('bold').tagName).toBe('STRONG')
    expect(screen.getByText('italic').tagName).toBe('EM')
  })

  it('renders lists and links', () => {
    const html = renderedHtml('Item one\n\n- alpha\n- beta\n\n[site](https://example.test)')
    expect(html).toContain('<li>')
    expect(html).toContain('href="https://example.test"')
  })
})

describe('MathText — LaTeX', () => {
  it('renders inline LaTeX via KaTeX', () => {
    const html = renderedHtml('Pulse $f(n) = 3f(n-1) + 2$ grows.')
    expect(html).toContain('katex')
    expect(screen.getAllByText(/3/).length).toBeGreaterThan(0)
  })

  it('renders block LaTeX without crashing in jsdom', () => {
    const html = renderedHtml('$$\\frac{1}{2} + \\frac{1}{3}$$')
    expect(html).toContain('katex')
  })

  it('falls back to raw TeX if KaTeX throws', () => {
    // "\\error" is not a valid command; throwOnError:false renders it as
    // text instead of throwing, so the UI survives.
    const html = renderedHtml('$\\notacommand{xyz}$')
    expect(html).toContain('katex')
  })
})

describe('MathText — security', () => {
  it('strips script tags from malicious markdown', () => {
    const html = renderedHtml('Hello <script>window.__pwned = true</script>')
    expect(html).not.toContain('<script')
    expect(window).not.toHaveProperty('__pwned')
  })

  it('strips event handler attributes', () => {
    const html = renderedHtml('<img src=x onerror="window.__pwned = true">')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('window.__pwned')
  })

  it('neutralizes javascript: links', () => {
    const html = renderedHtml('[click me](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
    // The link text survives; only the dangerous href is removed.
    expect(screen.getByText('click me')).toBeInTheDocument()
  })

  it('strips iframe/object injection', () => {
    const html = renderedHtml('<iframe src="https://evil.test"></iframe><object data="x"></object>')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<object')
  })

  it('does not execute math tokens containing HTML', () => {
    const html = renderedHtml('$<script>alert(1)</script>$')
    expect(html).not.toContain('<script')
  })
})

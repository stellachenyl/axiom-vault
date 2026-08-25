import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import katex from 'katex'
import { cn } from '@/lib/format'
import 'katex/dist/katex.min.css'

interface MathSegment {
  tex: string
  display: boolean
}

/**
 * Renders problem content as Markdown with inline ($...$) and block
 * ($$...$$) LaTeX. Pipeline:
 *
 *   1. math segments are extracted and replaced with placeholder tokens
 *   2. the remaining markdown is converted to HTML (marked)
 *   3. the HTML is sanitized (DOMPurify) — this is what gets injected
 *   4. KaTeX output is generated per token and inserted into the DOM tree
 *      in memory, then the final serialized HTML is rendered.
 *
 * TeX never passes through the markdown parser and all author HTML is
 * stripped by DOMPurify before anything touches the document.
 */
function renderMathMarkdown(source: string): string {
  const segments: MathSegment[] = []

  const tokenized = source
    .replace(/\$\$([\s\S]+?)\$\$/g, (_match, tex: string) => {
      segments.push({ tex, display: true })
      return `<span data-math-token="${segments.length - 1}"></span>`
    })
    .replace(/\$([^$\n]+?)\$/g, (_match, tex: string) => {
      segments.push({ tex, display: false })
      return `<span data-math-token="${segments.length - 1}"></span>`
    })

  const rawHtml = marked.parse(tokenized, { async: false })
  const cleanHtml = DOMPurify.sanitize(rawHtml)

  const doc = new DOMParser().parseFromString(cleanHtml, 'text/html')
  doc.querySelectorAll('[data-math-token]').forEach((el) => {
    const index = Number(el.getAttribute('data-math-token'))
    const segment = segments[index]
    if (!segment || Number.isNaN(index)) return
    try {
      el.innerHTML = katex.renderToString(segment.tex, {
        displayMode: segment.display,
        throwOnError: false,
        strict: false,
      })
    } catch {
      el.textContent = segment.tex
    }
  })

  return doc.body.innerHTML
}

export function MathText({ source, className }: { source: string; className?: string }) {
  const html = useMemo(() => renderMathMarkdown(source), [source])
  return (
    <div
      className={cn('leading-relaxed [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

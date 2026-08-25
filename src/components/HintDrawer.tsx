import { useEffect } from 'react'
import { cn } from '@/lib/format'

interface HintDrawerProps {
  open: boolean
  hints: string[]
  revealedCount: number
  onReveal: () => void
  onClose: () => void
}

export function HintDrawer({ open, hints, revealedCount, onReveal, onClose }: HintDrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        'fixed top-0 right-0 z-40 h-full w-full max-w-sm border-l border-edge-bright bg-panel p-6 transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full',
      )}
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm tracking-widest text-warn uppercase">// HINT PROTOCOL</h2>
        <button
          onClick={onClose}
          className="cursor-pointer text-ink-dim hover:text-ink"
          aria-label="Close hints"
        >
          ✕
        </button>
      </div>

      {hints.length === 0 ? (
        <p className="text-xs text-ink-dim">No hint channels for this node.</p>
      ) : (
        <ul className="space-y-4">
          {hints.slice(0, revealedCount).map((hint, i) => (
            <li key={i} className="rounded border border-edge bg-panel-raised p-3 text-xs leading-relaxed text-ink-dim">
              <span className="mb-1 block text-[10px] tracking-widest text-warn uppercase">
                Channel {String.fromCharCode(65 + i)}
              </span>
              {hint}
            </li>
          ))}
        </ul>
      )}

      {revealedCount < hints.length && (
        <button
          onClick={onReveal}
          className="mt-6 w-full cursor-pointer rounded border border-warn px-4 py-2 text-xs tracking-widest text-warn uppercase transition-colors hover:bg-warn/10"
        >
          Reveal next channel ({hintsUsedPenalty(revealedCount)} AP penalty)
        </button>
      )}
    </aside>
  )
}

function hintsUsedPenalty(revealedCount: number): number {
  return (revealedCount + 1) * 25
}
